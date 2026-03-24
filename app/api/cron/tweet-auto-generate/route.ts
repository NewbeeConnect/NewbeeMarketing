/**
 * GET /api/cron/tweet-auto-generate
 *
 * Daily cron (07:00 UTC / 08:00 CET) — generates 5 tweets via AI
 * and schedules them throughout the day at optimal times.
 *
 * Schedule: 08:00, 10:00, 12:00, 15:00, 18:00 CET (UTC+1)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { buildTweetPrompt, type TweetCategory, type TweetLanguage } from "@/lib/twitter/prompts";

// 5 tweets/day with varied categories and times (UTC hours → CET = UTC+1)
const DAILY_SCHEDULE: Array<{ hour: number; minute: number; category: TweetCategory }> = [
  { hour: 7, minute: 0, category: "value_content" },     // 08:00 CET
  { hour: 9, minute: 0, category: "engagement" },         // 10:00 CET
  { hour: 11, minute: 0, category: "did_you_know" },      // 12:00 CET
  { hour: 14, minute: 0, category: "community_story" },   // 15:00 CET
  { hour: 17, minute: 0, category: "motivation" },        // 18:00 CET
];

// Rotate languages: mostly English, some Turkish and German
function pickLanguage(dayOfWeek: number, slotIndex: number): TweetLanguage {
  // Mon-Fri: 3 EN, 1 TR, 1 DE per day
  if (slotIndex === 1) return "tr"; // 10:00 CET slot → Turkish
  if (slotIndex === 3) return "de"; // 15:00 CET slot → German
  return "en";
}

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = serviceClient as any;

    // Get the first user (single-tenant for now — @newbeeconnect owner)
    const { data: users } = await db
      .from("mkt_tweets")
      .select("user_id")
      .limit(1);

    if (!users || users.length === 0) {
      return NextResponse.json({ ok: true, message: "No users found" });
    }

    const userId = users[0].user_id;
    const today = new Date();
    const dayOfWeek = today.getUTCDay();

    // Check if tweets are already generated for today
    const todayStart = new Date(today);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const { count: existingCount } = await db
      .from("mkt_tweets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .gte("scheduled_for", todayStart.toISOString())
      .lte("scheduled_for", todayEnd.toISOString());

    if ((existingCount ?? 0) >= 5) {
      return NextResponse.json({ ok: true, message: "Already generated for today", existing: existingCount });
    }

    const generated: Array<{ category: string; language: string; scheduledFor: string }> = [];

    for (let i = 0; i < DAILY_SCHEDULE.length; i++) {
      const slot = DAILY_SCHEDULE[i];
      const language = pickLanguage(dayOfWeek, i);

      const prompt = buildTweetPrompt({
        category: slot.category,
        language,
      });

      const result = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: prompt,
        config: {
          temperature: 0.9,
          maxOutputTokens: 500,
        },
      });

      const text = result.text?.trim() ?? "";
      if (!text) continue;

      // Calculate scheduled time
      const scheduledFor = new Date(today);
      scheduledFor.setUTCHours(slot.hour, slot.minute, 0, 0);

      // If time already passed today, skip
      if (scheduledFor <= new Date()) continue;

      await db.from("mkt_tweets").insert({
        user_id: userId,
        content: text,
        category: slot.category,
        language,
        is_thread: false,
        status: "scheduled",
        scheduled_for: scheduledFor.toISOString(),
        generated_at: new Date().toISOString(),
      });

      generated.push({
        category: slot.category,
        language,
        scheduledFor: scheduledFor.toISOString(),
      });
    }

    // Log AI usage
    const estimatedCost = (generated.length * 500 / 1_000_000) *
      (COST_ESTIMATES.gemini_flash_per_1m_input + COST_ESTIMATES.gemini_flash_per_1m_output);

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: userId,
      api_service: "gemini" as const,
      operation: "tweet_auto_generate",
      model: MODELS.GEMINI_FLASH,
      estimated_cost_usd: estimatedCost,
    });

    return NextResponse.json({
      ok: true,
      generated: generated.length,
      tweets: generated,
    });
  } catch (e) {
    console.error("[tweet-auto-generate] Error:", e);
    return NextResponse.json({ error: "Auto-generate failed" }, { status: 500 });
  }
}
