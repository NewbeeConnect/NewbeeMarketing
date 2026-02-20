import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { PLATFORMS, ASPECT_RATIOS } from "@/lib/constants";
import type { Generation } from "@/types/database";

/**
 * Platform-specific export route.
 *
 * Creates export packages for different platforms with proper
 * aspect ratios, resolutions, and file formats.
 * In production, FFmpeg would handle re-encoding on Cloud Run.
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
    const { projectId, platforms, includeCaption, includeWatermark, resolution } =
      body;

    if (!projectId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: "projectId and platforms array are required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Verify project ownership
    const { data: projectData } = await serviceClient
      .from("mkt_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch completed generations for this project
    const { data: generationsData } = await serviceClient
      .from("mkt_generations")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .in("type", ["video", "stitched"])
      .order("created_at", { ascending: false });
    const generations = (generationsData ?? []) as Generation[];

    // Build export packages per platform
    const exportPackages = platforms.map((platform: string) => {
      const platformDef = PLATFORMS.find((p) => p.value === platform);
      const aspectRatio = platformDef?.aspectRatio || "9:16";
      const res =
        ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS] || ASPECT_RATIOS["9:16"];

      // Find videos matching this platform
      const platformVideos = generations.filter(
        (g) => g.platform === platform || !g.platform
      );

      return {
        platform,
        platformLabel: platformDef?.label || platform,
        aspectRatio,
        resolution: resolution || "1080p",
        width: res.width,
        height: res.height,
        includeCaption: includeCaption ?? false,
        includeWatermark: includeWatermark ?? false,
        videos: platformVideos.map((g) => ({
          generationId: g.id,
          type: g.type,
          outputUrl: g.output_url,
          language: g.language,
        })),
        videoCount: platformVideos.length,
      };
    });

    // TODO: In production, Cloud Run worker would:
    // 1. Re-encode videos to target resolution/aspect ratio
    // 2. Burn captions if includeCaption
    // 3. Overlay watermark if includeWatermark
    // 4. Package as ZIP for download
    // 5. Upload to mkt-assets/{projectId}/exports/

    return NextResponse.json({
      projectId,
      exportPackages,
      totalPlatforms: platforms.length,
      totalVideos: exportPackages.reduce(
        (sum: number, p: { videoCount: number }) => sum + p.videoCount,
        0
      ),
      note: "MVP: Export metadata generated. Actual re-encoding requires Cloud Run worker.",
    });
  } catch (error) {
    console.error("Export error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create export";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
