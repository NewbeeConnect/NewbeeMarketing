import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import { parseAiJson } from "@/lib/ai/response-schemas";
import {
  INSTAGRAM_CAPTION_SYSTEM_PROMPT,
  buildInstagramCaptionPrompt,
} from "@/lib/ai/prompts/instagram-caption";
import { z } from "zod";

const captionResponseSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  first_comment: z.string(),
  cta_text: z.string(),
});

const requestSchema = z.object({
  product_name: z.string().min(1),
  product_description: z.string().optional(),
  video_description: z.string().min(1),
  target_audience: z.string().optional(),
  tone: z
    .enum(["professional", "casual", "playful", "urgent", "inspirational"])
    .optional(),
  placement: z.enum(["feed", "story", "reels"]).optional(),
  language: z.string().optional(),
  cta_type: z.string().optional(),
});

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

    if (!ai) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const userPrompt = buildInstagramCaptionPrompt({
      productName: parsed.data.product_name,
      productDescription: parsed.data.product_description || "",
      videoDescription: parsed.data.video_description,
      targetAudience: parsed.data.target_audience || "general audience",
      tone: parsed.data.tone || "casual",
      placement: parsed.data.placement || "feed",
      language: parsed.data.language || "Turkish",
      ctaType: parsed.data.cta_type,
    });

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: userPrompt,
      config: {
        systemInstruction: INSTAGRAM_CAPTION_SYSTEM_PROMPT,
        temperature: 0.8,
      },
    });

    const text = response.text ?? "";
    const caption = parseAiJson(text, captionResponseSchema);

    // Log usage
    const inputTokens = Math.ceil(
      (INSTAGRAM_CAPTION_SYSTEM_PROMPT.length + userPrompt.length) / 4
    );
    const outputTokens = Math.ceil(text.length / 4);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini" as const,
      model: MODELS.GEMINI_FLASH,
      operation: "instagram_caption",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd:
        (inputTokens / 1_000_000) * 0.075 +
        (outputTokens / 1_000_000) * 0.6,
    });

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("[InstagramCaption] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate caption",
      },
      { status: 500 }
    );
  }
}
