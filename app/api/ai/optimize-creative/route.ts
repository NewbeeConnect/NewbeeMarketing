import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { parseAiJson } from "@/lib/ai/response-schemas";
import {
  CREATIVE_OPTIMIZER_SYSTEM_PROMPT,
  buildCreativeOptimizationPrompt,
} from "@/lib/ai/prompts/creative-optimizer";
import { z } from "zod";

const optimizedCreativeSchema = z.object({
  variations: z.array(
    z.object({
      prompt: z.string(),
      negative_prompt: z.string(),
      rationale: z.string(),
      expected_improvement: z.string(),
      focus_area: z.enum(["hook", "narrative", "visual_style", "cta"]),
    })
  ),
  recommended_aspect_ratios: z.array(z.string()),
  recommended_duration: z.number(),
});

const requestSchema = z.object({
  deployment_id: z.string().uuid(),
  analysis_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { deployment_id, analysis_id } = parsed.data;
    const serviceClient = createServiceClient();

    // Fetch deployment
    const { data: deployment, error: depError } = await serviceClient
      .from("mkt_ad_deployments")
      .select("*")
      .eq("id", deployment_id)
      .eq("user_id", user.id)
      .single();

    if (depError || !deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    // Fetch original generation for the first creative
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dep = deployment as any;
    const firstUrl = dep.creative_urls?.[0] as string | undefined;
    let originalPrompt = "No prompt available";
    let creativeType: "video" | "image" = "image";
    let aspectRatio = "1:1";
    let duration: number | undefined;

    if (firstUrl) {
      const { data: generation } = await serviceClient
        .from("mkt_generations")
        .select("prompt, type, aspect_ratio")
        .eq("output_url", firstUrl)
        .single();

      if (generation) {
        originalPrompt = generation.prompt || originalPrompt;
        creativeType = (generation.type as "video" | "image") || "image";
        aspectRatio = generation.aspect_ratio || "1:1";
      }
    }

    // Fetch performance metrics for this deployment
    const { data: perfData } = await serviceClient
      .from("mkt_campaign_performance")
      .select("impressions, clicks, ctr, conversions, spend_usd")
      .eq("deployment_id", deployment_id);

    const aggregated = (perfData ?? []).reduce(
      (acc, p) => ({
        impressions: acc.impressions + (p.impressions || 0),
        clicks: acc.clicks + (p.clicks || 0),
        ctr: 0, // recalculated below
        conversions: acc.conversions + (p.conversions || 0),
        spend_usd: acc.spend_usd + (p.spend_usd || 0),
      }),
      { impressions: 0, clicks: 0, ctr: 0, conversions: 0, spend_usd: 0 }
    );
    aggregated.ctr =
      aggregated.impressions > 0
        ? aggregated.clicks / aggregated.impressions
        : 0;

    // Fetch analysis insights if available
    const analysisInsights: string[] = [];
    if (analysis_id) {
      // mkt_performance_analyses is a new table not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: analysisRecord } = await (serviceClient as any)
        .from("mkt_performance_analyses")
        .select("analysis")
        .eq("id", analysis_id)
        .single();

      if (analysisRecord?.analysis) {
        const a = analysisRecord.analysis as Record<string, unknown>;
        const summary = a.summary as string | undefined;
        const elementsToChange = (
          a.prompt_suggestions as Record<string, unknown> | undefined
        )?.elements_to_change as string[] | undefined;

        if (summary) analysisInsights.push(summary);
        if (elementsToChange) analysisInsights.push(...elementsToChange);
      }
    }

    // Build targeting description
    const targeting = (dep.targeting || {
      age_range: [18, 65],
      locations: [],
      interests: [],
    }) as { age_range?: number[]; locations?: string[]; interests?: string[] };
    const targetAudience = `Age ${targeting.age_range?.[0] || 18}-${targeting.age_range?.[1] || 65}, ${targeting.locations?.join(", ") || "global"}, interests: ${targeting.interests?.join(", ") || "general"}`;

    const userPrompt = buildCreativeOptimizationPrompt({
      originalPrompt,
      creativeType,
      aspectRatio,
      duration,
      performanceMetrics: aggregated,
      analysisInsights,
      campaignObjective: (dep.objective as string) || "OUTCOME_TRAFFIC",
      targetAudience,
    });

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: CREATIVE_OPTIMIZER_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const text = response.text ?? "";
    const optimized = parseAiJson(text, optimizedCreativeSchema);

    // Log usage
    const inputTokens = Math.ceil(
      (CREATIVE_OPTIMIZER_SYSTEM_PROMPT.length + userPrompt.length) / 4
    );
    const outputTokens = Math.ceil(text.length / 4);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini" as const,
      model: MODELS.GEMINI_PRO,
      operation: "optimize_creative",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd:
        (inputTokens / 1_000_000) * 1.25 +
        (outputTokens / 1_000_000) * 10.0,
    });

    return NextResponse.json({
      optimized,
      original: {
        prompt: originalPrompt,
        type: creativeType,
        aspect_ratio: aspectRatio,
        duration,
      },
      model: MODELS.GEMINI_PRO,
    });
  } catch (error) {
    console.error("[OptimizeCreative] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to optimize creative",
      },
      { status: 500 }
    );
  }
}
