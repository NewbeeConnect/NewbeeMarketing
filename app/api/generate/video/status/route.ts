import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { GenerateVideosOperation } from "@google/genai";
import type { Generation } from "@/types/database";

const MAX_GENERATION_TIME_MS = 15 * 60 * 1000; // 15 minutes
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // Veo video retention limit
const MAX_UPLOAD_SIZE_MB = 500; // Supabase storage practical limit

interface ErrorInfo {
  type: "transient" | "permanent";
  retryAfterMs?: number;
}

function classifyError(error: unknown): ErrorInfo {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // 429 rate limit - extract Retry-After hint if available
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("resource_exhausted")) {
    const retryMatch = msg.match(/retry.?after[:\s]*(\d+)/i);
    const retryAfterMs = retryMatch ? parseInt(retryMatch[1]) * 1000 : 60000;
    return { type: "transient", retryAfterMs };
  }

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
    return { type: "permanent" };
  }

  return { type: "transient" };
}

function calculateActualCost(generation: Generation): number {
  const config = generation.config as {
    duration_seconds?: number;
    resolution?: string;
  } | null;
  const durationSec = config?.duration_seconds ?? 8;
  const isFast = generation.model.includes("fast");
  const costPerSec = isFast
    ? COST_ESTIMATES.veo_fast_per_second
    : COST_ESTIMATES.veo_standard_per_second;
  const resMultiplier =
    config?.resolution === "4k" ? 2.0 : config?.resolution === "1080p" ? 1.5 : 1.0;
  return Math.round(durationSec * costPerSec * resMultiplier * 10000) / 10000;
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

    // Check 2-day video retention (Veo videos expire after 2 days on Google servers)
    if (storedVideoUri && elapsed > TWO_DAYS_MS) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: "Video expired (2-day Veo retention limit exceeded). Please retry generation.",
          output_metadata: JSON.parse(
            JSON.stringify({
              expired_video_uri: storedVideoUri,
              expired_at: new Date().toISOString(),
            })
          ),
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: "Video expired. Veo videos must be downloaded within 2 days. Please retry.",
      });
    }

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
        // CHECK 1: operation-level error (done=true but errored)
        if (operation.error) {
          const errorCode = (operation.error as Record<string, unknown>).code ?? "UNKNOWN";
          const errorMessage =
            (operation.error as Record<string, unknown>).message ?? "Operation completed with error";

          await serviceClient
            .from("mkt_generations")
            .update({
              status: "failed",
              error_message: `Veo error [${errorCode}]: ${errorMessage}`,
              output_metadata: JSON.parse(
                JSON.stringify({ operation_error: operation.error })
              ),
              completed_at: new Date().toISOString(),
            })
            .eq("id", generation.id);

          return NextResponse.json({
            generationId: generation.id,
            status: "failed",
            errorMessage: `Veo error: ${errorMessage}`,
          });
        }

        // CHECK 2: RAI safety filter
        const raiFilteredCount = operation.response?.raiMediaFilteredCount ?? 0;
        const raiFilteredReasons = operation.response?.raiMediaFilteredReasons ?? [];

        if (raiFilteredCount > 0) {
          const reasonText =
            raiFilteredReasons.length > 0
              ? raiFilteredReasons.join(", ")
              : "Content policy violation";

          await serviceClient
            .from("mkt_generations")
            .update({
              status: "failed",
              error_message: `Content blocked by safety filter: ${reasonText}`,
              output_metadata: JSON.parse(
                JSON.stringify({
                  rai_filtered_count: raiFilteredCount,
                  rai_filtered_reasons: raiFilteredReasons,
                })
              ),
              completed_at: new Date().toISOString(),
            })
            .eq("id", generation.id);

          return NextResponse.json({
            generationId: generation.id,
            status: "failed",
            errorMessage: `Content blocked by safety filter: ${reasonText}`,
          });
        }

        // CHECK 3: Extract video URL
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
          // Operation done, no error, no RAI, but no video
          await serviceClient
            .from("mkt_generations")
            .update({
              status: "failed",
              error_message: "No video generated (empty response)",
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

      const errorInfo = classifyError(pollError);
      const errorMsg = pollError instanceof Error ? pollError.message : "Unknown error";

      // Permanent errors - fail immediately
      if (errorInfo.type === "permanent") {
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
          ...(errorInfo.retryAfterMs && {
            output_metadata: JSON.parse(
              JSON.stringify({
                ...((generation.output_metadata as object) || {}),
                next_retry_after_ms: errorInfo.retryAfterMs,
              })
            ),
          }),
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
    const fileSizeMB = videoBlob.size / (1024 * 1024);

    // File size validation
    if (fileSizeMB > MAX_UPLOAD_SIZE_MB) {
      console.error(`Video too large: ${fileSizeMB.toFixed(1)}MB exceeds ${MAX_UPLOAD_SIZE_MB}MB limit`);

      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: `Video file too large (${fileSizeMB.toFixed(1)}MB). Consider using lower resolution or compression.`,
          output_metadata: JSON.parse(
            JSON.stringify({ veo_video_uri: videoUri, file_size_mb: fileSizeMB })
          ),
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        errorMessage: `Video file too large (${fileSizeMB.toFixed(1)}MB)`,
      });
    }

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

    // Calculate actual cost with resolution multiplier
    const actualCost = calculateActualCost(generation);

    await serviceClient
      .from("mkt_generations")
      .update({
        status: "completed",
        output_url: outputUrl,
        output_metadata: JSON.parse(
          JSON.stringify({
            file_size_mb: Math.round(fileSizeMB * 100) / 100,
            uploaded_at: new Date().toISOString(),
            source_uri: videoUri,
          })
        ),
        actual_cost_usd: actualCost,
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

    // Log usage with resolution multiplier
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: userId,
      project_id: generation.project_id,
      generation_id: generation.id,
      api_service: "veo",
      model: generation.model,
      operation: "video_generation",
      duration_seconds: (generation.config as { duration_seconds?: number } | null)?.duration_seconds ?? 8,
      estimated_cost_usd: actualCost,
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
