/**
 * Trend Scorer
 *
 * Scores trends by: virality (0.3) + brand relevance (0.4) + freshness (0.2) + platform alignment (0.1).
 * Uses Gemini Flash for brand relevance assessment (cheap, fast).
 */

import type { SocialPlatform, TrendScoringInput } from "./types";

export interface RawTrend {
  name: string;
  description?: string;
  platform: SocialPlatform;
  trendType: "hashtag" | "topic" | "sound" | "challenge" | "keyword";
  volume?: number;
  growthRate?: number;
  detectedAt: Date;
  sourceUrl?: string;
}

export interface ScoredTrend extends RawTrend {
  viralityScore: number;
  brandRelevanceScore: number;
  freshnessScore: number;
  platformAlignmentScore: number;
  compositeScore: number;
}

const WEIGHTS = {
  virality: 0.3,
  brandRelevance: 0.4,
  freshness: 0.2,
  platformAlignment: 0.1,
};

/**
 * Score a batch of trends. Uses Gemini Flash for brand relevance.
 */
export async function scoreTrends(
  trends: RawTrend[],
  brandContext: { name: string; description: string; targetAudience?: string },
  targetPlatforms: SocialPlatform[]
): Promise<ScoredTrend[]> {
  const scored: ScoredTrend[] = [];

  for (const trend of trends) {
    const viralityScore = computeViralityScore(trend);
    const freshnessScore = computeFreshnessScore(trend.detectedAt);
    const platformAlignmentScore = targetPlatforms.includes(trend.platform) ? 1.0 : 0.3;

    // Batch brand relevance via Gemini (or fallback to keyword matching)
    const brandRelevanceScore = await computeBrandRelevance(trend, brandContext);

    const compositeScore =
      viralityScore * WEIGHTS.virality +
      brandRelevanceScore * WEIGHTS.brandRelevance +
      freshnessScore * WEIGHTS.freshness +
      platformAlignmentScore * WEIGHTS.platformAlignment;

    scored.push({
      ...trend,
      viralityScore,
      brandRelevanceScore,
      freshnessScore,
      platformAlignmentScore,
      compositeScore,
    });
  }

  return scored.sort((a, b) => b.compositeScore - a.compositeScore);
}

function computeViralityScore(trend: RawTrend): number {
  // Normalize volume and growth rate to 0-1
  const volumeScore = trend.volume
    ? Math.min(trend.volume / 1_000_000, 1.0) // 1M+ = max
    : 0.5;

  const growthScore = trend.growthRate
    ? Math.min(Math.max(trend.growthRate / 100, 0), 1.0) // 100%+ growth = max
    : 0.5;

  return volumeScore * 0.4 + growthScore * 0.6;
}

function computeFreshnessScore(detectedAt: Date): number {
  const hoursAgo = (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);
  // Exponential decay: 1.0 at 0h, ~0.5 at 12h, ~0.1 at 48h
  return Math.exp(-0.06 * hoursAgo);
}

async function computeBrandRelevance(
  trend: RawTrend,
  brandContext: { name: string; description: string; targetAudience?: string }
): Promise<number> {
  try {
    const { ai } = await import("@/lib/google-ai");
    if (!ai) return keywordFallback(trend, brandContext);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rate how relevant this trend is to the brand on a scale of 0.0 to 1.0.
Brand: ${brandContext.name} — ${brandContext.description}
Target audience: ${brandContext.targetAudience ?? "general"}
Trend: "${trend.name}" (${trend.trendType} on ${trend.platform})
${trend.description ? `Description: ${trend.description}` : ""}

Return ONLY a number between 0.0 and 1.0. Nothing else.`,
    });

    const score = parseFloat(result.text?.trim() ?? "0.5");
    return isNaN(score) ? 0.5 : Math.min(Math.max(score, 0), 1);
  } catch {
    return keywordFallback(trend, brandContext);
  }
}

function keywordFallback(
  trend: RawTrend,
  brandContext: { name: string; description: string }
): number {
  const trendText = `${trend.name} ${trend.description ?? ""}`.toLowerCase();
  const brandWords = brandContext.description.toLowerCase().split(/\s+/);
  const matches = brandWords.filter(w => w.length > 3 && trendText.includes(w));
  return Math.min(matches.length / 5, 1.0);
}
