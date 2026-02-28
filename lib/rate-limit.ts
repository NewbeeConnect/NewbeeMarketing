/**
 * DB-backed token bucket rate limiter for Vercel Serverless.
 * Uses Supabase `mkt_rate_limits` table instead of in-memory state,
 * so rate limits are shared across all serverless instances.
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
  const now = new Date();

  // Upsert: get or create bucket
  const { data: bucket, error: fetchError } = await serviceClient
    .from("mkt_rate_limits")
    .select("id, tokens, last_refill_at")
    .eq("user_id", userId)
    .eq("category", category)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows found (expected for new users)
    console.error("Rate limit check failed:", fetchError);
    // Fail open for rate limiting (unlike budget which fails closed)
    return { allowed: true };
  }

  if (!bucket) {
    // First request — create bucket with tokens - 1
    await serviceClient.from("mkt_rate_limits").insert({
      user_id: userId,
      category,
      tokens: maxTokens - 1,
      last_refill_at: now.toISOString(),
    });
    return { allowed: true };
  }

  // Refill tokens based on elapsed time
  const lastRefill = new Date(bucket.last_refill_at);
  const elapsedSeconds = (now.getTime() - lastRefill.getTime()) / 1000;
  const refilledTokens = Math.min(maxTokens, bucket.tokens + elapsedSeconds * config.refillRate);

  if (refilledTokens < 1) {
    const waitSeconds = Math.ceil((1 - refilledTokens) / config.refillRate);
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${waitSeconds}s.`,
      retryAfterSeconds: waitSeconds,
    };
  }

  // Consume one token
  await serviceClient
    .from("mkt_rate_limits")
    .update({
      tokens: refilledTokens - 1,
      last_refill_at: now.toISOString(),
    })
    .eq("id", bucket.id);

  return { allowed: true };
}
