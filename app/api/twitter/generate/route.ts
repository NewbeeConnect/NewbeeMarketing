/**
 * POST /api/twitter/generate
 *
 * Generate tweet content using Gemini AI.
 * Saves generated tweets to mkt_tweets table as drafts.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildTweetPrompt, type TweetCategory, type TweetLanguage } from "@/lib/twitter/prompts";

const generateSchema = z.object({
  category: z.enum([
    "value_content", "community_story", "engagement", "product_cta",
    "trend_hack", "did_you_know", "thread_guide", "motivation",
  ] as const),
  language: z.enum(["en", "tr", "de"] as const).default("en"),
  topic: z.string().optional(),
  context: z.string().optional(),
  count: z.number().min(1).max(10).default(3),
  threadLength: z.number().min(2).max(10).optional(),
});

export async function POST(req: Request) {
  try {
    // Auth
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // AI check
    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    // Rate limit
    const serviceClient = createServiceClient();
    const rateCheck = await checkRateLimit(serviceClient, user.id, "ai-gemini");
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.error }, { status: 429 });
    }

    // Validate input
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { category, language, topic, context, count, threadLength } = parsed.data;
    const isThread = category === "thread_guide";

    // Generate tweets
    const generatedTweets: Array<{ content: string; is_thread: boolean; thread_tweets?: string[] }> = [];

    for (let i = 0; i < count; i++) {
      const prompt = buildTweetPrompt({
        category: category as TweetCategory,
        language: language as TweetLanguage,
        topic,
        context,
        threadLength,
      });

      const result = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: prompt,
        config: {
          temperature: 0.9,
          maxOutputTokens: isThread ? 2000 : 500,
        },
      });

      const text = result.text?.trim() ?? "";

      if (isThread) {
        const threadTweets = text.split("---").map((t: string) => t.trim()).filter(Boolean);
        generatedTweets.push({
          content: threadTweets[0] ?? text,
          is_thread: true,
          thread_tweets: threadTweets,
        });
      } else {
        generatedTweets.push({ content: text, is_thread: false });
      }
    }

    // Save to database as drafts
    const rows = generatedTweets.map((tweet) => ({
      user_id: user.id,
      content: tweet.content,
      category,
      language,
      topic: topic ?? null,
      is_thread: tweet.is_thread,
      thread_tweets: tweet.thread_tweets ?? null,
      status: "draft" as const,
      generated_at: new Date().toISOString(),
    }));

    // mkt_tweets is not in generated types yet — cast to bypass type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = serviceClient as any;
    const { data: saved, error: saveError } = await db
      .from("mkt_tweets")
      .insert(rows)
      .select();

    if (saveError) {
      console.error("Failed to save tweets:", saveError);
      // Still return generated content even if save fails
      return NextResponse.json({
        data: generatedTweets,
        meta: { saved: false, error: saveError.message },
      });
    }

    // Log usage
    const estimatedTokens = count * 500;
    const estimatedCost = (estimatedTokens / 1_000_000) * (COST_ESTIMATES.gemini_flash_per_1m_input + COST_ESTIMATES.gemini_flash_per_1m_output);
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini" as const,
      operation: "tweet_generation",
      model: MODELS.GEMINI_FLASH,
      estimated_cost_usd: estimatedCost,
    });

    return NextResponse.json({
      data: saved,
      meta: { saved: true, count: saved.length },
    });
  } catch (e) {
    console.error("Tweet generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate tweets" },
      { status: 500 }
    );
  }
}
