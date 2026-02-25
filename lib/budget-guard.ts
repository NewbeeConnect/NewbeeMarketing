/**
 * Budget guard — checks if a user has exceeded their monthly AI spending limit.
 *
 * Usage:
 *   const budget = await checkBudget(serviceClient, userId);
 *   if (!budget.allowed) return NextResponse.json({ error: budget.error }, { status: 429 });
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Per-user monthly AI spending cap in USD */
const MONTHLY_LIMIT_USD = 500;

/** In-memory cache to avoid querying DB on every single request */
interface CachedSpend {
  totalUsd: number;
  fetchedAt: number;
}

const spendCache = new Map<string, CachedSpend>();
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

export async function checkBudget(
  serviceClient: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; totalSpent: number; remaining: number; error?: string }> {
  const now = Date.now();

  // Check cache first
  const cached = spendCache.get(userId);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    if (cached.totalUsd >= MONTHLY_LIMIT_USD) {
      return {
        allowed: false,
        totalSpent: cached.totalUsd,
        remaining: 0,
        error: `Monthly AI budget exceeded ($${cached.totalUsd.toFixed(2)} / $${MONTHLY_LIMIT_USD}). Resets next month.`,
      };
    }
    return { allowed: true, totalSpent: cached.totalUsd, remaining: MONTHLY_LIMIT_USD - cached.totalUsd };
  }

  // Query DB for current month's spending
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await serviceClient
    .from("mkt_usage_logs")
    .select("estimated_cost_usd")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    // Fail closed — block requests when budget cannot be verified
    console.error("Budget check failed:", error);
    return { allowed: false, totalSpent: 0, remaining: 0, error: "Budget check temporarily unavailable. Please try again." };
  }

  const totalUsd = (data ?? []).reduce(
    (sum, row) => sum + (row.estimated_cost_usd ?? 0),
    0
  );

  // Update cache
  spendCache.set(userId, { totalUsd, fetchedAt: now });

  if (totalUsd >= MONTHLY_LIMIT_USD) {
    return {
      allowed: false,
      totalSpent: totalUsd,
      remaining: 0,
      error: `Monthly AI budget exceeded ($${totalUsd.toFixed(2)} / $${MONTHLY_LIMIT_USD}). Resets next month.`,
    };
  }

  return { allowed: true, totalSpent: totalUsd, remaining: MONTHLY_LIMIT_USD - totalUsd };
}
