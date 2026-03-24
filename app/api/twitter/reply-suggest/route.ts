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
  helpful: "Give a SPECIFIC, actionable tip they probably don't know. Not generic advice — the kind of insider knowledge that makes them go 'wait really?' Share something you learned the hard way.",
  empathetic: "Validate their feelings WITHOUT being patronizing. Say 'same' energy, not 'it gets better' energy. Share a real-sounding micro-experience that shows you GET IT.",
  funny: "Be genuinely funny — internet humor, mild sarcasm, relatable exaggeration. Think 'reply guy who actually makes you laugh' not 'brand trying to be hip'. Never punch down.",
  expert: "Drop knowledge like a friend who happens to be an expert. Specific facts, insider tips, or 'actually, here's what most people don't know...' energy. Be the person everyone wants in their DMs.",
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

    const prompt = `You are @newbeeconnect on X — NOT a brand account, a real person who moved to Germany and now runs a community for immigrants. You're known for being genuinely helpful, funny, and real.

Someone posted this:
${tweetAuthor ? `@${tweetAuthor}: ` : ""}"${tweetText}"

Write 3 reply options. ${STYLE_INSTRUCTIONS[style]}

${langInstruction}

RULES:
- Max 280 characters each
- NO links, NO hashtags in replies
- Sound like a real person replying, not a brand
- Don't say "as an expat community" or "at Newbee we..." — that's cringe
- Only mention community/app if it genuinely fits (max 1 out of 3 replies)
- 0-1 emojis per reply. Less is more.
- Each reply takes a DIFFERENT angle — don't repeat the same idea
- Don't start all 3 with the same word
- If the tweet is about a problem, don't just say "oh that sucks" — add VALUE
- If it sounds like a customer service bot, DELETE IT

Format: exactly 3 replies, numbered 1-3, one per line. Nothing else.`;

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
