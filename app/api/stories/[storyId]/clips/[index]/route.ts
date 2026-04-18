import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";

type RouteContext = { params: Promise<{ storyId: string; index: string }> };

async function fetchStorageImageAsBase64(url: string): Promise<{
  imageBytes: string;
  mimeType: string;
}> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch frame image (${res.status})`);
  }
  const contentType = res.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { imageBytes: buffer.toString("base64"), mimeType: contentType };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId, index: indexParam } = await params;
    const index = Number(indexParam);
    if (!Number.isInteger(index) || index < 1 || index > 4) {
      return NextResponse.json({ error: "Clip index must be 1..4" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "ai-media");
    if (!rl.allowed) return rateLimitResponse(rl);

    const { data: story, error: storyError } = await serviceClient
      .from("mkt_stories")
      .select("id, user_id, aspect_ratio, duration_per_clip_seconds, model_tier, scene_scripts")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const useFastModel = story.model_tier === "fast";
    const model = useFastModel ? MODELS.VEO_FAST : MODELS.VEO;
    const durationSeconds = story.duration_per_clip_seconds as 4 | 6 | 8;
    const estimatedCost =
      durationSeconds *
      (useFastModel
        ? COST_ESTIMATES.veo_fast_per_second
        : COST_ESTIMATES.veo_standard_per_second);

    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const scripts = (story.scene_scripts ?? {}) as Record<string, string>;
    const prompt = scripts[String(index)];
    if (!prompt) {
      return NextResponse.json(
        { error: `No script saved for clip ${index}` },
        { status: 400 }
      );
    }

    // Load first and last frame (must be completed)
    const { data: frames, error: framesError } = await serviceClient
      .from("mkt_generations")
      .select("sequence_index, status, output_url")
      .eq("story_id", storyId)
      .eq("story_role", "frame")
      .in("sequence_index", [index, index + 1]);

    if (framesError || !frames) {
      return NextResponse.json({ error: "Failed to load frames" }, { status: 500 });
    }

    const firstFrame = frames.find((f) => f.sequence_index === index);
    const lastFrame = frames.find((f) => f.sequence_index === index + 1);

    if (!firstFrame?.output_url || firstFrame.status !== "completed") {
      return NextResponse.json(
        { error: `Frame ${index} must be generated and completed first` },
        { status: 400 }
      );
    }
    if (!lastFrame?.output_url || lastFrame.status !== "completed") {
      return NextResponse.json(
        { error: `Frame ${index + 1} must be generated and completed first` },
        { status: 400 }
      );
    }

    const [firstImg, lastImg] = await Promise.all([
      fetchStorageImageAsBase64(firstFrame.output_url),
      fetchStorageImageAsBase64(lastFrame.output_url),
    ]);

    // Replace any existing clip at this index
    await serviceClient
      .from("mkt_generations")
      .delete()
      .eq("story_id", storyId)
      .eq("story_role", "clip")
      .eq("sequence_index", index);

    const { data: generationData, error: genInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        story_id: storyId,
        story_role: "clip",
        sequence_index: index,
        type: "video",
        prompt,
        model,
        aspect_ratio: story.aspect_ratio,
        config: {
          duration_seconds: durationSeconds,
          aspect_ratio: story.aspect_ratio,
          first_frame_generation_id: firstFrame.sequence_index,
          last_frame_generation_id: lastFrame.sequence_index,
        },
        status: "pending",
        estimated_cost_usd: estimatedCost,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (genInsertError || !generationData) {
      return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
    }
    const generationId = generationData.id as string;

    try {
      const operation = await ai.models.generateVideos({
        model,
        prompt,
        image: { imageBytes: firstImg.imageBytes, mimeType: firstImg.mimeType },
        config: {
          aspectRatio: story.aspect_ratio === "1:1" ? "9:16" : story.aspect_ratio,
          numberOfVideos: 1,
          durationSeconds,
          resolution: "720p",
          personGeneration: "allow_adult",
          lastFrame: { imageBytes: lastImg.imageBytes, mimeType: lastImg.mimeType },
        },
      });

      const operationName = operation.name || null;
      await serviceClient
        .from("mkt_generations")
        .update({ operation_name: operationName, status: "processing" })
        .eq("id", generationId);

      return NextResponse.json({
        generationId,
        operationName,
        status: "processing",
        estimatedCost,
      });
    } catch (veoError) {
      const message = veoError instanceof Error ? veoError.message : "Veo call failed";
      console.error("[clips POST] Veo error:", message);
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error("[clips POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start clip generation" },
      { status: 500 }
    );
  }
}
