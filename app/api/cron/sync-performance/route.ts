import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { syncAllActiveDeployments } from "@/lib/ads/performance-syncer";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const serviceClient = createServiceClient();

    const results = await syncAllActiveDeployments(serviceClient);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

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
