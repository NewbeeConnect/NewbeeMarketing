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

const assetKindSchema = z.enum([
  "app_ui",
  "logo",
  "product_photo",
  "other",
]);

/**
 * Veo 3.1 can't "read" the asset pixels at inference time the way Nano Banana
 * can (its referenceImages are loose subject hints, not pixel-source). In the
 * pipeline flow, the assets are already baked into the first-frame image by
 * stage 2, so the only job of these instructions is to tell Veo NOT to animate
 * or mutate them. Appended to the prompt, one sentence per asset kind.
 */
const VIDEO_LOCK_INSTRUCTIONS: Record<z.infer<typeof assetKindSchema>, string> = {
  app_ui:
    "Any mobile-app UI visible in the first frame must stay pixel-static for the entire clip: buttons, labels, icons, colors, spacing, and layout identical to the first frame. Do not animate, re-letter, re-layout, or invent new UI elements.",
  logo:
    "Any brand logo visible in the first frame must keep its exact shape, proportions, colors, and typography for the entire clip. No morphing, no distortion, no rotation that redraws it.",
  product_photo:
    "The product visible in the first frame must keep its exact shape, colors, materials, and proportions. Do not invent details, textures, or geometry that weren't in the first frame.",
  other:
    "Treat the subject(s) from the first frame as authoritative — keep them visually faithful across the clip.",
};

function buildVideoLockInstructions(
  kinds: z.infer<typeof assetKindSchema>[]
): string {
  if (!kinds.length) return "";
  const unique = Array.from(new Set(kinds));
  const lines: string[] = [
    "\n\nSTRICT VISUAL FIDELITY — the first frame contains user-provided assets that must NOT be altered during the clip:",
  ];
  for (const kind of unique) lines.push(`- ${VIDEO_LOCK_INSTRUCTIONS[kind]}`);
  lines.push(
    "The camera and ambient environment may move cinematically, but the assets above remain visually identical to the first frame."
  );
  return lines.join("\n");
}

const bodySchema = z
  .object({
    project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
    ratio: z.enum(VIDEO_RATIOS as readonly [string, ...string[]]),
    prompt: z.string().min(3).max(5000),
    durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8),
    /**
     * Veo input modes are mutually exclusive (SDK constraint). Exactly ONE of:
     *   (a) `firstFrameUrl`       — image-to-video, stage-2 image as first frame
     *   (b) `referenceImages`     — up to 3 ASSET references for subject consistency
     *   (c) `sourceGenerationId`  — extend a prior Veo-generated video from its
     *                               last frame. Only valid within Google's 2-day
     *                               retention window on the source URI.
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
    sourceGenerationId: z.string().uuid().optional(),
    /**
     * Assets the prompt is instructed to preserve pixel-faithfully. In the
     * pipeline flow, these were already baked into the first-frame image, so
     * we only need to append text instructions reminding Veo to keep them
     * still. For standalone video intent we also append refs when no
     * firstFrame exists.
     */
    lockedAssetKinds: z.array(assetKindSchema).max(3).optional(),
  })
  .refine(
    (v) => {
      const modes = [
        !!v.firstFrameUrl,
        !!(v.referenceImages && v.referenceImages.length),
        !!v.sourceGenerationId,
      ].filter(Boolean).length;
      return modes <= 1;
    },
    {
      message:
        "firstFrameUrl, referenceImages, and sourceGenerationId are mutually exclusive",
    }
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
    const {
      project,
      ratio,
      prompt,
      durationSeconds,
      referenceImages,
      firstFrameUrl,
      sourceGenerationId,
      lockedAssetKinds,
    } = parsed.data;

    // Append asset-lock instructions BEFORE we call Veo. Works in all three
    // input modes (firstFrame / references / extend) — it's just text.
    const finalPrompt = lockedAssetKinds?.length
      ? `${prompt}${buildVideoLockInstructions(lockedAssetKinds)}`
      : prompt;

    // If this is an extension request, resolve the source Veo URI. It was
    // persisted in mkt_generations.output_metadata.veo_video_uri by the status
    // route when the parent video completed. Veo retains these for ~2 days —
    // after that extension fails.
    let extendFromVeoUri: string | null = null;
    if (sourceGenerationId) {
      const { data: sourceRow } = await serviceClient
        .from("mkt_generations")
        .select("output_metadata, user_id, type")
        .eq("id", sourceGenerationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!sourceRow || sourceRow.type !== "video") {
        return NextResponse.json(
          { error: "Source video not found" },
          { status: 404 }
        );
      }
      const uri = (sourceRow.output_metadata as { veo_video_uri?: string } | null)
        ?.veo_video_uri;
      if (!uri) {
        return NextResponse.json(
          {
            error:
              "Source video doesn't have a Veo URI stored (older than 2 days, or pre-upgrade). Re-generate the source to enable extension.",
          },
          { status: 410 }
        );
      }
      extendFromVeoUri = uri;
    }

    const estimatedCost = durationSeconds * COST_ESTIMATES.veo_per_second;
    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    // Pre-insert the row so the library shows a skeleton while Veo cooks.
    const filename = buildFilename({ prompt, type: "video" });
    const storagePath = buildStoragePath({
      project: project as "newbee",
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
      // Three mutually-exclusive input modes:
      //   (a) firstFrameUrl → image-to-video (pipeline stage 2 hands its image here)
      //   (b) referenceImages → subject-reference video (up to 3 ASSET)
      //   (c) extendFromVeoUri → continue from a prior Veo video
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
        !firstFrameImage && !extendFromVeoUri && referenceImages && referenceImages.length > 0
          ? referenceImages.slice(0, 3).map((ref) => ({
              image: { imageBytes: ref.imageBytes, mimeType: ref.mimeType },
              referenceType: VideoGenerationReferenceType.ASSET,
            }))
          : undefined;

      const operation = await ai.models.generateVideos({
        model: MODELS.VEO,
        prompt: finalPrompt,
        ...(firstFrameImage && { image: firstFrameImage }),
        ...(extendFromVeoUri && { video: { uri: extendFromVeoUri } }),
        config: {
          aspectRatio: ratio,
          numberOfVideos: 1,
          durationSeconds,
          resolution: "720p",
          // Restrict to adults whenever we hand Veo any image/video input —
          // extensions and image-to-video both imply real subjects.
          personGeneration:
            firstFrameImage || veoRefs || extendFromVeoUri ? "allow_adult" : "allow_all",
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
