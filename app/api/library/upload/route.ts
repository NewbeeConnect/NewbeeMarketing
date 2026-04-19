import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import {
  IMAGE_RATIOS,
  VIDEO_RATIOS,
  PROJECT_SLUGS,
  type ProjectSlug,
  type ImageRatio,
  type VideoRatio,
} from "@/lib/projects";
import { buildFilename, buildStoragePath } from "@/lib/filename";

/**
 * POST /api/library/upload
 *
 * Accepts a multipart/form-data upload for when the user wants to skip the AI
 * step and provide their own image or video. We store it in the same
 * canonical `{project}/{type}/{ratio}/` layout the library expects and insert
 * a `mkt_generations` row pointing to it.
 *
 * Fields:
 *   file      File
 *   project   "newbee"
 *   type      "image" | "video"
 *   ratio     valid ratio for that type
 *   prompt?   optional caption
 */

const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 200;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const project = form.get("project");
    const type = form.get("type");
    const ratio = form.get("ratio");
    const caption = form.get("prompt");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (
      typeof project !== "string" ||
      !(PROJECT_SLUGS as readonly string[]).includes(project)
    ) {
      return NextResponse.json({ error: "invalid project" }, { status: 400 });
    }
    if (type !== "image" && type !== "video") {
      return NextResponse.json({ error: "type must be image or video" }, { status: 400 });
    }
    if (typeof ratio !== "string") {
      return NextResponse.json({ error: "ratio required" }, { status: 400 });
    }
    const validRatios =
      type === "image" ? IMAGE_RATIOS : VIDEO_RATIOS;
    if (!(validRatios as readonly string[]).includes(ratio)) {
      return NextResponse.json({ error: `invalid ratio for ${type}` }, { status: 400 });
    }

    // MIME + size sanity
    if (type === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "file must be an image" }, { status: 400 });
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "file must be a video" }, { status: 400 });
    }
    const maxBytes = (type === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `file too large (max ${type === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB} MB)`,
        },
        { status: 413 }
      );
    }

    const serviceClient = createServiceClient();

    const promptText =
      typeof caption === "string" && caption.trim().length > 0
        ? caption.trim()
        : `Uploaded ${type}`;

    const filename = buildFilename({
      prompt: promptText,
      type,
      // keep the original file's extension when not mp4/png by appending,
      // but the helper forces png/mp4 — good enough for v1.
    });
    const storagePath = buildStoragePath({
      project: project as ProjectSlug,
      type,
      ratio: ratio as ImageRatio | VideoRatio,
      filename,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(storagePath, buffer, {
        contentType: file.type || (type === "image" ? "image/png" : "video/mp4"),
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(storagePath);
    const outputUrl = publicUrl.publicUrl;

    const { data: row, error: insertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        user_id: user.id,
        type,
        project_slug: project,
        ratio,
        filename,
        prompt: promptText,
        model: "user-upload",
        aspect_ratio: ratio,
        status: "completed",
        output_url: outputUrl,
        output_metadata: {
          file_size_mb: buffer.byteLength / (1024 * 1024),
          original_filename: file.name,
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !row) {
      console.error("[library/upload] insert error:", insertError);
      return NextResponse.json(
        { error: "DB insert failed after successful upload" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      generationId: row.id,
      outputUrl,
      filename,
      project,
      type,
      ratio,
    });
  } catch (err) {
    console.error("[library/upload] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
