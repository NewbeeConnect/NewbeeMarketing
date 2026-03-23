/**
 * A/B Test Lifecycle Workflow (WDK)
 *
 * 1. Deploy all variants with equal allocation
 * 2. Monitor loop: sleep → sync metrics → Thompson Sampling → check significance
 * 3. Declare winner or timeout
 */

import { sleep, getWritable } from "workflow";

export type ABTestEvent =
  | { type: "monitoring"; cycle: number; allocations: Record<string, number> }
  | { type: "winner_declared"; winner: string; pValue: number }
  | { type: "timeout"; bestVariant: string }
  | { type: "error"; message: string };

export async function abTestLifecycleWorkflow(testId: string): Promise<{
  status: "completed" | "timeout" | "error";
  winner: string | null;
}> {
  "use workflow";

  const CHECK_INTERVAL = "6h";
  const maxCycles = await getMaxCycles(testId);
  let cycle = 0;

  while (cycle < maxCycles) {
    await sleep(CHECK_INTERVAL);
    cycle++;

    const result = await checkAndUpdateAllocations(testId, cycle);

    if (result.significantWinner) {
      await emitEvent({ type: "winner_declared", winner: result.significantWinner, pValue: result.pValue });
      await declareWinner(testId, result.significantWinner, result.pValue);
      return { status: "completed", winner: result.significantWinner };
    }

    await emitEvent({ type: "monitoring", cycle, allocations: result.allocations });
  }

  // Timeout: pick best performer
  const best = await getBestPerformer(testId);
  await emitEvent({ type: "timeout", bestVariant: best });
  await declareWinner(testId, best, 1.0);
  return { status: "timeout", winner: best };
}

async function getMaxCycles(testId: string): Promise<number> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  const { data } = await client.from("mkt_ab_tests").select("max_duration_days").eq("id", testId).single();
  const days = data?.max_duration_days ?? 14;
  return Math.ceil((days * 24) / 6); // 6-hour intervals
}

async function checkAndUpdateAllocations(testId: string, cycle: number): Promise<{
  allocations: Record<string, number>;
  significantWinner: string | null;
  pValue: number;
}> {
  "use step";
  console.log(`[AB-Test] Cycle ${cycle} for test ${testId}`);
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  // Get test config
  const { data: test } = await client.from("mkt_ab_tests")
    .select("id, user_id, name, status, success_metric, confidence_level, allocation_strategy, current_allocations")
    .eq("id", testId).single();
  if (!test) throw new Error(`Test ${testId} not found`);

  // Get variant metrics
  const { data: variants } = await client
    .from("mkt_ab_test_variants")
    .select("id, label, content_queue_id, allocation_pct, total_impressions, total_clicks, total_engagement, engagement_rate")
    .eq("ab_test_id", testId);

  if (!variants || variants.length < 2) {
    return { allocations: {}, significantWinner: null, pValue: 1 };
  }

  // Sync metrics only for this test's variant content items (not all published content)
  const variantContentIds = variants
    .map((v) => v.content_queue_id)
    .filter((id): id is string => id !== null);

  if (variantContentIds.length > 0) {
    const { syncMetricsForContentIds } = await import("@/lib/social/metrics-syncer");
    await syncMetricsForContentIds(client, variantContentIds);
  }

  // Aggregate metrics per variant
  const variantStats = await Promise.all(
    variants.map(async (v) => {
      if (!v.content_queue_id) return null;
      const { data: metrics } = await client
        .from("mkt_social_post_metrics")
        .select("impressions, clicks, likes, comments, shares")
        .eq("content_queue_id", v.content_queue_id);

      const totalImpressions = metrics?.reduce((s, m) => s + m.impressions, 0) ?? 0;
      const totalEngagement = metrics?.reduce((s, m) => s + m.likes + m.comments + m.shares, 0) ?? 0;

      return {
        variantLabel: v.label,
        impressions: totalImpressions,
        successes: test.success_metric === "clicks"
          ? (metrics?.reduce((s, m) => s + m.clicks, 0) ?? 0)
          : totalEngagement,
        failures: Math.max(0, totalImpressions - totalEngagement),
        rate: totalImpressions > 0 ? totalEngagement / totalImpressions : 0,
      };
    })
  );

  const validStats = variantStats.filter(Boolean) as import("@/lib/social/types").VariantStats[];

  // Thompson Sampling for new allocations
  const { thompsonSampling, findWinner } = await import("@/lib/social/ab-engine");
  const { allocations } = thompsonSampling(validStats);

  // Check statistical significance
  const significance = findWinner(validStats, test.confidence_level);

  // Update allocations in DB
  await client.from("mkt_ab_tests").update({ current_allocations: allocations }).eq("id", testId);
  for (const v of variants) {
    if (allocations[v.label] !== undefined) {
      await client.from("mkt_ab_test_variants")
        .update({ allocation_pct: allocations[v.label] })
        .eq("id", v.id);
    }
  }

  console.log(`[AB-Test] Cycle ${cycle} done. Significant: ${significance.significant}, Winner: ${significance.winner}`);
  return {
    allocations,
    significantWinner: significance.significant ? significance.winner : null,
    pValue: significance.pValue,
  };
}

async function declareWinner(testId: string, winner: string, pValue: number): Promise<void> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  await client.from("mkt_ab_tests").update({
    status: "completed",
    winner_variant: winner,
    winner_declared_at: new Date().toISOString(),
    significance_p_value: pValue,
  }).eq("id", testId);

  await client.from("mkt_ab_test_variants").update({ is_winner: true }).eq("ab_test_id", testId).eq("label", winner);

  // Get test user for notification
  const { data: test } = await client.from("mkt_ab_tests").select("user_id, name").eq("id", testId).single();
  if (test) {
    await client.from("mkt_notifications").insert({
      user_id: test.user_id,
      type: "ab_test_winner",
      title: `A/B Test Winner: Variant ${winner}`,
      message: `Variant ${winner} won the A/B test "${test.name}" with p-value ${pValue.toFixed(4)}.`,
      reference_id: testId,
      reference_type: "ab_test",
    });
  }
}

async function getBestPerformer(testId: string): Promise<string> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  const { data } = await client
    .from("mkt_ab_test_variants")
    .select("label, engagement_rate")
    .eq("ab_test_id", testId)
    .order("engagement_rate", { ascending: false })
    .limit(1)
    .single();
  return data?.label ?? "A";
}

async function emitEvent(event: ABTestEvent): Promise<void> {
  "use step";
  const writer = getWritable<ABTestEvent>().getWriter();
  try { await writer.write(event); } finally { writer.releaseLock(); }
}
