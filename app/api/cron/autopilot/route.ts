import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { start } from "workflow/api";
import { autopilotDailyRun } from "@/workflows/autopilot-agent";
import { verifyCronAuth } from "@/lib/cron-auth";

/** GET: Cron job — trigger autopilot for all enabled users (daily 09:00 UTC) */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const serviceClient = createServiceClient();
    const { data: configs } = await serviceClient
      .from("mkt_autopilot_config")
      .select("user_id")
      .eq("is_enabled", true);

    if (!configs || configs.length === 0) {
      return NextResponse.json({ ok: true, triggered: 0 });
    }

    const results: { userId: string; runId: string }[] = [];
    for (const config of configs) {
      const run = await start(autopilotDailyRun, [config.user_id]);
      results.push({ userId: config.user_id, runId: run.runId });
    }

    return NextResponse.json({ ok: true, triggered: results.length, results });
  } catch (e) {
    console.error("[Cron:autopilot] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
