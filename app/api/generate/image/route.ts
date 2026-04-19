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

const bodySchema = z.object({
  project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
  ratio: z.enum(IMAGE_RATIOS as readonly [string, ...string[]]),
  prompt: z.string().min(3).max(2000),
  /** 1–3 base64-encoded images with mimeType. */
  referenceImages: z
    .array(
      z.object({
        imageBytes: z.string().min(1),
        mimeType: z.string().regex(/^image\//),
      })
    )
    .max(3)
    .optional(),
});

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
    const { project, ratio, prompt, referenceImages } = parsed.data;

    // 5) Pre-insert the row in "processing" so it shows up in the library
    // instantly (with a skeleton thumbnail). If anything fails below we'll
    // mark it failed.
    const filename = buildFilename({ prompt, type: "image" });
    const storagePath = buildStoragePath({
      project: project as "newbee" | "ateliersayin",
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
      // 6) Call Nano Banana 2. Reference images go into the same `parts` array
      // as the text prompt — this is the multimodal pattern.
      const parts: Array<
        | { text: string }
        | { inlineData: { data: string; mimeType: string } }
      > = [{ text: prompt }];

      if (referenceImages && referenceImages.length > 0) {
        for (const ref of referenceImages) {
          parts.push({
            inlineData: { data: ref.imageBytes, mimeType: ref.mimeType },
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
          upsert: false,
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
