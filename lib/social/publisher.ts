/**
 * Unified Social Publisher
 *
 * Dispatches content publishing to the correct platform adapter.
 * Follows the same pattern as lib/ads/publisher.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  SocialPlatform,
  PlatformFormattedContent,
  SocialPublishResult,
  SocialOAuthTokens,
} from "./types";
import { getAdapter, hasAdapter } from "./adapter-registry";
import { getSocialAccountTokens } from "./oauth-manager";
import { formatContentForAllPlatforms } from "./content-formatter";

// Register all adapters on import
import { instagramAdapter } from "./instagram-adapter";
import { facebookAdapter } from "./facebook-adapter";
import { tiktokAdapter } from "./tiktok-adapter";
import { youtubeAdapter } from "./youtube-adapter";
import { twitterAdapter } from "./twitter-adapter";
import { linkedinAdapter } from "./linkedin-adapter";
import { registerAdapter } from "./adapter-registry";

registerAdapter(instagramAdapter);
registerAdapter(facebookAdapter);
registerAdapter(tiktokAdapter);
registerAdapter(youtubeAdapter);
registerAdapter(twitterAdapter);
registerAdapter(linkedinAdapter);

type ServiceClient = SupabaseClient<Database>;

export interface PublishToSocialRequest {
  text: string;
  mediaUrls: string[];
  mediaType: "video" | "image" | "carousel";
  hashtags: string[];
  platforms: SocialPlatform[];
}

export interface PublishToSocialResult {
  results: SocialPublishResult[];
  successCount: number;
  failureCount: number;
}

/**
 * Publish content to multiple social platforms.
 * Formats content per platform and dispatches to each adapter.
 */
export async function publishToSocial(
  serviceClient: ServiceClient,
  userId: string,
  request: PublishToSocialRequest
): Promise<PublishToSocialResult> {
  const formattedPosts = formatContentForAllPlatforms(
    {
      text: request.text,
      mediaUrls: request.mediaUrls,
      mediaType: request.mediaType,
      hashtags: request.hashtags,
    },
    request.platforms
  );

  const results: SocialPublishResult[] = [];

  for (const post of formattedPosts) {
    // Check adapter exists
    if (!hasAdapter(post.platform)) {
      results.push({
        success: false,
        platform: post.platform,
        externalPostId: null,
        postUrl: null,
        status: "failed",
        message: `No adapter registered for ${post.platform}`,
      });
      continue;
    }

    // Get tokens for this platform
    const tokens = await getSocialAccountTokens(serviceClient, userId, post.platform);
    if (!tokens) {
      results.push({
        success: false,
        platform: post.platform,
        externalPostId: null,
        postUrl: null,
        status: "failed",
        message: `No connected account for ${post.platform}. Connect in Settings → Social Accounts.`,
      });
      continue;
    }

    // Publish via adapter
    const adapter = getAdapter(post.platform);
    try {
      const result = await adapter.publish(post, tokens);
      results.push(result);
    } catch (e) {
      results.push({
        success: false,
        platform: post.platform,
        externalPostId: null,
        postUrl: null,
        status: "failed",
        message: (e as Error).message,
      });
    }
  }

  return {
    results,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
  };
}

/**
 * Publish a single pre-formatted post to a single platform.
 */
export async function publishSinglePost(
  serviceClient: ServiceClient,
  userId: string,
  post: PlatformFormattedContent
): Promise<SocialPublishResult> {
  const tokens = await getSocialAccountTokens(serviceClient, userId, post.platform);
  if (!tokens) {
    return {
      success: false, platform: post.platform, externalPostId: null,
      postUrl: null, status: "failed",
      message: `No connected account for ${post.platform}`,
    };
  }

  const adapter = getAdapter(post.platform);
  return adapter.publish(post, tokens);
}

/**
 * Fetch metrics for a published post on a specific platform.
 */
export async function fetchPostMetrics(
  serviceClient: ServiceClient,
  userId: string,
  platform: SocialPlatform,
  externalPostId: string
) {
  const tokens = await getSocialAccountTokens(serviceClient, userId, platform);
  if (!tokens) return null;

  const adapter = getAdapter(platform);
  return adapter.getPostMetrics(externalPostId, tokens);
}
