import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, COST_ESTIMATES } from "@/lib/google-ai";
import { GenerateVideosOperation } from "@google/genai";
import type { Generation } from "@/types/database";

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
          // Download video from GCP
          const videoResponse = await fetch(videoUri);
          if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
          }
          const videoBlob = await videoResponse.blob();
          const fileName = `${generation.project_id}/scenes/${generation.scene_id || "unknown"}/${generation.id}.mp4`;

          // Upload to Supabase storage - fail if upload fails to avoid temporary URLs
          const { error: uploadError } = await serviceClient.storage
            .from("mkt-assets")
            .upload(fileName, videoBlob, {
              contentType: "video/mp4",
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload failed:", uploadError);
            throw new Error("Failed to upload video to storage");
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
              completed_at: new Date().toISOString(),
            })
            .eq("id", generation.id);

          // Create notification
          await serviceClient.from("mkt_notifications").insert({
            user_id: user.id,
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
            user_id: user.id,
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

      // Increment retry count
      const newRetryCount = (generation.retry_count || 0) + 1;
      if (newRetryCount >= 3) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: `Polling failed after ${newRetryCount} retries`,
            retry_count: newRetryCount,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);

        return NextResponse.json({
          generationId: generation.id,
          status: "failed",
          errorMessage: `Polling failed after ${newRetryCount} retries`,
        });
      }

      await serviceClient
        .from("mkt_generations")
        .update({ retry_count: newRetryCount })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        status: "processing",
        retryCount: newRetryCount,
      });
    }
  } catch (error) {
    console.error("Video status check error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check video status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
