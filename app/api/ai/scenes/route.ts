import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { SCENES_SYSTEM_PROMPT, buildScenesUserPrompt } from "@/lib/ai/prompts/scenes";
import { buildBrandContext } from "@/lib/ai/prompts/brand-context";
import { scenesResponseSchema, parseAiJson } from "@/lib/ai/response-schemas";
import type { Project, ProjectStrategy, BrandKit } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
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
    const { projectId } = parsed.data;
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

    if (!project.strategy) {
      return NextResponse.json({ error: "Strategy must be approved first" }, { status: 400 });
    }

    const strategy = project.strategy as unknown as ProjectStrategy;

    // Fetch brand kit
    let brandKit: BrandKit | null = null;
    if (project.brand_kit_id) {
      const { data } = await serviceClient
        .from("mkt_brand_kit")
        .select("*")
        .eq("id", project.brand_kit_id)
        .single();
      brandKit = data as BrandKit | null;
    }

    const brandContext = buildBrandContext(brandKit);

    const userPrompt = buildScenesUserPrompt({
      strategy,
      productName: project.product_name,
      productDescription: project.product_description,
      style: project.style,
      tone: project.tone,
      brandContext,
    });

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: SCENES_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text ?? "";
    const { scenes } = parseAiJson(text, scenesResponseSchema);

    // Delete existing scenes for this project
    await serviceClient
      .from("mkt_scenes")
      .delete()
      .eq("project_id", projectId);

    // Insert new scenes
    const sceneRows = scenes.map((scene, index) => ({
      project_id: projectId,
      scene_number: scene.scene_number,
      title: scene.title,
      description: scene.description,
      duration_seconds: scene.duration_seconds,
      aspect_ratio: "9:16" as string, // Default, will be set per-platform at generation
      resolution: "1080p" as string,
      camera_movement: scene.camera_movement ?? null,
      lighting: scene.lighting ?? null,
      text_overlay: scene.text_overlay ?? null,
      audio_type: scene.audio_type as "native_veo" | "tts_voiceover" | "silent",
      voiceover_text: scene.voiceover_text ?? null,
      voiceover_language: null,
      voiceover_voice: null,
      user_prompt: null,
      optimized_prompt: null,
      negative_prompt: null,
      reference_image_urls: null,
      sort_order: index,
    }));

    const { data: insertedScenes, error: insertError } = await serviceClient
      .from("mkt_scenes")
      .insert(sceneRows)
      .select();

    if (insertError) {
      console.error("Scene insert error:", insertError);
      return NextResponse.json({ error: "Failed to save scenes" }, { status: 500 });
    }

    // Update project status
    await serviceClient
      .from("mkt_projects")
      .update({ status: "scenes_ready", current_step: 3 })
      .eq("id", projectId);

    // Save version
    const { count } = await serviceClient
      .from("mkt_project_versions")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("step", "scenes");

    await serviceClient.from("mkt_project_versions").insert({
      project_id: projectId,
      step: "scenes",
      version_number: (count ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify({ scenes })),
      change_description: "AI generated initial scene breakdown",
    });

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      api_service: "gemini",
      model: MODELS.GEMINI_PRO,
      operation: "scene_generation",
      input_tokens: response.usageMetadata?.promptTokenCount ?? null,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? null,
      estimated_cost_usd: estimateCost(
        response.usageMetadata?.promptTokenCount ?? 0,
        response.usageMetadata?.candidatesTokenCount ?? 0
      ),
    });

    return NextResponse.json({ scenes: insertedScenes });
  } catch (error) {
    console.error("Scene generation error:", error);
    const message = "Failed to generate scenes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 1.25;
  const outputCost = (outputTokens / 1_000_000) * 10.0;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
