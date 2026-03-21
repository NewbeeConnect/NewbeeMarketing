/**
 * Performance Syncer
 *
 * Pulls real metrics from Meta (and Google stub) APIs,
 * upserts into mkt_campaign_performance, and updates campaign spend.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserAdKeys } from "./key-store";
import { getMetaAdsMetrics } from "./meta-ads";
import { getGoogleAdsMetrics } from "./google-ads";
import type {
  MetaAdsKeys,
  GoogleAdsKeys,
  AdDeploymentRow,
} from "./types";

export interface SyncResult {
  deployment_id: string;
  platform: string;
  success: boolean;
  records_synced: number;
  error?: string;
}

/**
 * Sync performance data for a single deployment.
 */
export async function syncDeploymentPerformance(
  serviceClient: SupabaseClient,
  deployment: AdDeploymentRow,
  userId: string,
  dateFrom: string,
  dateTo: string
): Promise<SyncResult> {
  const result: SyncResult = {
    deployment_id: deployment.id,
    platform: deployment.platform,
    success: false,
    records_synced: 0,
  };

  if (!deployment.external_campaign_id) {
    result.error = "No external campaign ID — cannot sync";
    return result;
  }

  try {
    // Fetch platform keys
    const platformSlug =
      deployment.platform === "google" ? "google_ads" : "meta_ads";
    const keys = await getUserAdKeys(serviceClient, userId, platformSlug);

    // Pull metrics from the appropriate platform
    const metrics =
      deployment.platform === "meta"
        ? await getMetaAdsMetrics(
            deployment.external_campaign_id,
            dateFrom,
            dateTo,
            keys as MetaAdsKeys | undefined
          )
        : await getGoogleAdsMetrics(
            deployment.external_campaign_id,
            dateFrom,
            dateTo,
            keys as GoogleAdsKeys | undefined
          );

    if (metrics.length === 0) {
      result.success = true;
      return result;
    }

    // Upsert into mkt_campaign_performance
    const rows = metrics.map((m) => ({
      user_id: userId,
      campaign_id: deployment.campaign_id,
      deployment_id: deployment.id,
      project_id: deployment.project_id,
      platform: deployment.platform,
      date: m.date,
      impressions: m.impressions,
      clicks: m.clicks,
      ctr: m.ctr,
      conversions: m.conversions,
      conversion_rate: m.conversion_rate,
      spend_usd: m.spend_usd,
    }));

    const { error: upsertError } = await serviceClient
      .from("mkt_campaign_performance")
      .upsert(rows, {
        onConflict: "deployment_id,platform,date",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      result.error = `Upsert failed: ${upsertError.message}`;
      return result;
    }

    result.records_synced = rows.length;
    result.success = true;

    // Update campaign total spend
    if (deployment.campaign_id) {
      const { data: spendData } = await serviceClient
        .from("mkt_campaign_performance")
        .select("spend_usd")
        .eq("campaign_id", deployment.campaign_id);

      if (spendData) {
        const totalSpend = spendData.reduce(
          (sum, row) => sum + (row.spend_usd || 0),
          0
        );

        await serviceClient
          .from("mkt_campaigns")
          .update({ current_spend_usd: totalSpend })
          .eq("id", deployment.campaign_id);
      }
    }

    return result;
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Sync all active deployments for a user (or all users if no userId).
 */
export async function syncAllActiveDeployments(
  serviceClient: SupabaseClient,
  userId?: string
): Promise<SyncResult[]> {
  // Fetch active deployments
  let query = serviceClient
    .from("mkt_ad_deployments")
    .select("*")
    .in("status", ["active", "pending_review"])
    .not("external_campaign_id", "is", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: deployments, error } = await query;

  if (error || !deployments?.length) {
    return [];
  }

  // Calculate date range: last 7 days
  const dateTo = new Date().toISOString().split("T")[0];
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const results: SyncResult[] = [];

  for (const deployment of deployments) {
    const result = await syncDeploymentPerformance(
      serviceClient,
      deployment as AdDeploymentRow,
      deployment.user_id,
      dateFrom,
      dateTo
    );
    results.push(result);
  }

  return results;
}
