/**
 * Meta (Facebook / Instagram) Ads Platform Service
 *
 * Real implementation using Meta Marketing API v22.0.
 * Falls back to stub responses when API keys are not configured.
 */

import type {
  AdCampaignConfig,
  AdPublishResult,
  AdPerformanceMetrics,
  MetaAdsKeys,
  AdObjective,
  InstagramPosition,
  CallToActionType,
} from "./types";
import {
  MetaApiClient,
  type MetaTargetingSpec,
} from "./meta-api-client";

// ─── Extended config for Instagram-specific fields ──────────────────────────

export interface MetaAdCampaignConfig extends AdCampaignConfig {
  objective?: AdObjective;
  instagram_positions?: InstagramPosition[];
  ad_caption?: string;
  call_to_action_type?: CallToActionType;
  call_to_action_link?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hasRealKeys(keys?: MetaAdsKeys): keys is MetaAdsKeys {
  if (!keys) return false;
  return !!(
    keys.app_id &&
    keys.app_secret &&
    keys.access_token &&
    keys.ad_account_id &&
    keys.page_id &&
    keys.instagram_account_id
  );
}

function generateStubId(prefix: string): string {
  const rand = Math.floor(Math.random() * 1_000_000_000);
  return `${prefix}_${rand}`;
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

function mapTargetingToMeta(
  targeting: AdCampaignConfig["targeting"]
): MetaTargetingSpec {
  return {
    age_min: targeting.age_range[0],
    age_max: targeting.age_range[1],
    geo_locations: {
      countries: targeting.locations
        .filter((loc) => loc.length === 2)
        .map((loc) => loc.toUpperCase()),
    },
    interests: targeting.interests.map((interest) => ({
      id: interest, // If ID was resolved via searchInterests, pass directly
      name: interest,
    })),
  };
}

// ─── Create Campaign (Real + Stub) ──────────────────────────────────────────

export async function createMetaAdsCampaign(
  config: AdCampaignConfig | MetaAdCampaignConfig,
  keys?: MetaAdsKeys
): Promise<AdPublishResult> {
  // ── Stub mode ──
  if (!hasRealKeys(keys)) {
    console.log(
      `[MetaAds] No complete API keys. Returning simulated response for "${config.campaign_name}".`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, 350 + Math.random() * 450)
    );
    return {
      success: true,
      platform: "meta",
      external_campaign_id: generateStubId("meta_camp"),
      external_ad_id: generateStubId("meta_ad"),
      external_adset_id: generateStubId("meta_adset"),
      external_creative_id: generateStubId("meta_creative"),
      status: "pending_review",
      message: `Meta Ads campaign "${config.campaign_name}" created successfully (simulation). Connect Meta API keys in Settings for real publishing.`,
    };
  }

  // ── Real API mode ──
  const client = new MetaApiClient(keys.access_token, keys.ad_account_id);
  const extConfig = config as MetaAdCampaignConfig;

  try {
    console.log(
      `[MetaAds] Creating real campaign "${config.campaign_name}" on Meta Marketing API`
    );

    // 1. Create Campaign (starts PAUSED for review)
    const campaign = await client.createCampaign({
      name: config.campaign_name,
      objective: extConfig.objective || "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: [],
    });
    console.log(`[MetaAds] Campaign created: ${campaign.id}`);

    // 2. Upload creatives (detect video vs image)
    let creativeId: string | null = null;
    const firstCreativeUrl = config.creative_urls[0];

    if (isVideoUrl(firstCreativeUrl)) {
      // Video creative
      const video = await client.uploadVideoFromUrl(firstCreativeUrl);
      console.log(`[MetaAds] Video uploaded: ${video.video_id}`);

      const creative = await client.createAdCreative({
        name: `${config.campaign_name} - Video Creative`,
        object_story_spec: {
          page_id: keys.page_id,
          instagram_actor_id: keys.instagram_account_id,
          video_data: {
            video_id: video.video_id,
            message: extConfig.ad_caption || config.campaign_name,
            call_to_action: {
              type: extConfig.call_to_action_type || "LEARN_MORE",
              value: {
                link:
                  extConfig.call_to_action_link ||
                  "https://newbeeapp.com",
              },
            },
          },
        },
      });
      creativeId = creative.id;
    } else {
      // Image creative
      const image = await client.uploadImageFromUrl(firstCreativeUrl);
      console.log(`[MetaAds] Image uploaded: ${image.hash}`);

      const creative = await client.createAdCreative({
        name: `${config.campaign_name} - Image Creative`,
        object_story_spec: {
          page_id: keys.page_id,
          instagram_actor_id: keys.instagram_account_id,
          link_data: {
            image_hash: image.hash,
            message: extConfig.ad_caption || config.campaign_name,
            link:
              extConfig.call_to_action_link || "https://newbeeapp.com",
            call_to_action: {
              type: extConfig.call_to_action_type || "LEARN_MORE",
              value: {
                link:
                  extConfig.call_to_action_link ||
                  "https://newbeeapp.com",
              },
            },
          },
        },
      });
      creativeId = creative.id;
    }
    console.log(`[MetaAds] Creative created: ${creativeId}`);

    // 3. Create Ad Set with targeting
    const positions: ("stream" | "story" | "reels" | "explore")[] =
      extConfig.instagram_positions || ["stream"];

    const adSet = await client.createAdSet({
      campaign_id: campaign.id,
      name: `${config.campaign_name} - Ad Set`,
      daily_budget: Math.round(config.budget_daily_usd * 100), // dollars to cents
      start_time: config.start_date,
      end_time: config.end_date || undefined,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      targeting: mapTargetingToMeta(config.targeting),
      instagram_actor_id: keys.instagram_account_id,
      publisher_platforms: ["instagram"],
      instagram_positions: positions,
    });
    console.log(`[MetaAds] Ad Set created: ${adSet.id}`);

    // 4. Create Ad
    const ad = await client.createAd(
      adSet.id,
      creativeId,
      `${config.campaign_name} - Ad`
    );
    console.log(`[MetaAds] Ad created: ${ad.id}`);

    return {
      success: true,
      platform: "meta",
      external_campaign_id: campaign.id,
      external_ad_id: ad.id,
      external_adset_id: adSet.id,
      external_creative_id: creativeId,
      status: "pending_review",
      message: `Instagram reklam kampanyası "${config.campaign_name}" başarıyla oluşturuldu. Kampanya Meta incelemesinden geçtikten sonra yayına alınacak.`,
    };
  } catch (error) {
    console.error("[MetaAds] Campaign creation failed:", error);
    return {
      success: false,
      platform: "meta",
      external_campaign_id: null,
      external_ad_id: null,
      external_adset_id: null,
      external_creative_id: null,
      status: "rejected",
      message: `Meta Ads kampanya oluşturma hatası: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── Pause Campaign ─────────────────────────────────────────────────────────

export async function pauseMetaAdsCampaign(
  externalCampaignId: string,
  keys?: MetaAdsKeys
): Promise<AdPublishResult> {
  if (!hasRealKeys(keys)) {
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 250)
    );
    return {
      success: true,
      platform: "meta",
      external_campaign_id: externalCampaignId,
      external_ad_id: null,
      external_adset_id: null,
      external_creative_id: null,
      status: "paused",
      message: `Meta Ads campaign ${externalCampaignId} paused (simulation).`,
    };
  }

  const client = new MetaApiClient(keys.access_token, keys.ad_account_id);

  try {
    await client.updateCampaignStatus(externalCampaignId, "PAUSED");
    return {
      success: true,
      platform: "meta",
      external_campaign_id: externalCampaignId,
      external_ad_id: null,
      external_adset_id: null,
      external_creative_id: null,
      status: "paused",
      message: `Instagram kampanyası ${externalCampaignId} duraklatıldı.`,
    };
  } catch (error) {
    return {
      success: false,
      platform: "meta",
      external_campaign_id: externalCampaignId,
      external_ad_id: null,
      external_adset_id: null,
      external_creative_id: null,
      status: "active",
      message: `Kampanya duraklatma hatası: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ─── Get Metrics ────────────────────────────────────────────────────────────

const INSIGHTS_FIELDS = [
  "impressions",
  "clicks",
  "ctr",
  "spend",
  "reach",
  "frequency",
  "actions",
  "cost_per_action_type",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p100_watched_actions",
];

export async function getMetaAdsMetrics(
  externalCampaignId: string,
  dateFrom: string,
  dateTo: string,
  keys?: MetaAdsKeys
): Promise<AdPerformanceMetrics[]> {
  // ── Stub mode ──
  if (!hasRealKeys(keys)) {
    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 350)
    );

    const metrics: AdPerformanceMetrics[] = [];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const impressions = Math.floor(1200 + Math.random() * 6000);
      const clicks = Math.floor(
        impressions * (0.01 + Math.random() * 0.035)
      );
      const ctr = clicks / impressions;
      const conversions = Math.floor(
        clicks * (0.015 + Math.random() * 0.06)
      );
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

  // ── Real API mode ──
  const client = new MetaApiClient(keys.access_token, keys.ad_account_id);

  try {
    const rows = await client.getCampaignInsights(
      externalCampaignId,
      INSIGHTS_FIELDS,
      { since: dateFrom, until: dateTo }
    );

    return rows.map((row) => {
      const conversions =
        row.actions
          ?.filter(
            (a) =>
              a.action_type === "offsite_conversion" ||
              a.action_type === "lead" ||
              a.action_type === "app_install"
          )
          .reduce((sum, a) => sum + parseInt(a.value, 10), 0) || 0;

      const clicks = parseInt(row.clicks, 10) || 0;

      return {
        impressions: parseInt(row.impressions, 10) || 0,
        clicks,
        ctr: parseFloat(row.ctr) || 0,
        conversions,
        conversion_rate: clicks > 0 ? conversions / clicks : 0,
        spend_usd: parseFloat(row.spend) || 0,
        date: row.date_start,
      };
    });
  } catch (error) {
    console.error("[MetaAds] Failed to fetch insights:", error);
    return [];
  }
}
