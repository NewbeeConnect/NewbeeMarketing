import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

/**
 * Caption embedding route.
 *
 * In production, this would call a Cloud Run worker with FFmpeg
 * to burn subtitles into the video. For MVP, we mark the caption
 * as "embedded" and return the SRT download URL alongside the video.
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
    const { captionId, generationId } = body;

    if (!captionId) {
      return NextResponse.json(
        { error: "captionId is required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Mark caption as embedded
    const { error: updateError } = await serviceClient
      .from("mkt_captions")
      .update({ is_embedded: true })
      .eq("id", captionId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update caption" },
        { status: 500 }
      );
    }

    // TODO: In production, call Cloud Run worker:
    // FFmpeg command: ffmpeg -i video.mp4 -vf subtitles=captions.srt output.mp4

    return NextResponse.json({
      captionId,
      generationId,
      embedded: true,
      note: "MVP: Caption marked as embedded. Actual burn-in requires Cloud Run worker.",
    });
  } catch (error) {
    console.error("Caption embed error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to embed captions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
