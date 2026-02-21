/**
 * Unified Ad Publisher
 *
 * Dispatches campaign creation to the correct platform service
 * based on the config.platform value.
 */

import type {
  AdCampaignConfig,
  AdPublishResult,
  GoogleAdsKeys,
  MetaAdsKeys,
  PlatformKeys,
} from "./types";
import { createGoogleAdsCampaign } from "./google-ads";
import { createMetaAdsCampaign } from "./meta-ads";

/**
 * Publish an ad campaign to the specified platform.
 *
 * @param config - The campaign configuration including platform, budget, targeting, etc.
 * @param userKeys - Optional platform-specific API keys. When provided the
 *                   platform service will log that real API calls would be made
 *                   (stub responses are returned regardless for now).
 * @returns AdPublishResult with external IDs and status.
 */
export async function publishToAds(
  config: AdCampaignConfig,
  userKeys?: PlatformKeys | null
): Promise<AdPublishResult> {
  switch (config.platform) {
    case "google":
      return createGoogleAdsCampaign(
        config,
        userKeys as GoogleAdsKeys | undefined
      );

    case "meta":
      return createMetaAdsCampaign(
        config,
        userKeys as MetaAdsKeys | undefined
      );

    default: {
      const exhaustiveCheck: never = config.platform;
      return {
        success: false,
        platform: exhaustiveCheck,
        external_campaign_id: null,
        external_ad_id: null,
        status: "rejected",
        message: `Unsupported ad platform: ${exhaustiveCheck}`,
      };
    }
  }
}
