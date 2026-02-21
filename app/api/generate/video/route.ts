import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import type { Project, Scene } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
  language: z.string().optional(),
  platform: z.string().optional(),
  aspectRatio: z.string().optional(),
  useFastModel: z.boolean().optional(),
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

    // Rate limit (media = stricter)
    const rl = checkRateLimit(user.id, "ai-media");
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
    const { projectId, sceneId, language, platform, aspectRatio, useFastModel } = parsed.data;

    // Verify project ownership
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

    // Fetch scene
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

    const prompt = scene.optimized_prompt || scene.description;
    const model = useFastModel ? MODELS.VEO_FAST : MODELS.VEO;
    const targetAspectRatio = aspectRatio || scene.aspect_ratio || "9:16";

    // Create generation record
    const { data: generationData, error: genInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        scene_id: sceneId,
        type: "video",
        prompt,
        model,
        config: JSON.parse(
          JSON.stringify({
            duration_seconds: scene.duration_seconds,
            aspect_ratio: targetAspectRatio,
            negative_prompt: scene.negative_prompt,
          })
        ),
        language: language || null,
        platform: platform || null,
        aspect_ratio: targetAspectRatio,
        status: "pending",
        estimated_cost_usd: estimateVideoCost(
          scene.duration_seconds,
          useFastModel ?? false
        ),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (genInsertError || !generationData) {
      return NextResponse.json(
        { error: "Failed to create generation record" },
        { status: 500 }
      );
    }

    const generation = generationData as { id: string; [key: string]: unknown };

    // Start async video generation with Veo
    try {
      const operation = await ai.models.generateVideos({
        model,
        prompt,
        config: {
          aspectRatio: targetAspectRatio,
          numberOfVideos: 1,
          durationSeconds: scene.duration_seconds,
          negativePrompt: scene.negative_prompt || undefined,
          personGeneration: "dont_allow" as const,
        },
      });

      // Store operation name for polling
      const operationName = operation.name || null;

      await serviceClient
        .from("mkt_generations")
        .update({
          operation_name: operationName,
          status: "processing",
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        operationName,
        status: "processing",
      });
    } catch (veoError) {
      // Update generation as failed
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message:
            veoError instanceof Error ? veoError.message : "Veo generation failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json(
        {
          generationId: generation.id,
          status: "failed",
          error:
            veoError instanceof Error ? veoError.message : "Video generation failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Video generation error:", error);
    const message = "Failed to start video generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateVideoCost(durationSeconds: number, isFast: boolean): number {
  const costPerSecond = isFast
    ? COST_ESTIMATES.veo_fast_per_second
    : COST_ESTIMATES.veo_standard_per_second;
  return Math.round(durationSeconds * costPerSecond * 10000) / 10000;
}
