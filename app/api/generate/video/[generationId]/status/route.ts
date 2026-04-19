import { NextRequest, NextResponse } from "next/server";
import { GenerateVideosOperation } from "@google/genai";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/generate/video/[generationId]/status
 *
 * Poll a Veo operation. If done and successful, download the mp4 from Veo's
 * URI (2-day retention) and upload to Supabase storage at the path we
 * pre-committed when the row was created.
 *
 * Returns { status: "processing" | "completed" | "failed", outputUrl? }.
 */

type RouteContext = { params: Promise<{ generationId: string }> };

const MAX_GENERATION_TIME_MS = 15 * 60 * 1000;
// With ~8s client-side polling, 10 retries = ~80s of retry window — enough
// to weather transient 5xx or storage writes without giving up prematurely.
const MAX_DOWNLOAD_RETRIES = 10;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { generationId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    // Polling is called often — cheap rate-limit keeps abuse in check.
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const { data: generation, error: genError } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (genError || !generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Short-circuit on terminal states
    if (generation.status === "completed" || generation.status === "failed") {
      return NextResponse.json({
        generationId: generation.id,
        status: generation.status,
        outputUrl: generation.output_url,
        errorMessage: generation.error_message,
      });
    }

    // 15-minute hard timeout so stuck rows don't poll forever.
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

    // Operation-level error
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

    // Safety / RAI filter
    const raiCount = operation.response?.raiMediaFilteredCount ?? 0;
    if (raiCount > 0) {
      const reasons =
        operation.response?.raiMediaFilteredReasons?.join(", ") ?? "policy";
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

    // Download from Veo (needs API key header). Prefer the pre-committed
    // `config.storage_path`, but fall back to reconstructing it from the row's
    // project/type/ratio/filename so corrupted config never blocks completion.
    let storagePath =
      (generation.config as { storage_path?: string } | null)?.storage_path ??
      null;
    if (!storagePath) {
      if (
        generation.project_slug &&
        generation.ratio &&
        generation.filename
      ) {
        storagePath = `${generation.project_slug}/${generation.type}/${
          (generation.ratio as string).replace(":", "-")
        }/${generation.filename}`;
      }
    }
    if (!storagePath) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: "Could not derive storage path (missing metadata)",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: "Missing storage path",
      });
    }

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

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(storagePath, videoBuffer, {
        contentType: "video/mp4",
        // upsert so retries can overwrite a partial upload cleanly
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

    const { data: publicUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(storagePath);

    const durationSec =
      (generation.config as { duration_seconds?: number } | null)
        ?.duration_seconds ?? 8;
    const actualCost = durationSec * COST_ESTIMATES.veo_per_second;

    await serviceClient
      .from("mkt_generations")
      .update({
        status: "completed",
        output_url: publicUrl.publicUrl,
        actual_cost_usd: actualCost,
        output_metadata: {
          file_size_mb: videoBuffer.byteLength / (1024 * 1024),
          // Keep Veo's source URI so the video can be used as input to
          // another Veo call ("extend video"). Google retains these for ~2
          // days, so extension only works within that window.
          veo_video_uri: videoUri,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      generation_id: generation.id,
      api_service: "veo",
      model: generation.model,
      operation: "video_generation",
      estimated_cost_usd: actualCost,
    });

    return NextResponse.json({
      generationId: generation.id,
      status: "completed",
      outputUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    console.error("[video/status] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
