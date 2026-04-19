import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VideoGenerationReferenceType } from "@google/genai";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { VIDEO_RATIOS, PROJECT_SLUGS } from "@/lib/projects";
import { buildFilename, buildStoragePath } from "@/lib/filename";

/**
 * POST /api/generate/video
 *
 * Kick off a Veo 3.1 video generation. Returns immediately with an
 * `operationName` — the client polls /status to pick up the finished mp4.
 *
 * Reference images (up to 3 ASSET) guide product/subject consistency.
 * Note: Veo's `referenceImages` is mutually exclusive with `image`,
 * `lastFrame`, and `video` — so no firstFrame/keyframe control in this path.
 */

const bodySchema = z
  .object({
    project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
    ratio: z.enum(VIDEO_RATIOS as readonly [string, ...string[]]),
    prompt: z.string().min(3).max(5000),
    durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8),
    /**
     * Veo input modes are mutually exclusive: either
     *   (a) first-frame image-to-video (`firstFrameUrl`) for the 3-stage
     *       pipeline where stage 2's image is handed to stage 3, OR
     *   (b) up to 3 reference images (ASSET type) for subject consistency.
     */
    firstFrameUrl: z.string().url().optional(),
    referenceImages: z
      .array(
        z.object({
          imageBytes: z.string().min(1).max(5_500_000),
          mimeType: z.string().regex(/^image\//),
        })
      )
      .max(3)
      .optional(),
  })
  .refine(
    (v) => !(v.firstFrameUrl && v.referenceImages && v.referenceImages.length),
    { message: "firstFrameUrl and referenceImages cannot be combined" }
  );

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "ai-media");
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { project, ratio, prompt, durationSeconds, referenceImages, firstFrameUrl } = parsed.data;

    const estimatedCost = durationSeconds * COST_ESTIMATES.veo_per_second;
    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    // Pre-insert the row so the library shows a skeleton while Veo cooks.
    const filename = buildFilename({ prompt, type: "video" });
    const storagePath = buildStoragePath({
      project: project as "newbee" | "ateliersayin",
      type: "video",
      ratio: ratio as "9:16" | "16:9",
      filename,
    });

    const { data: genRow, error: insertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        user_id: user.id,
        type: "video",
        project_slug: project,
        ratio,
        filename,
        prompt,
        model: MODELS.VEO,
        aspect_ratio: ratio,
        config: {
          duration_seconds: durationSeconds,
          aspect_ratio: ratio,
          storage_path: storagePath,
        },
        status: "pending",
        estimated_cost_usd: estimatedCost,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !genRow) {
      console.error("[generate/video] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to start generation" },
        { status: 500 }
      );
    }
    const generationId = genRow.id as string;

    try {
      // Two input modes, mutually exclusive:
      //   firstFrameUrl  → image-to-video (pipeline stage 2 hands its image here)
      //   referenceImages → subject-reference video (up to 3 ASSET)
      let firstFrameImage:
        | { imageBytes: string; mimeType: string }
        | undefined;
      if (firstFrameUrl) {
        const res = await fetch(firstFrameUrl);
        if (!res.ok) {
          throw new Error(`Could not fetch firstFrameUrl (${res.status})`);
        }
        const ab = await res.arrayBuffer();
        firstFrameImage = {
          imageBytes: Buffer.from(ab).toString("base64"),
          mimeType: res.headers.get("content-type") ?? "image/png",
        };
      }

      const veoRefs =
        !firstFrameImage && referenceImages && referenceImages.length > 0
          ? referenceImages.slice(0, 3).map((ref) => ({
              image: { imageBytes: ref.imageBytes, mimeType: ref.mimeType },
              referenceType: VideoGenerationReferenceType.ASSET,
            }))
          : undefined;

      const operation = await ai.models.generateVideos({
        model: MODELS.VEO,
        prompt,
        ...(firstFrameImage && { image: firstFrameImage }),
        config: {
          aspectRatio: ratio,
          numberOfVideos: 1,
          durationSeconds,
          resolution: "720p",
          // image-to-video needs allow_adult; text-to-video with refs stays allow_adult too
          personGeneration: firstFrameImage || veoRefs ? "allow_adult" : "allow_all",
          ...(veoRefs && { referenceImages: veoRefs }),
        },
      });

      const operationName = operation.name ?? null;
      await serviceClient
        .from("mkt_generations")
        .update({
          operation_name: operationName,
          status: "processing",
        })
        .eq("id", generationId);

      return NextResponse.json({
        generationId,
        operationName,
        status: "processing",
        filename,
        project,
        ratio,
        estimatedCost,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Veo call failed";
      console.error("[generate/video] veo error:", message);
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    console.error("[generate/video] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 }
    );
  }
}
