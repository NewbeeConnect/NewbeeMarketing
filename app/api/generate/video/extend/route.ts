import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import type { Generation } from "@/types/database";
import { z } from "zod";

const inputSchema = z.object({
  sourceGenerationId: z.string().uuid(),
  prompt: z.string().min(1).max(5000),
  durationSeconds: z.number().refine((v) => [4, 6, 8].includes(v)).optional(),
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

    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "ai-media");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
      );
    }

    const budget = await checkBudget(serviceClient, user.id);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { sourceGenerationId, prompt, durationSeconds } = parsed.data;

    // Fetch source generation
    const { data: sourceData, error: sourceError } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("id", sourceGenerationId)
      .single();
    const source = sourceData as Generation | null;

    if (sourceError || !source) {
      return NextResponse.json({ error: "Source generation not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: projectData } = await serviceClient
      .from("mkt_projects")
      .select("user_id")
      .eq("id", source.project_id)
      .single();

    if (!projectData || projectData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only extend completed video generations
    if (source.status !== "completed" || source.type !== "video") {
      return NextResponse.json(
        { error: "Only completed video generations can be extended" },
        { status: 400 }
      );
    }

    if (!source.output_url) {
      return NextResponse.json({ error: "Source has no output URL" }, { status: 400 });
    }

    // Check if source video URI is still available (within 2-day retention)
    const sourceMetadata = source.output_metadata as { source_uri?: string } | null;
    const sourceVideoUri = sourceMetadata?.source_uri;

    if (!sourceVideoUri) {
      return NextResponse.json(
        { error: "Source video URI not available for extension. The original Veo URI may have expired." },
        { status: 400 }
      );
    }

    const sourceConfig = source.config as {
      duration_seconds?: number;
      aspect_ratio?: string;
      resolution?: string;
    } | null;

    const finalDuration = durationSeconds ?? sourceConfig?.duration_seconds ?? 8;
    const aspectRatio = sourceConfig?.aspect_ratio ?? "9:16";
    const resolution = sourceConfig?.resolution ?? "720p";

    const isFast = source.model.includes("fast");
    const costPerSec = isFast
      ? COST_ESTIMATES.veo_fast_per_second
      : COST_ESTIMATES.veo_standard_per_second;
    const resMultiplier = resolution === "4k" ? 2.0 : resolution === "1080p" ? 1.5 : 1.0;
    const estimatedCost = Math.round(finalDuration * costPerSec * resMultiplier * 10000) / 10000;

    // Create extension generation record
    const { data: genData, error: genError } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: source.project_id,
        scene_id: source.scene_id,
        type: "video",
        prompt,
        model: source.model,
        config: JSON.parse(
          JSON.stringify({
            duration_seconds: finalDuration,
            aspect_ratio: aspectRatio,
            resolution,
            parent_generation_id: sourceGenerationId,
            extension: true,
          })
        ),
        language: source.language,
        platform: source.platform,
        aspect_ratio: aspectRatio,
        status: "pending",
        estimated_cost_usd: estimatedCost,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (genError || !genData) {
      return NextResponse.json({ error: "Failed to create extension record" }, { status: 500 });
    }

    const generation = genData as { id: string };

    try {
      const operation = await ai.models.generateVideos({
        model: source.model,
        prompt,
        video: { uri: sourceVideoUri },
        config: {
          aspectRatio,
          numberOfVideos: 1,
          durationSeconds: finalDuration,
          resolution,
          personGeneration: "allow_all",
          // generateAudio is NOT supported in Gemini API
        },
      });

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
      const errorMsg = veoError instanceof Error ? veoError.message : "Veo extension failed";
      console.error("Veo extension error:", errorMsg);

      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (error) {
    console.error("Video extension error:", error);
    const message = error instanceof Error ? error.message : "Failed to extend video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
