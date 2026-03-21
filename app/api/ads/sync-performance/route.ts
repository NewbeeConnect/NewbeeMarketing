import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import {
  syncDeploymentPerformance,
  syncAllActiveDeployments,
} from "@/lib/ads/performance-syncer";
import type { AdDeploymentRow } from "@/lib/ads/types";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { campaign_id, deployment_id } = body;

    const serviceClient = createServiceClient();

    // Single deployment sync
    if (deployment_id) {
      const { data: deployment, error: depError } = await serviceClient
        .from("mkt_ad_deployments")
        .select("*")
        .eq("id", deployment_id)
        .eq("user_id", user.id)
        .single();

      if (depError || !deployment) {
        return NextResponse.json(
          { error: "Deployment not found" },
          { status: 404 }
        );
      }

      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const result = await syncDeploymentPerformance(
        serviceClient,
        deployment as AdDeploymentRow,
        user.id,
        dateFrom,
        dateTo
      );

      return NextResponse.json({
        success: result.success,
        results: [result],
        synced_at: new Date().toISOString(),
      });
    }

    // Campaign-level sync: sync all deployments for this campaign
    if (campaign_id) {
      const { data: campaign, error: campaignError } = await supabase
        .from("mkt_campaigns")
        .select("id")
        .eq("id", campaign_id)
        .eq("user_id", user.id)
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      const { data: deployments } = await serviceClient
        .from("mkt_ad_deployments")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("user_id", user.id)
        .in("status", ["active", "pending_review"])
        .not("external_campaign_id", "is", null);

      if (!deployments?.length) {
        return NextResponse.json({
          success: true,
          results: [],
          message: "No active deployments to sync",
          synced_at: new Date().toISOString(),
        });
      }

      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const results = [];
      for (const dep of deployments) {
        const result = await syncDeploymentPerformance(
          serviceClient,
          dep as AdDeploymentRow,
          user.id,
          dateFrom,
          dateTo
        );
        results.push(result);
      }

      return NextResponse.json({
        success: results.every((r) => r.success),
        results,
        synced_at: new Date().toISOString(),
      });
    }

    // Sync all active deployments for the user
    const results = await syncAllActiveDeployments(serviceClient, user.id);

    return NextResponse.json({
      success: results.every((r) => r.success),
      results,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SyncPerformance] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync performance data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
