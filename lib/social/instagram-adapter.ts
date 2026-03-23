/**
 * Instagram Platform Adapter
 *
 * Uses Meta Graph API v22.0 for Instagram content publishing.
 * Supports: Reels, Stories, Feed Posts, Carousels.
 * Reuses shared Meta API infrastructure from ./meta-fetch.ts.
 */

import type {
  SocialPlatformAdapter,
  SocialContentInput,
  PlatformFormattedContent,
  MediaUploadInput,
  MediaUploadResult,
  SocialPublishResult,
  SocialPostMetrics,
  SocialOAuthTokens,
  InstagramOAuthTokens,
} from "./types";
import { emptyMetrics } from "./types";
import { formatContentForPlatform } from "./content-formatter";
import { metaFetch, refreshMetaToken } from "./meta-fetch";

export const instagramAdapter: SocialPlatformAdapter = {
  platform: "instagram",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await metaFetch<{ id: string }>("/me", tokens.access_token, "Instagram");
      return !!data.id;
    } catch {
      return false;
    }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(media: MediaUploadInput, tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    const igTokens = tokens as InstagramOAuthTokens;
    try {
      if (media.mediaType === "video") {
        const container = await metaFetch<{ id: string }>(
          `/${igTokens.instagram_account_id}/media`,
          tokens.access_token,
          "Instagram",
          {
            method: "POST",
            body: JSON.stringify({
              media_type: "REELS",
              video_url: media.mediaUrl,
            }),
          }
        );
        return { success: true, platformMediaId: container.id };
      }

      const container = await metaFetch<{ id: string }>(
        `/${igTokens.instagram_account_id}/media`,
        tokens.access_token,
        "Instagram",
        {
          method: "POST",
          body: JSON.stringify({
            image_url: media.mediaUrl,
          }),
        }
      );
      return { success: true, platformMediaId: container.id };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    const igTokens = tokens as InstagramOAuthTokens;
    try {
      const isReel = post.format === "reel" || post.mediaType === "video";
      const caption = (post.metadata.caption as string) ?? post.text + "\n\n" + post.hashtags.join(" ");

      const containerBody: Record<string, unknown> = {
        caption,
      };

      if (isReel) {
        containerBody.media_type = "REELS";
        containerBody.video_url = post.mediaUrls[0];
      } else if (post.format === "carousel" && post.mediaUrls.length > 1) {
        const children = await Promise.all(
          post.mediaUrls.map(url =>
            metaFetch<{ id: string }>(
              `/${igTokens.instagram_account_id}/media`,
              tokens.access_token,
              "Instagram",
              {
                method: "POST",
                body: JSON.stringify({ image_url: url, is_carousel_item: true }),
              }
            )
          )
        );
        containerBody.media_type = "CAROUSEL";
        containerBody.children = children.map(c => c.id);
      } else {
        containerBody.image_url = post.mediaUrls[0];
      }

      const container = await metaFetch<{ id: string }>(
        `/${igTokens.instagram_account_id}/media`,
        tokens.access_token,
        "Instagram",
        { method: "POST", body: JSON.stringify(containerBody) }
      );

      if (isReel) {
        await waitForContainer(igTokens.instagram_account_id, container.id, tokens.access_token);
      }

      const result = await metaFetch<{ id: string }>(
        `/${igTokens.instagram_account_id}/media_publish`,
        tokens.access_token,
        "Instagram",
        { method: "POST", body: JSON.stringify({ creation_id: container.id }) }
      );

      return {
        success: true,
        platform: "instagram",
        externalPostId: result.id,
        postUrl: `https://www.instagram.com/p/${result.id}/`,
        status: "published",
        message: "Published to Instagram successfully",
      };
    } catch (e) {
      return {
        success: false,
        platform: "instagram",
        externalPostId: null,
        postUrl: null,
        status: "failed",
        message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    try {
      const insights = await metaFetch<{
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      }>(
        `/${postId}/insights?metric=impressions,reach,likes,comments,shares,saved,video_views`,
        tokens.access_token,
        "Instagram"
      );

      const get = (name: string) =>
        insights.data.find(m => m.name === name)?.values[0]?.value ?? 0;

      const impressions = get("impressions");
      const engagement = get("likes") + get("comments") + get("shares") + get("saved");

      return {
        impressions,
        reach: get("reach"),
        likes: get("likes"),
        comments: get("comments"),
        shares: get("shares"),
        saves: get("saved"),
        clicks: 0,
        engagementRate: impressions > 0 ? engagement / impressions : 0,
        videoViews: get("video_views"),
        watchTimeSeconds: 0,
        completionRate: 0,
        followersGained: 0,
      };
    } catch {
      return emptyMetrics();
    }
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const data = await refreshMetaToken(tokens.access_token, "Instagram");
    return { ...tokens, access_token: data.access_token, expires_in: data.expires_in };
  },
};

async function waitForContainer(igUserId: string, containerId: string, token: string, maxWait = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const status = await metaFetch<{ status_code: string }>(
      `/${containerId}?fields=status_code`,
      token,
      "Instagram"
    );
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") throw new Error("Instagram media processing failed");
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Instagram media processing timed out");
}
