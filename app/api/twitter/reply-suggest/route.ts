/**
 * POST /api/twitter/reply-suggest
 *
 * Given a tweet's text, generate a helpful reply suggestion
 * that positions @newbeeconnect as a valuable community member.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  tweetText: z.string().min(1).max(2000),
  tweetAuthor: z.string().optional(),
  style: z.enum(["helpful", "empathetic", "funny", "expert"]).default("helpful"),
  language: z.enum(["en", "tr", "de"]).default("en"),
});

const STYLE_INSTRUCTIONS: Record<string, string> = {
  helpful: "Be genuinely helpful. Share a practical tip or resource related to their problem.",
  empathetic: "Show empathy and understanding. Share that you/your community went through the same thing.",
  funny: "Be lighthearted and relatable with gentle humor. Don't be sarcastic or dismissive.",
  expert: "Provide authoritative, detailed information. Position yourself as knowledgeable about expat life in Germany.",
};

export async function POST(req: Request) {
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
    const rateCheck = await checkRateLimit(serviceClient, user.id, "ai-gemini");
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.error }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tweetText, tweetAuthor, style, language } = parsed.data;

    const langInstruction = language === "tr"
      ? "Reply in Turkish."
      : language === "de"
        ? "Reply in German."
        : "Reply in English.";

    const prompt = `You are the social media manager for Newbee (@newbeeconnect), an expat community app for immigrants in Germany.

Someone posted this tweet:
${tweetAuthor ? `@${tweetAuthor}: ` : ""}"${tweetText}"

Generate 3 different reply options. ${STYLE_INSTRUCTIONS[style]}

Rules:
- ${langInstruction}
- Max 280 characters each
- NEVER include links in replies
- NEVER directly promote the app — be genuinely helpful first
- If relevant, subtly mention "our community" or "we built something for this" but only if natural
- Use 1-2 emojis max
- Be conversational, not corporate
- Each reply should take a different angle

Format: Return exactly 3 replies, one per line, numbered 1-3. Nothing else.`;

    const result = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: prompt,
      config: { temperature: 0.9, maxOutputTokens: 500 },
    });

    const text = result.text?.trim() ?? "";
    const replies = text
      .split("\n")
      .map((line: string) => line.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter((line: string) => line.length > 0 && line.length <= 300);

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini" as const,
      operation: "reply_suggestion",
      model: MODELS.GEMINI_FLASH,
      estimated_cost_usd: (500 / 1_000_000) * (COST_ESTIMATES.gemini_flash_per_1m_input + COST_ESTIMATES.gemini_flash_per_1m_output),
    });

    return NextResponse.json({ data: replies });
  } catch (e) {
    console.error("Reply suggest error:", e);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
