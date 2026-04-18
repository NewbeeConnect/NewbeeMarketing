import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { stitchVideos } from "@/lib/video/stitch";

export const maxDuration = 300; // Vercel — ffmpeg concat is fast but leave headroom
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ storyId: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    const { data: story, error: storyError } = await serviceClient
      .from("mkt_stories")
      .select("id, user_id, aspect_ratio, duration_per_clip_seconds")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { data: clips, error: clipsError } = await serviceClient
      .from("mkt_generations")
      .select("sequence_index, status, output_url")
      .eq("story_id", storyId)
      .eq("story_role", "clip")
      .order("sequence_index", { ascending: true });

    if (clipsError || !clips || clips.length < 4) {
      return NextResponse.json(
        { error: "All 4 clips must be generated before stitching" },
        { status: 400 }
      );
    }

    const incomplete = clips.find((c) => c.status !== "completed" || !c.output_url);
    if (incomplete) {
      return NextResponse.json(
        { error: `Clip ${incomplete.sequence_index} is not completed yet` },
        { status: 400 }
      );
    }

    const ordered = [...clips].sort(
      (a, b) => (a.sequence_index ?? 0) - (b.sequence_index ?? 0)
    );

    const buffers = await Promise.all(
      ordered.map(async (clip) => {
        const res = await fetch(clip.output_url as string);
        if (!res.ok) {
          throw new Error(`Failed to fetch clip ${clip.sequence_index} (${res.status})`);
        }
        return Buffer.from(await res.arrayBuffer());
      })
    );

    const stitchedBuffer = await stitchVideos(buffers);

    // Remove any previous stitched row for idempotency
    await serviceClient
      .from("mkt_generations")
      .delete()
      .eq("story_id", storyId)
      .eq("story_role", "stitched");

    const { data: stitchedRow, error: insertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        story_id: storyId,
        story_role: "stitched",
        sequence_index: 0,
        type: "stitched",
        prompt: `Stitched story ${storyId}`,
        model: "ffmpeg-concat",
        aspect_ratio: story.aspect_ratio,
        config: {
          source_clip_indexes: ordered.map((c) => c.sequence_index),
          total_duration: story.duration_per_clip_seconds * 4,
        },
        status: "processing",
        estimated_cost_usd: 0,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !stitchedRow) {
      return NextResponse.json(
        { error: "Failed to create stitched record" },
        { status: 500 }
      );
    }

    const stitchedId = stitchedRow.id as string;
    const fileName = `${user.id}/stories/${storyId}/stitched.mp4`;

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, stitchedBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: `Stitched upload failed: ${uploadError.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", stitchedId);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
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
        output_metadata: { file_size_mb: stitchedBuffer.byteLength / (1024 * 1024) },
        completed_at: new Date().toISOString(),
      })
      .eq("id", stitchedId);

    await serviceClient
      .from("mkt_stories")
      .update({
        stitched_generation_id: stitchedId,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId);

    return NextResponse.json({
      generationId: stitchedId,
      outputUrl,
      status: "completed",
    });
  } catch (error) {
    console.error("[stitch] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stitch failed" },
      { status: 500 }
    );
  }
}
