/**
 * Budget guard — checks if a user has exceeded their monthly AI spending limit.
 * DB-backed: queries Supabase directly (no in-memory cache) to work correctly
 * in serverless environments where each instance has isolated memory.
 *
 * Usage:
 *   const budget = await checkBudget(serviceClient, userId);
 *   if (!budget.allowed) return NextResponse.json({ error: budget.error }, { status: 429 });
 *
 *   // With pre-deduction (checks if estimated cost would exceed budget):
 *   const budget = await checkBudget(serviceClient, userId, 3.20);
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Per-user monthly AI spending cap in USD */
const MONTHLY_LIMIT_USD = 500;

export async function checkBudget(
  serviceClient: SupabaseClient,
  userId: string,
  estimatedCostUsd?: number
): Promise<{ allowed: boolean; totalSpent: number; remaining: number; error?: string }> {
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

  // Pre-deduction check: would this operation exceed the budget?
  const projectedTotal = totalUsd + (estimatedCostUsd ?? 0);

  if (projectedTotal >= MONTHLY_LIMIT_USD) {
    return {
      allowed: false,
      totalSpent: totalUsd,
      remaining: Math.max(0, MONTHLY_LIMIT_USD - totalUsd),
      error: `Monthly AI budget exceeded ($${totalUsd.toFixed(2)} / $${MONTHLY_LIMIT_USD}). Resets next month.`,
    };
  }

  return { allowed: true, totalSpent: totalUsd, remaining: MONTHLY_LIMIT_USD - totalUsd };
}
