import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncAllSocialMetrics } from "@/lib/social/metrics-syncer";
import { verifyCronAuth } from "@/lib/cron-auth";

/** GET: Cron job — sync social metrics for all published content (every 4 hours) */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const serviceClient = createServiceClient();
    const result = await syncAllSocialMetrics(serviceClient);

    return NextResponse.json({
      ok: true,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors.slice(0, 10), // Limit error details
    });
  } catch (e) {
    console.error("[Cron:social-metrics-sync] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
