/**
 * DB-backed token bucket rate limiter for Vercel Serverless.
 * Uses Supabase `mkt_rate_limits` table with an atomic RPC function,
 * so rate limits are shared across all serverless instances without race conditions.
 *
 * Usage:
 *   const result = await checkRateLimit(serviceClient, userId, "ai-gemini");
 *   if (!result.allowed) return NextResponse.json({ error: result.error }, { status: 429 });
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Import at runtime to determine environment-aware limits
const veoEnv = process.env.VEO_ENVIRONMENT === "production" ? "production" : "preview";
const veoMediaLimit = veoEnv === "production" ? 50 : 10;

/**
 * Rate limit presets per endpoint category.
 * maxTokens = max requests in the window, refillRate = tokens added per second.
 */
export const RATE_LIMITS = {
  /** Gemini text generation: 10 req/min */
  "ai-gemini": { maxTokens: 10, refillRate: 10 / 60 },
  /** Veo / Imagen media generation: environment-aware (preview=10, production=50) */
  "ai-media": { maxTokens: veoMediaLimit, refillRate: veoMediaLimit / 60 },
  /** General API: 60 req/min */
  "api-general": { maxTokens: 60, refillRate: 1 },
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  serviceClient: SupabaseClient,
  userId: string,
  category: RateLimitCategory,
  overrideMax?: number
): Promise<{ allowed: boolean; error?: string; retryAfterSeconds?: number }> {
  const config = RATE_LIMITS[category];
  const maxTokens = overrideMax ?? config.maxTokens;

  const { data, error } = await serviceClient.rpc("mkt_check_rate_limit", {
    p_user_id: userId,
    p_category: category,
    p_max_tokens: maxTokens,
    p_refill_rate: config.refillRate,
  });

  if (error) {
    console.error("Rate limit RPC failed:", error);
    // Fail open for rate limiting (unlike budget which fails closed)
    return { allowed: true };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result || result.allowed) {
    return { allowed: true };
  }

  const waitSeconds = result.retry_after_seconds ?? Math.ceil(1 / config.refillRate);
  return {
    allowed: false,
    error: `Rate limit exceeded. Try again in ${waitSeconds}s.`,
    retryAfterSeconds: waitSeconds,
  };
}
