import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { STRATEGY_SYSTEM_PROMPT, buildStrategyUserPrompt, buildAbStrategyUserPrompt } from "@/lib/ai/prompts/strategy";
import { buildBrandContext, buildNewbeeInsightContext, buildExternalContext, buildPerformanceContext, buildCodeContext } from "@/lib/ai/prompts/brand-context";
import { strategyResponseSchema, abStrategyResponseSchema, parseAiJson } from "@/lib/ai/response-schemas";
import { fetchNewbeeInsights } from "@/lib/newbee/insights";
import { scrapeUrl, scrapeGithubRepo, isGithubUrl } from "@/lib/scraping/url-scraper";
import { summarizeContext } from "@/lib/scraping/context-summarizer";
import type { Project, BrandKit, CampaignPerformance, CodeAnalysis } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  ab_mode: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    // Rate limit
    const rl = checkRateLimit(user.id, "ai-gemini");
    if (!rl.allowed) {
      return NextResponse.json({ error: rl.error }, { status: 429 });
    }

    const serviceClient = createServiceClient();

    // Budget guard
    const budget = await checkBudget(serviceClient, user.id);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    // Input validation
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { projectId, ab_mode } = parsed.data;

    // Fetch project
    const { data: projectData, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    const project = projectData as Project | null;

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch brand kit if linked
    let brandKit: BrandKit | null = null;
    if (project.brand_kit_id) {
      const { data } = await serviceClient
        .from("mkt_brand_kit")
        .select("*")
        .eq("id", project.brand_kit_id)
        .single();
      brandKit = data as BrandKit | null;
    }

    // Fetch Newbee insights
    const insights = await fetchNewbeeInsights();

    // Build context
    const brandContext = buildBrandContext(brandKit);
    const insightContext = buildNewbeeInsightContext(insights);

    // Fetch external context if source_url exists
    let externalContext = "";
    if (project.source_url) {
      try {
        const scraped = isGithubUrl(project.source_url)
          ? await scrapeGithubRepo(project.source_url)
          : await scrapeUrl(project.source_url);
        const summarized = await summarizeContext(scraped);
        externalContext = buildExternalContext(summarized);
      } catch (err) {
        console.warn("Failed to fetch external context:", err);
      }
    }

    // Fetch performance context if campaign is linked
    let performanceContext = "";
    if (project.campaign_id) {
      const { data: perfData } = await serviceClient
        .from("mkt_campaign_performance")
        .select("*")
        .eq("campaign_id", project.campaign_id)
        .order("date", { ascending: false })
        .limit(30);

      if (perfData && perfData.length > 0) {
        performanceContext = buildPerformanceContext(perfData as CampaignPerformance[]);
      }
    }

    // Fetch code context if linked
    let codeContext = "";
    if (project.code_context_id) {
      const { data: codeCtx } = await serviceClient
        .from("mkt_code_contexts")
        .select("analysis")
        .eq("id", project.code_context_id)
        .single();
      if (codeCtx?.analysis) {
        codeContext = buildCodeContext(codeCtx.analysis as CodeAnalysis);
      }
    }

    // Build prompt params
    const promptParams = {
      productName: project.product_name,
      productDescription: project.product_description,
      targetPlatforms: project.target_platforms,
      targetAudience: project.target_audience,
      languages: project.languages,
      style: project.style,
      tone: project.tone,
      additionalNotes: project.additional_notes,
      brandContext,
      insightContext,
      externalContext,
      performanceContext,
      codeContext,
    };

    if (ab_mode) {
      // A/B Mode: Generate two strategies
      const userPrompt = buildAbStrategyUserPrompt(promptParams);

      const response = await ai.models.generateContent({
        model: MODELS.GEMINI_PRO,
        contents: userPrompt,
        config: {
          systemInstruction: STRATEGY_SYSTEM_PROMPT,
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "";
      const abStrategy = parseAiJson(text, abStrategyResponseSchema);

      // Update parent project with Version A strategy
      await serviceClient
        .from("mkt_projects")
        .update({
          strategy: JSON.parse(JSON.stringify(abStrategy.version_a)),
          status: "strategy_ready" as const,
          current_step: 2,
        })
        .eq("id", projectId);

      // Create or update variant project for Version B
      const { data: existingVariant } = await serviceClient
        .from("mkt_projects")
        .select("id")
        .eq("parent_project_id", projectId)
        .eq("is_ab_variant", true)
        .single();

      let variantId: string;

      if (existingVariant) {
        variantId = existingVariant.id;
        await serviceClient
          .from("mkt_projects")
          .update({
            strategy: JSON.parse(JSON.stringify(abStrategy.version_b)),
            status: "strategy_ready" as const,
            current_step: 2,
          })
          .eq("id", variantId);
      } else {
        const { data: newVariant } = await serviceClient
          .from("mkt_projects")
          .insert({
            user_id: user.id,
            campaign_id: project.campaign_id,
            brand_kit_id: project.brand_kit_id,
            title: `${project.title} (B)`,
            product_name: project.product_name,
            product_description: project.product_description,
            target_platforms: project.target_platforms,
            target_audience: project.target_audience,
            languages: project.languages,
            style: project.style,
            tone: project.tone,
            additional_notes: project.additional_notes,
            source_url: project.source_url,
            code_context_id: project.code_context_id,
            strategy: JSON.parse(JSON.stringify(abStrategy.version_b)),
            status: "strategy_ready" as const,
            current_step: 2,
            is_ab_variant: true,
            parent_project_id: projectId,
          })
          .select("id")
          .single();

        if (!newVariant?.id) {
          return NextResponse.json({ error: "Failed to create A/B variant project" }, { status: 500 });
        }
        variantId = newVariant.id;
      }

      // Save versions
      await saveVersion(serviceClient, projectId, abStrategy.version_a, "A/B Test: Version A (Emotional)");
      if (variantId) {
        await saveVersion(serviceClient, variantId, abStrategy.version_b, "A/B Test: Version B (Technical)");
      }

      // Log usage
      await logUsage(serviceClient, user.id, projectId, response);

      return NextResponse.json({
        ab_mode: true,
        version_a: { projectId, strategy: abStrategy.version_a },
        version_b: { projectId: variantId, strategy: abStrategy.version_b },
      });
    } else {
      // Standard single strategy mode
      const userPrompt = buildStrategyUserPrompt(promptParams);

      const response = await ai.models.generateContent({
        model: MODELS.GEMINI_PRO,
        contents: userPrompt,
        config: {
          systemInstruction: STRATEGY_SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "";
      const strategy = parseAiJson(text, strategyResponseSchema);

      // Update project with strategy
      await serviceClient
        .from("mkt_projects")
        .update({
          strategy: JSON.parse(JSON.stringify(strategy)),
          status: "strategy_ready" as const,
          current_step: 2,
        })
        .eq("id", projectId);

      // Save version
      await saveVersion(serviceClient, projectId, strategy, "AI generated initial strategy");

      // Log usage
      await logUsage(serviceClient, user.id, projectId, response);

      return NextResponse.json({ strategy });
    }
  } catch (error) {
    console.error("Strategy generation error:", error);
    const message = "Failed to generate strategy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function saveVersion(
  serviceClient: ReturnType<typeof createServiceClient>,
  projectId: string,
  strategy: object,
  description: string
) {
  const { count } = await serviceClient
    .from("mkt_project_versions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("step", "strategy");

  await serviceClient.from("mkt_project_versions").insert({
    project_id: projectId,
    step: "strategy",
    version_number: (count ?? 0) + 1,
    snapshot: JSON.parse(JSON.stringify(strategy)),
    change_description: description,
  });
}

async function logUsage(
  serviceClient: ReturnType<typeof createServiceClient>,
  userId: string,
  projectId: string,
  response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }
) {
  await serviceClient.from("mkt_usage_logs").insert({
    user_id: userId,
    project_id: projectId,
    api_service: "gemini",
    model: MODELS.GEMINI_PRO,
    operation: "strategy_generation",
    input_tokens: response.usageMetadata?.promptTokenCount ?? null,
    output_tokens: response.usageMetadata?.candidatesTokenCount ?? null,
    estimated_cost_usd: estimateCost(
      response.usageMetadata?.promptTokenCount ?? 0,
      response.usageMetadata?.candidatesTokenCount ?? 0
    ),
  });
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 1.25;
  const outputCost = (outputTokens / 1_000_000) * 10.0;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
