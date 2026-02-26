import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai } from "@/lib/google-ai";
import type { Generation, Scene } from "@/types/database";
import { z } from "zod";

const inputSchema = z.object({
  generationId: z.string().uuid(),
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

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { generationId } = parsed.data;
    const serviceClient = createServiceClient();

    // Fetch the failed generation
    const { data: genData, error: genError } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("id", generationId)
      .single();
    const generation = genData as Generation | null;

    if (genError || !generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: projectData } = await serviceClient
      .from("mkt_projects")
      .select("user_id")
      .eq("id", generation.project_id)
      .single();

    if (!projectData || projectData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only retry failed generations
    if (generation.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed generations can be retried" },
        { status: 400 }
      );
    }

    // Fetch scene for prompt
    if (!generation.scene_id) {
      return NextResponse.json({ error: "No scene associated" }, { status: 400 });
    }

    const { data: sceneData } = await serviceClient
      .from("mkt_scenes")
      .select("*")
      .eq("id", generation.scene_id)
      .single();
    const scene = sceneData as Scene | null;

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const prompt = scene.optimized_prompt || scene.description;
    const config = generation.config as {
      duration_seconds?: number;
      aspect_ratio?: string;
      negative_prompt?: string;
    } | null;

    // Reset generation record
    await serviceClient
      .from("mkt_generations")
      .update({
        status: "pending",
        retry_count: 0,
        error_message: null,
        output_metadata: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        operation_name: null,
      })
      .eq("id", generationId);

    // Start new Veo operation
    try {
      const operation = await ai.models.generateVideos({
        model: generation.model,
        prompt,
        config: {
          aspectRatio: config?.aspect_ratio || "9:16",
          numberOfVideos: 1,
          durationSeconds: config?.duration_seconds || 8,
          negativePrompt: config?.negative_prompt || undefined,
        },
      });

      const operationName = operation.name || null;

      await serviceClient
        .from("mkt_generations")
        .update({
          operation_name: operationName,
          status: "processing",
        })
        .eq("id", generationId);

      return NextResponse.json({
        generationId,
        operationName,
        status: "processing",
      });
    } catch (veoError) {
      const errorMsg = veoError instanceof Error ? veoError.message : "Veo generation failed";
      console.error("Veo retry error:", errorMsg);

      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (error) {
    console.error("Retry generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to retry generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
