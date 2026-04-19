import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { GenerateVideosOperation } from "@google/genai";

type RouteContext = { params: Promise<{ storyId: string; index: string }> };

const MAX_GENERATION_TIME_MS = 15 * 60 * 1000;
const MAX_DOWNLOAD_RETRIES = 5;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId, index: indexParam } = await params;
    const index = Number(indexParam);

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    // Cheap rate-limit: polling is called every few seconds per in-flight clip.
    // `api-general` = 60/min which is plenty for legitimate UI polling.
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const { data: storyRow } = await serviceClient
      .from("mkt_stories")
      .select("id, user_id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (!storyRow) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { data: generation, error: genError } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("story_id", storyId)
      .eq("story_role", "clip")
      .eq("sequence_index", index)
      .maybeSingle();

    if (genError || !generation) {
      return NextResponse.json({ error: "Clip not started" }, { status: 404 });
    }

    if (generation.status === "completed" || generation.status === "failed") {
      return NextResponse.json({
        generationId: generation.id,
        status: generation.status,
        outputUrl: generation.output_url,
        errorMessage: generation.error_message,
      });
    }

    // Timeout guard
    const startedAt = generation.started_at
      ? new Date(generation.started_at).getTime()
      : Date.now();
    if (Date.now() - startedAt > MAX_GENERATION_TIME_MS) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: "Veo generation timed out after 15 minutes",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: "Timed out",
      });
    }

    if (!generation.operation_name) {
      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
      });
    }

    const operationRef = new GenerateVideosOperation();
    operationRef.name = generation.operation_name;

    const operation = await ai.operations.getVideosOperation({
      operation: operationRef,
    });

    if (!operation.done) {
      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
      });
    }

    if (operation.error) {
      const msg =
        (operation.error as Record<string, unknown>).message ??
        "Veo operation errored";
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: String(msg),
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: String(msg),
      });
    }

    // Safety filter
    const raiCount = operation.response?.raiMediaFilteredCount ?? 0;
    if (raiCount > 0) {
      const reasons = operation.response?.raiMediaFilteredReasons?.join(", ") ?? "policy";
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: `Content blocked by safety filter: ${reasons}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: `Safety filter: ${reasons}`,
      });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: "Veo returned no video URI",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: "No video URI",
      });
    }

    // Download from Veo + upload to Supabase, with retry cap so the client
    // doesn't poll forever if the Veo URI is expired (2-day retention) or
    // permanently unreachable.
    const apiKey = process.env.GOOGLE_API_KEY;
    const videoResponse = await fetch(videoUri, {
      headers: apiKey ? { "x-goog-api-key": apiKey } : {},
    });
    if (!videoResponse.ok) {
      const retryCount = (generation.retry_count ?? 0) + 1;
      if (retryCount >= MAX_DOWNLOAD_RETRIES) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: `Veo download failed (${videoResponse.status}) after ${MAX_DOWNLOAD_RETRIES} attempts`,
            retry_count: retryCount,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);
        return NextResponse.json({
          generationId: generation.id,
          status: "failed",
          errorMessage: `Download failed ${MAX_DOWNLOAD_RETRIES} times`,
        });
      }
      await serviceClient
        .from("mkt_generations")
        .update({ retry_count: retryCount })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
        warning: `Download failed (${videoResponse.status}) — retry ${retryCount}/${MAX_DOWNLOAD_RETRIES}`,
      });
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const fileName = `${user.id}/stories/${storyId}/clips/${index}.mp4`;

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      const retryCount = (generation.retry_count ?? 0) + 1;
      if (retryCount >= MAX_DOWNLOAD_RETRIES) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: `Storage upload failed after ${MAX_DOWNLOAD_RETRIES} attempts: ${uploadError.message}`,
            retry_count: retryCount,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);
        return NextResponse.json({
          generationId: generation.id,
          status: "failed",
          errorMessage: uploadError.message,
        });
      }
      await serviceClient
        .from("mkt_generations")
        .update({ retry_count: retryCount })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
        warning: `Upload failed (retry ${retryCount}/${MAX_DOWNLOAD_RETRIES}): ${uploadError.message}`,
      });
    }

    const { data: publicUrlData } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(fileName);
    const outputUrl = publicUrlData.publicUrl;

    const isFast = (generation.model ?? "").includes("fast");
    const durationSec =
      (generation.config as { duration_seconds?: number } | null)?.duration_seconds ?? 8;
    const actualCost =
      durationSec *
      (isFast ? COST_ESTIMATES.veo_fast_per_second : COST_ESTIMATES.veo_standard_per_second);

    await serviceClient
      .from("mkt_generations")
      .update({
        status: "completed",
        output_url: outputUrl,
        actual_cost_usd: actualCost,
        output_metadata: { file_size_mb: videoBuffer.byteLength / (1024 * 1024) },
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      generation_id: generation.id,
      api_service: "veo",
      model: generation.model,
      operation: `story_clip_${index}`,
      estimated_cost_usd: actualCost,
    });

    return NextResponse.json({
      generationId: generation.id,
      status: "completed",
      outputUrl,
    });
  } catch (error) {
    console.error("[clips status] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
