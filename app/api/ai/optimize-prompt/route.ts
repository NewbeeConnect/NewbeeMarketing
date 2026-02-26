import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import {
  VEO_OPTIMIZER_SYSTEM_PROMPT,
  buildVeoOptimizerPrompt,
} from "@/lib/ai/prompts/veo-optimizer";
import { buildBrandContext } from "@/lib/ai/prompts/brand-context";
import { promptOptimizeResponseSchema, parseAiJson } from "@/lib/ai/response-schemas";
import { VEO_PROMPT_EXAMPLES } from "@/lib/ai/few-shot-examples";
import type { Project, BrandKit, Scene } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { aiCache } from "@/lib/ai-cache";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
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
    const { projectId, sceneId } = parsed.data;

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

    // Fetch the single scene
    const { data: sceneData, error: sceneError } = await serviceClient
      .from("mkt_scenes")
      .select("*")
      .eq("id", sceneId)
      .eq("project_id", projectId)
      .single();
    const scene = sceneData as Scene | null;

    if (sceneError || !scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    // Build few-shot context
    const fewShotContext = VEO_PROMPT_EXAMPLES.map(
      (ex) =>
        `Input: "${ex.scene_description}"\nOutput: ${JSON.stringify({ optimized_prompt: ex.optimized_prompt, negative_prompt: ex.negative_prompt })}`
    ).join("\n\n");

    const aspectRatio = scene.aspect_ratio || "9:16";
    const userPrompt = buildVeoOptimizerPrompt({
      sceneTitle: scene.title,
      sceneDescription: scene.description,
      durationSeconds: scene.duration_seconds,
      cameraMovement: scene.camera_movement,
      lighting: scene.lighting,
      style: project.style,
      tone: project.tone,
      aspectRatio,
      brandContext,
    });

    const fullPrompt = `## Few-shot Examples\n${fewShotContext}\n\n## Your Task\n${userPrompt}`;

    // Check cache
    const cacheKey = `prompt-opt:${user.id}:${project.brand_kit_id ?? "none"}:${scene.description}:${project.style}:${project.tone}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
      const cachedResult = cached as { optimized_prompt: string; negative_prompt: string };
      await serviceClient
        .from("mkt_scenes")
        .update({
          user_prompt: scene.description,
          optimized_prompt: cachedResult.optimized_prompt,
          negative_prompt: cachedResult.negative_prompt,
          prompt_approved: false,
        })
        .eq("id", scene.id);

      return NextResponse.json({
        results: [{
          sceneId: scene.id,
          optimized_prompt: cachedResult.optimized_prompt,
          negative_prompt: cachedResult.negative_prompt,
        }],
      });
    }

    let text: string;
    let inputTokens = 0;
    let outputTokens = 0;
    try {
      const response = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: fullPrompt,
        config: {
          systemInstruction: VEO_OPTIMIZER_SYSTEM_PROMPT,
          temperature: 0.5,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as const,
            properties: {
              optimized_prompt: { type: "STRING" as const },
              negative_prompt: { type: "STRING" as const },
            },
            required: ["optimized_prompt", "negative_prompt"],
          },
        },
      });
      text = response.text ?? "";
      inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
      outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    } catch (aiError) {
      console.error(`Gemini API error for scene ${scene.id}:`, aiError);
      return NextResponse.json(
        { error: `AI generation failed: ${aiError instanceof Error ? aiError.message : "Unknown AI error"}` },
        { status: 502 }
      );
    }

    let optimized;
    try {
      optimized = parseAiJson(text, promptOptimizeResponseSchema);
    } catch {
      console.error(`Parse error for scene ${scene.id}. Raw response:`, text);
      return NextResponse.json(
        { error: `Failed to parse AI response for scene "${scene.title}"` },
        { status: 502 }
      );
    }

    // Cache the result
    aiCache.set(cacheKey, { optimized_prompt: optimized.optimized_prompt, negative_prompt: optimized.negative_prompt });

    // Update scene with optimized prompt
    await serviceClient
      .from("mkt_scenes")
      .update({
        user_prompt: scene.description,
        optimized_prompt: optimized.optimized_prompt,
        negative_prompt: optimized.negative_prompt,
        prompt_approved: false,
      })
      .eq("id", scene.id);

    // Save version snapshot
    const { count } = await serviceClient
      .from("mkt_project_versions")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("step", "prompts");

    await serviceClient.from("mkt_project_versions").insert({
      project_id: projectId,
      step: "prompts",
      version_number: (count ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify({ prompts: [{ sceneId: scene.id, optimized_prompt: optimized.optimized_prompt, negative_prompt: optimized.negative_prompt }] })),
      change_description: `AI optimized prompt for scene "${scene.title}"`,
    });

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      api_service: "gemini",
      model: MODELS.GEMINI_FLASH,
      operation: "prompt_optimization",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimateCostFlash(inputTokens, outputTokens),
    });

    return NextResponse.json({
      results: [{
        sceneId: scene.id,
        optimized_prompt: optimized.optimized_prompt,
        negative_prompt: optimized.negative_prompt,
      }],
    });
  } catch (error) {
    console.error("Prompt optimization error:", error);
    const message = "Failed to optimize prompts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateCostFlash(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.6;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
