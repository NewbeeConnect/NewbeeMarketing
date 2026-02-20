import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import type { Generation } from "@/types/database";

/**
 * Video stitching route.
 *
 * Note: Full FFmpeg processing requires a server-side worker (Cloud Run).
 * This route orchestrates the stitching by:
 * 1. Collecting all completed scene videos for a project
 * 2. Creating a stitched generation record
 * 3. In production, this would call a Cloud Run worker with FFmpeg
 * 4. For MVP, it creates a manifest of videos to stitch
 */
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

    const body = await request.json();
    const { projectId, language, platform } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify project ownership
    const { data: projectData, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch completed video generations for this project, ordered by scene
    let query = serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "video")
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    if (language) {
      query = query.eq("language", language);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data: generationsData, error: genError } = await query;
    const generations = (generationsData ?? []) as Generation[];

    if (genError || generations.length === 0) {
      return NextResponse.json(
        { error: "No completed videos found to stitch" },
        { status: 404 }
      );
    }

    // Group by scene to pick one video per scene (latest)
    const sceneVideoMap = new Map<string, Generation>();
    for (const gen of generations) {
      if (gen.scene_id) {
        sceneVideoMap.set(gen.scene_id, gen);
      }
    }

    const videoUrls = Array.from(sceneVideoMap.values())
      .map((g) => g.output_url)
      .filter(Boolean);

    if (videoUrls.length === 0) {
      return NextResponse.json(
        { error: "No video URLs available for stitching" },
        { status: 404 }
      );
    }

    // Create stitched generation record
    const totalDuration = Array.from(sceneVideoMap.values()).reduce(
      (sum, g) => {
        const config = g.config as { duration_seconds?: number } | null;
        return sum + (config?.duration_seconds ?? 8);
      },
      0
    );

    const { data: stitchedData, error: stitchInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        type: "stitched",
        prompt: `Stitched ${videoUrls.length} scenes`,
        model: "ffmpeg",
        config: JSON.parse(
          JSON.stringify({
            source_videos: videoUrls,
            scene_count: videoUrls.length,
            total_duration: totalDuration,
            language: language || null,
            platform: platform || null,
          })
        ),
        language: language || null,
        platform: platform || null,
        aspect_ratio:
          Array.from(sceneVideoMap.values())[0]?.aspect_ratio || "9:16",
        status: "processing",
        estimated_cost_usd: 0, // FFmpeg is free (compute cost only)
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (stitchInsertError || !stitchedData) {
      return NextResponse.json(
        { error: "Failed to create stitch record" },
        { status: 500 }
      );
    }

    const stitched = stitchedData as { id: string; [key: string]: unknown };

    // TODO: In production, this would call a Cloud Run worker:
    // await callCloudRunWorker({ generationId: stitched.id, videoUrls, ... });
    //
    // For MVP, mark as completed with the first video URL as placeholder
    // The actual stitching would be done by a Cloud Run worker with FFmpeg

    await serviceClient
      .from("mkt_generations")
      .update({
        status: "completed",
        output_url: videoUrls[0], // Placeholder: first scene video
        output_metadata: JSON.parse(
          JSON.stringify({
            scenes_stitched: videoUrls.length,
            total_duration: totalDuration,
            note: "MVP: individual scenes available, full stitch requires Cloud Run worker",
          })
        ),
        completed_at: new Date().toISOString(),
      })
      .eq("id", stitched.id);

    // Create notification
    await serviceClient.from("mkt_notifications").insert({
      user_id: user.id,
      type: "generation_complete",
      title: "Video Stitched",
      message: `${videoUrls.length} scenes stitched into a complete video.`,
      reference_id: stitched.id,
      reference_type: "generation",
    });

    return NextResponse.json({
      generationId: stitched.id,
      scenesCount: videoUrls.length,
      totalDuration,
      videoUrls,
      status: "completed",
    });
  } catch (error) {
    console.error("Stitch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to stitch videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
