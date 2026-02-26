import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { GenerateVideosOperation } from "@google/genai";
import type { Generation } from "@/types/database";

const MAX_GENERATION_TIME_MS = 15 * 60 * 1000; // 15 minutes

type ErrorType = "transient" | "permanent";

function classifyError(error: unknown): ErrorType {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Permanent errors - fail immediately
  if (
    msg.includes("invalid") ||
    msg.includes("not found") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("permission") ||
    msg.includes("blocked") ||
    msg.includes("safety")
  ) {
    return "permanent";
  }

  return "transient";
}

export async function GET(request: NextRequest) {
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

    const generationId = request.nextUrl.searchParams.get("generationId");
    if (!generationId) {
      return NextResponse.json(
        { error: "generationId is required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Fetch generation record
    const { data: genData, error: genError } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("id", generationId)
      .single();
    const generation = genData as Generation | null;

    if (genError || !generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // If already completed or failed, return current state
    if (generation.status === "completed" || generation.status === "failed") {
      return NextResponse.json({
        generationId: generation.id,
        status: generation.status,
        outputUrl: generation.output_url,
        thumbnailUrl: generation.thumbnail_url,
        errorMessage: generation.error_message,
      });
    }

    // Check for timeout
    const startedAt = generation.started_at ? new Date(generation.started_at).getTime() : Date.now();
    const elapsed = Date.now() - startedAt;

    if (elapsed > MAX_GENERATION_TIME_MS) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: "Generation timed out after 15 minutes",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: "Generation timed out after 15 minutes",
      });
    }

    // Check if we have a stored video URI from a previous failed upload
    const storedMetadata = generation.output_metadata as { veo_video_uri?: string } | null;
    const storedVideoUri = storedMetadata?.veo_video_uri;

    // If we have a stored URI, skip polling and try upload directly
    if (storedVideoUri) {
      return await handleVideoUpload(
        serviceClient,
        generation,
        storedVideoUri,
        user.id
      );
    }

    // Poll the Veo operation
    if (!generation.operation_name) {
      return NextResponse.json({
        generationId: generation.id,
        status: generation.status,
      });
    }

    try {
      // Create an operation reference from the stored name
      const operationRef = new GenerateVideosOperation();
      operationRef.name = generation.operation_name;

      const operation = await ai.operations.getVideosOperation({
        operation: operationRef,
      });

      if (operation.done) {
        // Extract video URL from the response
        const videoUri =
          operation.response?.generatedVideos?.[0]?.video?.uri || null;

        if (videoUri) {
          return await handleVideoUpload(
            serviceClient,
            generation,
            videoUri,
            user.id
          );
        } else {
          // Operation done but no video - failure
          await serviceClient
            .from("mkt_generations")
            .update({
              status: "failed",
              error_message: "No video generated",
              completed_at: new Date().toISOString(),
            })
            .eq("id", generation.id);

          return NextResponse.json({
            generationId: generation.id,
            status: "failed",
            errorMessage: "No video generated",
          });
        }
      } else {
        // Still processing
        return NextResponse.json({
          generationId: generation.id,
          status: "processing",
        });
      }
    } catch (pollError) {
      console.error("Veo polling error:", pollError);

      const errorType = classifyError(pollError);
      const errorMsg = pollError instanceof Error ? pollError.message : "Unknown error";

      // Permanent errors - fail immediately
      if (errorType === "permanent") {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: errorMsg,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);

        return NextResponse.json({
          generationId: generation.id,
          status: "failed",
          errorMessage: errorMsg,
        });
      }

      // Transient errors - allow up to 10 retries
      const maxRetries = 10;
      const newRetryCount = (generation.retry_count || 0) + 1;

      if (newRetryCount >= maxRetries) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: `Max retries (${maxRetries}) exceeded: ${errorMsg}`,
            retry_count: newRetryCount,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);

        return NextResponse.json({
          generationId: generation.id,
          status: "failed",
          errorMessage: `Max retries exceeded: ${errorMsg}`,
        });
      }

      await serviceClient
        .from("mkt_generations")
        .update({
          retry_count: newRetryCount,
          error_message: `Retry ${newRetryCount}/${maxRetries}: ${errorMsg}`,
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
        retryCount: newRetryCount,
        maxRetries,
      });
    }
  } catch (error) {
    console.error("Video status check error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check video status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Extracted helper: download from Veo URI + upload to Supabase storage
async function handleVideoUpload(
  serviceClient: ReturnType<typeof createServiceClient>,
  generation: Generation,
  videoUri: string,
  userId: string
) {
  const fileName = `${generation.project_id}/scenes/${generation.scene_id || "unknown"}/${generation.id}.mp4`;

  try {
    // Download video from GCP
    const videoResponse = await fetch(videoUri);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();

    // Upload to Supabase storage
    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, videoBlob, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);

      // Preserve the video URI so we can retry upload on next poll
      await serviceClient
        .from("mkt_generations")
        .update({
          output_metadata: JSON.parse(JSON.stringify({ veo_video_uri: videoUri })),
          error_message: "Storage upload failed, will retry on next poll",
          retry_count: (generation.retry_count || 0) + 1,
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
        warning: "Storage upload failed, will retry",
      });
    }

    const { data: publicUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(fileName);
    const outputUrl = publicUrl.publicUrl;

    await serviceClient
      .from("mkt_generations")
      .update({
        status: "completed",
        output_url: outputUrl,
        output_metadata: null, // Clear stored URI
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    // Create notification
    await serviceClient.from("mkt_notifications").insert({
      user_id: userId,
      type: "generation_complete",
      title: "Video Ready",
      message: `Video generation for scene completed successfully.`,
      reference_id: generation.id,
      reference_type: "generation",
    });

    // Log usage
    const config = generation.config as { duration_seconds?: number } | null;
    const durationSec = config?.duration_seconds ?? 8;
    const isFast = generation.model.includes("fast");
    const costPerSec = isFast
      ? COST_ESTIMATES.veo_fast_per_second
      : COST_ESTIMATES.veo_standard_per_second;

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: userId,
      project_id: generation.project_id,
      generation_id: generation.id,
      api_service: "veo",
      model: generation.model,
      operation: "video_generation",
      duration_seconds: durationSec,
      estimated_cost_usd:
        Math.round(durationSec * costPerSec * 10000) / 10000,
    });

    return NextResponse.json({
      generationId: generation.id,
      status: "completed",
      outputUrl,
    });
  } catch (downloadError) {
    console.error("Video download/upload error:", downloadError);

    // Preserve video URI for retry
    await serviceClient
      .from("mkt_generations")
      .update({
        output_metadata: JSON.parse(JSON.stringify({ veo_video_uri: videoUri })),
        error_message: `Download/upload error: ${downloadError instanceof Error ? downloadError.message : "Unknown"}`,
        retry_count: (generation.retry_count || 0) + 1,
      })
      .eq("id", generation.id);

    return NextResponse.json({
      generationId: generation.id,
      status: "processing",
      warning: "Download/upload failed, will retry",
    });
  }
}
