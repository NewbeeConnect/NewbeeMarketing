import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncAllActiveDeployments } from "@/lib/ads/performance-syncer";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify Vercel cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Sync all active deployments across all users
    const results = await syncAllActiveDeployments(serviceClient);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[CronSync] Completed: ${successful} synced, ${failed} failed, ${results.length} total`
    );

    return NextResponse.json({
      success: failed === 0,
      total: results.length,
      successful,
      failed,
      synced_at: new Date().toISOString(),
      ...(failed > 0 && {
        errors: results
          .filter((r) => !r.success)
          .map((r) => ({
            deployment_id: r.deployment_id,
            error: r.error,
          })),
      }),
    });
  } catch (error) {
    console.error("[CronSync] Fatal error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Cron sync failed",
      },
      { status: 500 }
    );
  }
}
