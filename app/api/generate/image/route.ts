import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { IMAGE_RATIOS, PROJECT_SLUGS } from "@/lib/projects";
import { buildFilename, buildStoragePath } from "@/lib/filename";

/**
 * POST /api/generate/image
 *
 * Generate a single still image with Gemini 3 Pro Image Preview (Nano Banana
 * 2). Supports up to 3 reference images for subject/brand consistency. Stores
 * the result in `mkt-assets/{project}/image/{ratio}/` and inserts a library
 * row into `mkt_generations`.
 */

const assetKindSchema = z.enum([
  "app_ui",
  "logo",
  "product_photo",
  "other",
]);

const bodySchema = z.object({
  project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
  ratio: z.enum(IMAGE_RATIOS as readonly [string, ...string[]]),
  prompt: z.string().min(3).max(4000),
  /**
   * Generic reference images — style/subject hints, loose fidelity.
   */
  referenceImages: z
    .array(
      z.object({
        imageBytes: z.string().min(1).max(5_500_000),
        mimeType: z.string().regex(/^image\//),
      })
    )
    .max(3)
    .optional(),
  /**
   * "Locked" assets — the model is explicitly instructed in the prompt to
   * reproduce these faithfully (no UI hallucination on screenshots, no
   * logo distortion, no product mutation).
   */
  lockedAssets: z
    .array(
      z.object({
        imageBytes: z.string().min(1).max(5_500_000),
        mimeType: z.string().regex(/^image\//),
        kind: assetKindSchema,
      })
    )
    .max(3)
    .optional(),
});

const LOCK_INSTRUCTIONS: Record<z.infer<typeof assetKindSchema>, string> = {
  app_ui:
    "Reproduce this mobile-app UI pixel-for-pixel — do not invent, re-letter, or relayout any on-screen element. Keep icons, type, colors, and spacing identical to the reference.",
  logo:
    "Reproduce this brand logo at correct proportions, colors, and typography. Do not redraw or distort it.",
  product_photo:
    "Preserve the product's real shape, colors, materials, and proportions. Do not invent details that aren't in the reference.",
  other:
    "Treat this reference as the authoritative source for the subject it depicts — match it closely.",
};

function buildLockInstructions(
  assets: { kind: z.infer<typeof assetKindSchema> }[]
): string {
  if (!assets.length) return "";
  const byKind = new Map<string, number>();
  for (const a of assets) byKind.set(a.kind, (byKind.get(a.kind) ?? 0) + 1);
  const lines: string[] = [
    "\n\nSTRICT REFERENCE HANDLING — the user has attached assets that MUST be reproduced faithfully:",
  ];
  for (const [kind, count] of byKind.entries()) {
    const label = count > 1 ? `${count} images` : "image";
    lines.push(
      `- ${LOCK_INSTRUCTIONS[kind as keyof typeof LOCK_INSTRUCTIONS]} (${label})`
    );
  }
  lines.push(
    "Compose the rest of the scene generatively, but embed these assets exactly as provided."
  );
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    // 1) Auth — middleware already enforces admin, but defense-in-depth.
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    // 2) Rate limit. Image gen is expensive enough to gate under `ai-media`.
    const rl = await checkRateLimit(serviceClient, user.id, "ai-media");
    if (!rl.allowed) return rateLimitResponse(rl);

    // 3) Budget check — assume standard Nano Banana 2 per-image cost.
    const estimatedCost = COST_ESTIMATES.nano_banana_per_image;
    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    // 4) Validate body
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { project, ratio, prompt, referenceImages, lockedAssets } = parsed.data;

    // Append lock instructions to the user prompt so Gemini/Nano Banana treats
    // locked assets as authoritative source material, not loose style refs.
    const finalPrompt = lockedAssets?.length
      ? `${prompt}${buildLockInstructions(lockedAssets)}`
      : prompt;

    // 5) Pre-insert the row in "processing" so it shows up in the library
    // instantly (with a skeleton thumbnail). If anything fails below we'll
    // mark it failed.
    const filename = buildFilename({ prompt, type: "image" });
    const storagePath = buildStoragePath({
      project: project as "newbee",
      type: "image",
      ratio: ratio as "4:5" | "9:16" | "1:1",
      filename,
    });

    const { data: genRow, error: insertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        user_id: user.id,
        type: "image",
        project_slug: project,
        ratio,
        filename,
        prompt,
        model: MODELS.IMAGE,
        aspect_ratio: ratio,
        status: "processing",
        estimated_cost_usd: estimatedCost,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !genRow) {
      console.error("[generate/image] insert error:", insertError);
      return NextResponse.json({ error: "Failed to start generation" }, { status: 500 });
    }
    const generationId = genRow.id as string;

    try {
      // 6) Call Nano Banana 2. Reference images + locked assets go as inline
      // parts alongside the text prompt. Locked assets are sent AFTER
      // references so the model weights them as "primary" material.
      const parts: Array<
        | { text: string }
        | { inlineData: { data: string; mimeType: string } }
      > = [{ text: finalPrompt }];

      if (referenceImages && referenceImages.length > 0) {
        for (const ref of referenceImages) {
          parts.push({
            inlineData: { data: ref.imageBytes, mimeType: ref.mimeType },
          });
        }
      }
      if (lockedAssets && lockedAssets.length > 0) {
        for (const asset of lockedAssets) {
          parts.push({
            inlineData: { data: asset.imageBytes, mimeType: asset.mimeType },
          });
        }
      }

      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: [{ role: "user", parts }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: ratio,
            imageSize: "2K",
          },
        },
      });

      // 7) Extract the first image part from the response.
      const respParts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = respParts.find(
        (p) =>
          "inlineData" in p &&
          p.inlineData?.mimeType?.startsWith("image/")
      ) as { inlineData: { data: string; mimeType: string } } | undefined;

      if (!imagePart?.inlineData?.data) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: "Model returned no image (possibly blocked by safety filter)",
            completed_at: new Date().toISOString(),
          })
          .eq("id", generationId);
        return NextResponse.json(
          { error: "No image generated" },
          { status: 500 }
        );
      }

      // 8) Upload to Supabase storage at the canonical library path.
      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      const { error: uploadError } = await serviceClient.storage
        .from("mkt-assets")
        .upload(storagePath, buffer, {
          contentType: imagePart.inlineData.mimeType,
          // upsert so a retry doesn't fail with "already exists"
          upsert: true,
        });

      if (uploadError) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: `Storage upload failed: ${uploadError.message}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generationId);
        return NextResponse.json(
          { error: `Storage upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrl } = serviceClient.storage
        .from("mkt-assets")
        .getPublicUrl(storagePath);

      await serviceClient
        .from("mkt_generations")
        .update({
          status: "completed",
          output_url: publicUrl.publicUrl,
          actual_cost_usd: estimatedCost,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      // 9) Log usage BEFORE responding so budget tracking stays accurate.
      await serviceClient.from("mkt_usage_logs").insert({
        user_id: user.id,
        generation_id: generationId,
        api_service: "gemini",
        model: MODELS.IMAGE,
        operation: "image_generation",
        estimated_cost_usd: estimatedCost,
      });

      return NextResponse.json({
        generationId,
        status: "completed",
        outputUrl: publicUrl.publicUrl,
        filename,
        project,
        ratio,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image generation failed";
      console.error("[generate/image] model error:", message);
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
    console.error("[generate/image] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
