import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";

type RouteContext = { params: Promise<{ storyId: string; index: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId, index: indexParam } = await params;
    const index = Number(indexParam);
    if (!Number.isInteger(index) || index < 1 || index > 5) {
      return NextResponse.json({ error: "Frame index must be 1..5" }, { status: 400 });
    }

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

    const estimatedCost =
      COST_ESTIMATES.imagen_standard_per_image; // Imagen standard by default for quality
    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const { data: story, error: storyError } = await serviceClient
      .from("mkt_stories")
      .select("id, user_id, aspect_ratio, frame_prompts, style_anchor, model_tier")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const framePrompts = (story.frame_prompts ?? {}) as Record<string, string>;
    const framePrompt = framePrompts[String(index)];
    if (!framePrompt) {
      return NextResponse.json(
        { error: `No prompt saved for frame ${index}` },
        { status: 400 }
      );
    }

    const useFastModel = story.model_tier === "fast";
    const model = useFastModel ? MODELS.IMAGEN_FAST : MODELS.IMAGEN;
    const costPerImage = useFastModel
      ? COST_ESTIMATES.imagen_fast_per_image
      : COST_ESTIMATES.imagen_standard_per_image;

    const styleAnchor = story.style_anchor ?? "";
    const finalPrompt = styleAnchor
      ? `${styleAnchor}\n\n${framePrompt}`
      : framePrompt;

    // Supersede any previous frame at this index so regenerate replaces cleanly
    await serviceClient
      .from("mkt_generations")
      .delete()
      .eq("story_id", storyId)
      .eq("story_role", "frame")
      .eq("sequence_index", index);

    const { data: generationData, error: genInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        story_id: storyId,
        story_role: "frame",
        sequence_index: index,
        type: "image",
        prompt: finalPrompt,
        model,
        aspect_ratio: story.aspect_ratio,
        config: { aspect_ratio: story.aspect_ratio, purpose: "story_frame" },
        status: "processing",
        estimated_cost_usd: costPerImage,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (genInsertError || !generationData) {
      return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
    }

    const generationId = generationData.id as string;

    try {
      const response = await ai.models.generateImages({
        model,
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: story.aspect_ratio,
        },
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!imageBytes) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: "Imagen returned no image",
            completed_at: new Date().toISOString(),
          })
          .eq("id", generationId);
        return NextResponse.json(
          { error: "No image generated" },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(imageBytes, "base64");
      const fileName = `${user.id}/stories/${storyId}/frames/${index}.png`;

      const { error: uploadError } = await serviceClient.storage
        .from("mkt-assets")
        .upload(fileName, buffer, { contentType: "image/png", upsert: true });

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
          { error: "Storage upload failed" },
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
          actual_cost_usd: costPerImage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      await serviceClient.from("mkt_usage_logs").insert({
        user_id: user.id,
        generation_id: generationId,
        api_service: "imagen",
        model,
        operation: `story_frame_${index}`,
        estimated_cost_usd: costPerImage,
      });

      return NextResponse.json({
        generationId,
        index,
        outputUrl,
        status: "completed",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Imagen call failed";
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
    console.error("[frames POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate frame" },
      { status: 500 }
    );
  }
}
