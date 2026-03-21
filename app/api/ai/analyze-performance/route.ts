import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { parseAiJson } from "@/lib/ai/response-schemas";
import {
  PERFORMANCE_ANALYZER_SYSTEM_PROMPT,
  buildPerformanceAnalysisPrompt,
  type PerformanceAnalysisInput,
} from "@/lib/ai/prompts/performance-analyzer";
import { z } from "zod";

const performanceAnalysisSchema = z.object({
  overall_score: z.number().min(1).max(100),
  summary: z.string(),
  creative_analysis: z.object({
    best_performing: z.object({
      creative_url: z.string(),
      reason: z.string(),
    }),
    worst_performing: z.object({
      creative_url: z.string(),
      reason: z.string(),
    }),
    video_vs_image: z.object({
      winner: z.enum(["video", "image", "tie"]),
      explanation: z.string(),
    }),
  }),
  targeting_recommendations: z.object({
    age_adjustment: z.object({
      current: z.tuple([z.number(), z.number()]),
      recommended: z.tuple([z.number(), z.number()]),
      reason: z.string(),
    }),
    location_suggestions: z.array(z.string()),
    interest_additions: z.array(z.string()),
    interest_removals: z.array(z.string()),
  }),
  budget_recommendations: z.object({
    daily_budget_suggestion: z.number(),
    reallocation: z.string(),
    projected_improvement: z.string(),
  }),
  prompt_suggestions: z.object({
    new_prompts: z.array(
      z.object({
        prompt: z.string(),
        rationale: z.string(),
        style: z.enum(["emotional", "technical"]),
      })
    ),
    elements_to_keep: z.array(z.string()),
    elements_to_change: z.array(z.string()),
  }),
  ab_test_interpretation: z
    .object({
      winner: z.enum(["emotional", "technical", "inconclusive"]),
      confidence: z.string(),
      next_test_suggestion: z.string(),
    })
    .optional(),
});

export type PerformanceAnalysis = z.infer<typeof performanceAnalysisSchema>;

const requestSchema = z.object({
  campaign_id: z.string().uuid(),
  deployment_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AI null check
    if (!ai) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaign_id, deployment_id, date_from, date_to } = parsed.data;
    const serviceClient = createServiceClient();

    // 4. Fetch campaign
    const { data: campaign, error: campaignError } = await serviceClient
      .from("mkt_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // 5. Fetch performance data
    let perfQuery = serviceClient
      .from("mkt_campaign_performance")
      .select("*")
      .eq("campaign_id", campaign_id)
      .order("date", { ascending: false })
      .limit(30);

    if (deployment_id) {
      perfQuery = perfQuery.eq("deployment_id", deployment_id);
    }
    if (date_from) {
      perfQuery = perfQuery.gte("date", date_from);
    }
    if (date_to) {
      perfQuery = perfQuery.lte("date", date_to);
    }

    const { data: perfData } = await perfQuery;
    const performanceData = perfData ?? [];

    if (performanceData.length === 0) {
      return NextResponse.json(
        { error: "No performance data available for analysis" },
        { status: 422 }
      );
    }

    // 6. Fetch deployments and linked generations
    const { data: rawDeployments } = await serviceClient
      .from("mkt_ad_deployments")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("user_id", user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deployments = (rawDeployments ?? []) as any[];

    const creativeUrls = deployments.flatMap(
      (d: { creative_urls?: string[] }) => d.creative_urls || []
    );

    // Fetch generation details for creative URLs
    const { data: rawGenerations } = await serviceClient
      .from("mkt_generations")
      .select("output_url, type, prompt, aspect_ratio")
      .eq("user_id", user.id)
      .in("output_url", creativeUrls.length > 0 ? creativeUrls : [""]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generations = (rawGenerations ?? []) as any[];

    const creativeDetails = generations.map((g: { output_url?: string; type?: string; prompt?: string; aspect_ratio?: string }) => ({
      url: g.output_url || "",
      type: (g.type as "video" | "image") || "image",
      prompt: g.prompt || undefined,
      aspect_ratio: g.aspect_ratio || undefined,
    }));

    // 7. Build prompt and call Gemini Pro
    const firstDeployment = deployments[0] as Record<string, unknown> | undefined;
    const targeting = (firstDeployment?.targeting || {
      age_range: [18, 65],
      locations: [],
      interests: [],
      languages: [],
    }) as { age_range: [number, number]; locations: string[]; interests: string[] };

    const analysisInput: PerformanceAnalysisInput = {
      campaignName: (campaign as Record<string, unknown>).name as string,
      objective: (firstDeployment?.objective as string) || "OUTCOME_TRAFFIC",
      totalBudget: ((campaign as Record<string, unknown>).budget_limit_usd as number) || 0,
      spentBudget: ((campaign as Record<string, unknown>).current_spend_usd as number) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      performanceData: performanceData.map((p: any) => ({
        date: p.date,
        impressions: p.impressions || 0,
        clicks: p.clicks || 0,
        ctr: p.ctr || 0,
        conversions: p.conversions || 0,
        spend_usd: p.spend_usd || 0,
        platform: p.platform || "meta",
      })),
      creativeDetails,
      targetingConfig: {
        age_range: targeting.age_range as [number, number],
        locations: targeting.locations || [],
        interests: targeting.interests || [],
      },
      versionType:
        (firstDeployment?.version_type as
          | "emotional"
          | "technical"
          | "single") || "single",
    };

    const userPrompt = buildPerformanceAnalysisPrompt(analysisInput);

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: PERFORMANCE_ANALYZER_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    const text = response.text ?? "";
    const analysis = parseAiJson(text, performanceAnalysisSchema);

    // 8. Save analysis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastPerf = performanceData[performanceData.length - 1] as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstPerf = performanceData[0] as any;
    const dateRangeStart =
      date_from ||
      lastPerf?.date ||
      new Date().toISOString().split("T")[0];
    const dateRangeEnd =
      date_to ||
      firstPerf?.date ||
      new Date().toISOString().split("T")[0];

    // mkt_performance_analyses is a new table not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedAnalysis, error: saveError } = await (serviceClient as any)
      .from("mkt_performance_analyses")
      .insert({
        user_id: user.id,
        campaign_id,
        deployment_id: deployment_id || null,
        analysis,
        model: MODELS.GEMINI_PRO,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[AnalyzePerformance] Save error:", saveError);
    }

    // 9. Log usage
    const inputTokens = Math.ceil(
      (PERFORMANCE_ANALYZER_SYSTEM_PROMPT.length + userPrompt.length) / 4
    );
    const outputTokens = Math.ceil(text.length / 4);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini" as const,
      model: MODELS.GEMINI_PRO,
      operation: "analyze_performance",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd:
        (inputTokens / 1_000_000) * 1.25 +
        (outputTokens / 1_000_000) * 10.0,
    });

    // 10. Return
    return NextResponse.json({
      analysis,
      analysis_id: savedAnalysis?.id || null,
      model: MODELS.GEMINI_PRO,
      data_points: performanceData.length,
    });
  } catch (error) {
    console.error("[AnalyzePerformance] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze performance",
      },
      { status: 500 }
    );
  }
}
