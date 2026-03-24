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
  { hour: 7, minute: 0, category: "value_content" },     // 08:00 CET — morning tip
  { hour: 9, minute: 0, category: "engagement" },         // 10:00 CET — start a debate
  { hour: 11, minute: 0, category: "did_you_know" },      // 12:00 CET — lunch scroll-stopper
  { hour: 14, minute: 0, category: "community_story" },   // 15:00 CET — afternoon feels
  { hour: 17, minute: 0, category: "motivation" },        // 18:00 CET — evening real talk
];

// Random specific topics to prevent repetition — AI picks from these for variety
const TOPIC_POOL: Record<TweetCategory, string[]> = {
  value_content: [
    "Anmeldung hacks", "Schufa score from zero", "Kündigung rules employees don't know",
    "free German courses nobody mentions", "how to actually get a Termin at Ausländerbehörde",
    "Elterngeld tips for expats", "GEZ fee and how to deal with it", "Nebenkostenabrechnung traps",
    "best banking apps for expats", "how to read a German payslip", "apartment Bewerbungsmappe secrets",
    "health insurance switching deadlines", "tax class for married couples", "Rundfunkbeitrag exemptions",
    "how to get a Wohnberechtigungsschein", "Kindergeld application mistakes",
  ],
  engagement: [
    "worst German bureaucracy experience", "German habits you accidentally adopted",
    "what you miss most from home", "most confusing German rule", "is Germany worth it",
    "Berlin vs Munich debate", "German directness - rude or refreshing?",
    "dating in Germany as a foreigner", "Sunday Ruhetag - love it or hate it?",
    "your most embarrassing German language fail", "pfand system - genius or annoying?",
    "Karneval vs Halloween", "German work culture shock", "supermarket checkout speed trauma",
  ],
  did_you_know: [
    "German immigration statistics", "how many languages are spoken in Berlin",
    "Turkish population in Germany history", "Blue Card vs normal work visa numbers",
    "average time for Einbürgerung", "how many people leave Germany each year",
    "German dual citizenship new law", "percentage of immigrants in German workforce",
    "history of Gastarbeiter program", "refugee integration success stories data",
  ],
  community_story: [
    "first day alone in Germany", "making your first German friend", "food you can't find here",
    "calling home and pretending everything's fine", "first Weihnachtsmarkt experience",
    "when German bureaucracy actually worked", "culture shock moment", "apartment hunting horror",
    "moment you felt like you belonged", "learning to say no in German culture",
    "your German neighbor interaction", "first summer in Germany vs back home",
  ],
  motivation: [
    "the loneliness nobody talks about", "missing family celebrations back home",
    "identity crisis between two cultures", "the day it finally clicked",
    "building a life from zero", "when you realize Germany is home now",
    "for everyone who cried at the Ausländerbehörde", "strength in being different",
  ],
  product_cta: [],
  trend_hack: [],
  thread_guide: [],
};

function pickRandomTopic(category: TweetCategory): string | undefined {
  const pool = TOPIC_POOL[category];
  if (!pool || pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

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

      const topic = pickRandomTopic(slot.category);
      const prompt = buildTweetPrompt({
        category: slot.category,
        language,
        topic,
      });

      const result = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: prompt,
        config: {
          temperature: 1.0,
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
