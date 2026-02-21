/**
 * Meta (Facebook / Instagram) Ads Platform Service
 *
 * Stub implementation that returns realistic simulated data.
 * When real MetaAdsKeys are provided, it logs that a real API call
 * would be made but still returns stub data for now.
 */

import type {
  AdCampaignConfig,
  AdPublishResult,
  AdPerformanceMetrics,
  MetaAdsKeys,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasRealKeys(keys?: MetaAdsKeys): boolean {
  if (!keys) return false;
  return !!(keys.app_id && keys.app_secret && keys.access_token);
}

function generateStubId(prefix: string): string {
  const rand = Math.floor(Math.random() * 1_000_000_000);
  return `${prefix}_${rand}`;
}

// ─── Create Campaign ─────────────────────────────────────────────────────────

export async function createMetaAdsCampaign(
  config: AdCampaignConfig,
  keys?: MetaAdsKeys
): Promise<AdPublishResult> {
  if (hasRealKeys(keys)) {
    console.log(
      `[MetaAds] Real API keys detected for campaign "${config.campaign_name}". ` +
        "Real Meta Marketing API would be called here. Using stub for now."
    );
  } else {
    console.log(
      `[MetaAds] No API keys provided. Returning simulated response for "${config.campaign_name}".`
    );
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 450));

  return {
    success: true,
    platform: "meta",
    external_campaign_id: generateStubId("meta_camp"),
    external_ad_id: generateStubId("meta_ad"),
    status: "pending_review",
    message: `Meta Ads campaign "${config.campaign_name}" created successfully (stub). Review typically takes up to 24 hours.`,
  };
}

// ─── Pause Campaign ──────────────────────────────────────────────────────────

export async function pauseMetaAdsCampaign(
  externalCampaignId: string,
  keys?: MetaAdsKeys
): Promise<AdPublishResult> {
  if (hasRealKeys(keys)) {
    console.log(
      `[MetaAds] Real API keys detected. Would pause campaign ${externalCampaignId}. Using stub.`
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 250));

  return {
    success: true,
    platform: "meta",
    external_campaign_id: externalCampaignId,
    external_ad_id: null,
    status: "paused",
    message: `Meta Ads campaign ${externalCampaignId} paused successfully (stub).`,
  };
}

// ─── Get Metrics ─────────────────────────────────────────────────────────────

export async function getMetaAdsMetrics(
  externalCampaignId: string,
  dateFrom: string,
  dateTo: string,
  keys?: MetaAdsKeys
): Promise<AdPerformanceMetrics[]> {
  if (hasRealKeys(keys)) {
    console.log(
      `[MetaAds] Real API keys detected. Would fetch insights for ${externalCampaignId}. Using stub.`
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 350));

  // Generate realistic stub metrics for each day in the range
  // Meta generally has higher impressions / lower CPC than Google
  const metrics: AdPerformanceMetrics[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const impressions = Math.floor(1200 + Math.random() * 6000);
    const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.035));
    const ctr = clicks / impressions;
    const conversions = Math.floor(clicks * (0.015 + Math.random() * 0.06));
    const conversionRate = clicks > 0 ? conversions / clicks : 0;
    const spend = +(4 + Math.random() * 20).toFixed(2);

    metrics.push({
      impressions,
      clicks,
      ctr: +ctr.toFixed(4),
      conversions,
      conversion_rate: +conversionRate.toFixed(4),
      spend_usd: spend,
      date: d.toISOString().split("T")[0],
    });
  }

  return metrics;
}
