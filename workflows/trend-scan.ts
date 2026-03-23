/**
 * Trend Scan Workflow (WDK)
 *
 * Runs every 6 hours via cron. Fetches trends from all connected platforms,
 * scores them, and stores top results. Notifies user of high-score trends.
 */

import { getWritable } from "workflow";

export type TrendScanEvent =
  | { type: "scanning"; platform: string }
  | { type: "scored"; count: number; topTrend: string }
  | { type: "complete"; totalFound: number; highScoreCount: number };

const TREND_SCORE_THRESHOLD = 0.6;

export async function trendScanWorkflow(userId: string): Promise<{
  totalFound: number;
  stored: number;
}> {
  "use workflow";

  // Step 1: Get user's connected platforms and brand context
  const context = await getUserContext(userId);
  if (!context) return { totalFound: 0, stored: 0 };

  // Step 2: Fetch trends from each platform (parallel would be ideal, but sequential for durability)
  const allTrends: import("@/lib/social/trend-scorer").RawTrend[] = [];

  for (const platform of context.platforms) {
    await emitEvent({ type: "scanning", platform });
    const trends = await fetchPlatformTrends(platform);
    allTrends.push(...trends);
  }

  if (allTrends.length === 0) {
    await emitEvent({ type: "complete", totalFound: 0, highScoreCount: 0 });
    return { totalFound: 0, stored: 0 };
  }

  // Step 3: Score all trends
  const scored = await scoreTrendsStep(allTrends, context.brand, context.platforms);

  await emitEvent({
    type: "scored",
    count: scored.length,
    topTrend: scored[0]?.name ?? "none",
  });

  // Step 4: Store high-scoring trends
  const stored = await storeTrends(userId, scored.filter(t => t.compositeScore >= TREND_SCORE_THRESHOLD));

  // Step 5: Notify for high-score trends
  const highScoreTrends = scored.filter(t => t.compositeScore >= 0.8);
  if (highScoreTrends.length > 0) {
    await notifyHighScoreTrends(userId, highScoreTrends);
  }

  await emitEvent({ type: "complete", totalFound: allTrends.length, highScoreCount: highScoreTrends.length });
  return { totalFound: allTrends.length, stored };
}

async function getUserContext(userId: string): Promise<{
  platforms: import("@/lib/social/types").SocialPlatform[];
  brand: { name: string; description: string; targetAudience?: string };
} | null> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  const { data: accounts } = await client
    .from("mkt_social_accounts")
    .select("platform")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) return null;

  const { data: brandKit } = await client
    .from("mkt_brand_kit")
    .select("name, brand_voice")
    .eq("user_id", userId)
    .limit(1)
    .single();

  return {
    platforms: [...new Set(accounts.map(a => a.platform))] as import("@/lib/social/types").SocialPlatform[],
    brand: {
      name: brandKit?.name ?? "Newbee",
      description: brandKit?.brand_voice ?? "Mobile app for expats living abroad",
    },
  };
}

async function fetchPlatformTrends(
  platform: string
): Promise<import("@/lib/social/trend-scorer").RawTrend[]> {
  "use step";
  console.log(`[TrendScan] Fetching trends for ${platform}`);

  // Each platform has different trend APIs — using stub/placeholder data
  // that will be replaced with real API calls per platform
  const p = platform as import("@/lib/social/types").SocialPlatform;

  try {
    switch (p) {
      case "twitter": {
        // X Trends API v2 — placeholder until API keys configured
        return [{
          name: "#TechTrend",
          platform: p,
          trendType: "hashtag" as const,
          volume: 50000,
          growthRate: 25,
          detectedAt: new Date(),
        }];
      }
      case "tiktok": {
        return [{
          name: "#fyp_trending",
          platform: p,
          trendType: "hashtag" as const,
          volume: 200000,
          growthRate: 40,
          detectedAt: new Date(),
        }];
      }
      default:
        return [];
    }
  } catch (e) {
    console.error(`[TrendScan] Error fetching ${platform} trends:`, e);
    return [];
  }
}

async function scoreTrendsStep(
  trends: import("@/lib/social/trend-scorer").RawTrend[],
  brand: { name: string; description: string; targetAudience?: string },
  platforms: import("@/lib/social/types").SocialPlatform[]
): Promise<import("@/lib/social/trend-scorer").ScoredTrend[]> {
  "use step";
  const { scoreTrends } = await import("@/lib/social/trend-scorer");
  return scoreTrends(trends, brand, platforms);
}

async function storeTrends(
  userId: string,
  trends: import("@/lib/social/trend-scorer").ScoredTrend[]
): Promise<number> {
  "use step";
  if (trends.length === 0) return 0;

  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  const rows = trends.map(t => ({
    user_id: userId,
    platform: t.platform,
    trend_type: t.trendType,
    name: t.name,
    description: t.description ?? null,
    volume: t.volume ?? null,
    growth_rate: t.growthRate ?? null,
    virality_score: t.viralityScore,
    brand_relevance_score: t.brandRelevanceScore,
    composite_score: t.compositeScore,
    source_url: t.sourceUrl ?? null,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h expiry
  }));

  const { error } = await client.from("mkt_trends").insert(rows);
  if (error) console.error("[TrendScan] Store error:", error);
  return error ? 0 : rows.length;
}

async function notifyHighScoreTrends(
  userId: string,
  trends: import("@/lib/social/trend-scorer").ScoredTrend[]
): Promise<void> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  await client.from("mkt_notifications").insert({
    user_id: userId,
    type: "trend_detected",
    title: `${trends.length} High-Score Trend${trends.length > 1 ? "s" : ""} Detected`,
    message: `Top: "${trends[0].name}" (score: ${(trends[0].compositeScore * 100).toFixed(0)}%). Check Trends page for details.`,
    reference_type: "trend",
  });
}

async function emitEvent(event: TrendScanEvent): Promise<void> {
  "use step";
  const writer = getWritable<TrendScanEvent>().getWriter();
  try { await writer.write(event); } finally { writer.releaseLock(); }
}
