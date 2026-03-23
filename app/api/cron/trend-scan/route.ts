import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { start } from "workflow/api";
import { trendScanWorkflow } from "@/workflows/trend-scan";
import { verifyCronAuth } from "@/lib/cron-auth";

/** GET: Cron job — scan trends for all users with connected accounts (every 6h) */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const serviceClient = createServiceClient();
    const { data: accounts } = await serviceClient
      .from("mkt_social_accounts")
      .select("user_id")
      .eq("is_active", true);

    const uniqueUserIds = [...new Set((accounts ?? []).map(a => a.user_id))];

    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ ok: true, triggered: 0 });
    }

    const results: { userId: string; runId: string }[] = [];
    for (const userId of uniqueUserIds) {
      const run = await start(trendScanWorkflow, [userId]);
      results.push({ userId, runId: run.runId });
    }

    return NextResponse.json({ ok: true, triggered: results.length });
  } catch (e) {
    console.error("[Cron:trend-scan] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
