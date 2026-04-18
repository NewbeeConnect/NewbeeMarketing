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
import { NextResponse } from "next/server";

export type RateLimitResult = {
  allowed: boolean;
  error?: string;
  retryAfterSeconds?: number;
};

/**
 * Standard 429 response for rate-limited requests. Always includes a
 * `Retry-After` header so clients know how long to back off.
 */
export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: result.error ?? "Rate limit exceeded" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds ?? 60) },
    }
  );
}

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
  /** Social media publishing: 25 req/hour (shared across platforms) */
  "social-publish": { maxTokens: 25, refillRate: 25 / 3600 },
  /** Social metrics sync: 100 req/hour */
  "social-metrics": { maxTokens: 100, refillRate: 100 / 3600 },
  /** Trend scanning: 30 req/hour */
  "social-trends": { maxTokens: 30, refillRate: 30 / 3600 },
  /** Autopilot runs: 5 req/hour */
  "autopilot": { maxTokens: 5, refillRate: 5 / 3600 },
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  serviceClient: SupabaseClient,
  userId: string,
  category: RateLimitCategory,
  overrideMax?: number
): Promise<RateLimitResult> {
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
    // Fail closed — deny requests when rate limit system is unavailable
    return { allowed: false, error: "Rate limit check temporarily unavailable. Try again later." };
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
