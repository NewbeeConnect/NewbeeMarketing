/**
 * In-memory token bucket rate limiter for Vercel Edge/Serverless.
 *
 * Usage:
 *   const result = checkRateLimit(userId, "ai-gemini", 10);
 *   if (!result.allowed) return NextResponse.json({ error: result.error }, { status: 429 });
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

// Clean up stale buckets every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BUCKET_TTL_MS = 10 * 60 * 1000; // 10 min inactive → remove
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_TTL_MS) {
      buckets.delete(key);
    }
  }
}

/**
 * Rate limit presets per endpoint category.
 * maxTokens = max requests in the window, refillRate = tokens added per second.
 */
export const RATE_LIMITS = {
  /** Gemini text generation: 10 req/min */
  "ai-gemini": { maxTokens: 10, refillRate: 10 / 60 },
  /** Veo / Imagen media generation: 3 req/min */
  "ai-media": { maxTokens: 3, refillRate: 3 / 60 },
  /** General API: 60 req/min */
  "api-general": { maxTokens: 60, refillRate: 1 },
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

export function checkRateLimit(
  userId: string,
  category: RateLimitCategory,
  overrideMax?: number
): { allowed: boolean; error?: string; retryAfterSeconds?: number } {
  cleanup();

  const config = RATE_LIMITS[category];
  const maxTokens = overrideMax ?? config.maxTokens;
  const key = `${userId}:${category}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * config.refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const waitSeconds = Math.ceil((1 - bucket.tokens) / config.refillRate);
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${waitSeconds}s.`,
      retryAfterSeconds: waitSeconds,
    };
  }

  bucket.tokens -= 1;
  return { allowed: true };
}
