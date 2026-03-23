import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron-auth";

/** GET: Cron job — check running A/B tests for significance (every 6h) */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const serviceClient = createServiceClient();

    // Running tests are managed by their own WDK workflows (ab-test-lifecycle)
    // This cron just cleans up stale tests that exceeded max duration without workflow
    const { data: staleTests } = await serviceClient
      .from("mkt_ab_tests")
      .select("id, started_at, max_duration_days")
      .eq("status", "running")
      .is("workflow_run_id", null);

    let cleaned = 0;
    for (const test of staleTests ?? []) {
      if (!test.started_at) continue;
      const elapsed = (Date.now() - new Date(test.started_at).getTime()) / (1000 * 60 * 60 * 24);
      if (elapsed > (test.max_duration_days ?? 14)) {
        await serviceClient.from("mkt_ab_tests").update({ status: "cancelled" }).eq("id", test.id);
        cleaned++;
      }
    }

    return NextResponse.json({ ok: true, cleaned });
  } catch (e) {
    console.error("[Cron:ab-test-check] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
