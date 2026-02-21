/**
 * Google Ads Platform Service
 *
 * Stub implementation that returns realistic simulated data.
 * When real GoogleAdsKeys are provided, it logs that a real API call
 * would be made but still returns stub data for now.
 */

import type {
  AdCampaignConfig,
  AdPublishResult,
  AdPerformanceMetrics,
  GoogleAdsKeys,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasRealKeys(keys?: GoogleAdsKeys): boolean {
  if (!keys) return false;
  return !!(
    keys.client_id &&
    keys.client_secret &&
    keys.developer_token &&
    keys.refresh_token
  );
}

function generateStubId(prefix: string): string {
  const rand = Math.floor(Math.random() * 1_000_000_000);
  return `${prefix}_${rand}`;
}

// ─── Create Campaign ─────────────────────────────────────────────────────────

export async function createGoogleAdsCampaign(
  config: AdCampaignConfig,
  keys?: GoogleAdsKeys
): Promise<AdPublishResult> {
  if (hasRealKeys(keys)) {
    console.log(
      `[GoogleAds] Real API keys detected for campaign "${config.campaign_name}". ` +
        "Real Google Ads API would be called here. Using stub for now."
    );
  } else {
    console.log(
      `[GoogleAds] No API keys provided. Returning simulated response for "${config.campaign_name}".`
    );
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

  return {
    success: true,
    platform: "google",
    external_campaign_id: generateStubId("gads_camp"),
    external_ad_id: generateStubId("gads_ad"),
    status: "pending_review",
    message: `Google Ads campaign "${config.campaign_name}" created successfully (stub). Review typically takes 1-2 business days.`,
  };
}

// ─── Pause Campaign ──────────────────────────────────────────────────────────

export async function pauseGoogleAdsCampaign(
  externalCampaignId: string,
  keys?: GoogleAdsKeys
): Promise<AdPublishResult> {
  if (hasRealKeys(keys)) {
    console.log(
      `[GoogleAds] Real API keys detected. Would pause campaign ${externalCampaignId}. Using stub.`
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 200));

  return {
    success: true,
    platform: "google",
    external_campaign_id: externalCampaignId,
    external_ad_id: null,
    status: "paused",
    message: `Google Ads campaign ${externalCampaignId} paused successfully (stub).`,
  };
}

// ─── Get Metrics ─────────────────────────────────────────────────────────────

export async function getGoogleAdsMetrics(
  externalCampaignId: string,
  dateFrom: string,
  dateTo: string,
  keys?: GoogleAdsKeys
): Promise<AdPerformanceMetrics[]> {
  if (hasRealKeys(keys)) {
    console.log(
      `[GoogleAds] Real API keys detected. Would fetch metrics for ${externalCampaignId}. Using stub.`
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 300));

  // Generate realistic stub metrics for each day in the range
  const metrics: AdPerformanceMetrics[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const impressions = Math.floor(800 + Math.random() * 4200);
    const clicks = Math.floor(impressions * (0.015 + Math.random() * 0.045));
    const ctr = clicks / impressions;
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));
    const conversionRate = clicks > 0 ? conversions / clicks : 0;
    const spend = +(5 + Math.random() * 25).toFixed(2);

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
