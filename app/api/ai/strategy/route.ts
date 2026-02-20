import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { STRATEGY_SYSTEM_PROMPT, buildStrategyUserPrompt } from "@/lib/ai/prompts/strategy";
import { buildBrandContext, buildNewbeeInsightContext } from "@/lib/ai/prompts/brand-context";
import { strategyResponseSchema, parseAiJson } from "@/lib/ai/response-schemas";
import { fetchNewbeeInsights } from "@/lib/newbee/insights";
import type { Project, BrandKit } from "@/types/database";

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

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Fetch project
    const serviceClient = createServiceClient();
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

    // Build prompt
    const userPrompt = buildStrategyUserPrompt({
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
    });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: STRATEGY_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048,
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
      change_description: "AI generated initial strategy",
    });

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
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

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Strategy generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate strategy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 1.25;
  const outputCost = (outputTokens / 1_000_000) * 10.0;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
