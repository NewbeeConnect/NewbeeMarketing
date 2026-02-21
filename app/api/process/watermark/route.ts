import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import type { BrandKit } from "@/types/database";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  generationId: z.string().uuid(),
});

/**
 * Watermark overlay route.
 *
 * In production, this would call a Cloud Run worker with FFmpeg
 * to overlay the brand watermark on the video.
 * FFmpeg: ffmpeg -i video.mp4 -i watermark.png -filter_complex "overlay=x:y" output.mp4
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
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { projectId, generationId } = parsed.data;

    const serviceClient = createServiceClient();

    // Get project's brand kit
    const { data: projectData } = await serviceClient
      .from("mkt_projects")
      .select("brand_kit_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectData as { brand_kit_id: string | null };

    if (!project.brand_kit_id) {
      return NextResponse.json(
        { error: "No brand kit linked to project" },
        { status: 400 }
      );
    }

    const { data: brandKitData } = await serviceClient
      .from("mkt_brand_kit")
      .select("*")
      .eq("id", project.brand_kit_id)
      .single();
    const brandKit = brandKitData as BrandKit | null;

    if (!brandKit?.watermark_url) {
      return NextResponse.json(
        { error: "No watermark configured in brand kit" },
        { status: 400 }
      );
    }

    // TODO: In production, call Cloud Run worker with FFmpeg:
    // ffmpeg -i video.mp4 -i watermark.png
    //   -filter_complex "[1]format=rgba,colorchannelmixer=aa=0.3[wm];[0][wm]overlay=W-w-10:H-h-10"
    //   output.mp4

    return NextResponse.json({
      generationId,
      watermarkUrl: brandKit.watermark_url,
      position: brandKit.watermark_position || "bottom-right",
      opacity: brandKit.watermark_opacity || 0.3,
      applied: true,
      note: "MVP: Watermark settings recorded. Actual overlay requires Cloud Run worker.",
    });
  } catch (error) {
    console.error("Watermark error:", error);
    return NextResponse.json({ error: "Failed to apply watermark" }, { status: 500 });
  }
}
