/**
 * Facebook Platform Adapter
 *
 * Uses Meta Graph API v22.0 for Facebook Page content publishing.
 * Shares OAuth infrastructure with Instagram (same Meta app).
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
} from "./types";
import { emptyMetrics } from "./types";
import { formatContentForPlatform } from "./content-formatter";
import { metaFetch, refreshMetaToken } from "./meta-fetch";

export const facebookAdapter: SocialPlatformAdapter = {
  platform: "facebook",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await metaFetch<{ id: string }>("/me", tokens.access_token, "Facebook");
      return !!data.id;
    } catch { return false; }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(media: MediaUploadInput, tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    const pageId = (tokens as Record<string, string>).page_id;
    try {
      if (media.mediaType === "video") {
        const result = await metaFetch<{ id: string }>(
          `/${pageId}/videos`,
          tokens.access_token,
          "Facebook",
          { method: "POST", body: JSON.stringify({ file_url: media.mediaUrl, published: false }) }
        );
        return { success: true, platformMediaId: result.id };
      }
      const result = await metaFetch<{ id: string }>(
        `/${pageId}/photos`,
        tokens.access_token,
        "Facebook",
        { method: "POST", body: JSON.stringify({ url: media.mediaUrl, published: false }) }
      );
      return { success: true, platformMediaId: result.id };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    const pageId = (tokens as Record<string, string>).page_id;
    const message = (post.metadata.message as string) ?? post.text + "\n\n" + post.hashtags.join(" ");

    try {
      if (post.mediaType === "video") {
        const result = await metaFetch<{ id: string }>(
          `/${pageId}/videos`,
          tokens.access_token,
          "Facebook",
          { method: "POST", body: JSON.stringify({ file_url: post.mediaUrls[0], description: message }) }
        );
        return {
          success: true, platform: "facebook", externalPostId: result.id,
          postUrl: `https://www.facebook.com/${result.id}`, status: "published",
          message: "Published to Facebook successfully",
        };
      }

      // Photo or text post
      const body: Record<string, unknown> = { message };
      if (post.mediaUrls.length > 0 && post.mediaType === "image") {
        body.url = post.mediaUrls[0];
        const result = await metaFetch<{ id: string; post_id: string }>(
          `/${pageId}/photos`, tokens.access_token, "Facebook",
          { method: "POST", body: JSON.stringify(body) }
        );
        return {
          success: true, platform: "facebook", externalPostId: result.post_id ?? result.id,
          postUrl: `https://www.facebook.com/${result.post_id ?? result.id}`, status: "published",
          message: "Published to Facebook successfully",
        };
      }

      const result = await metaFetch<{ id: string }>(
        `/${pageId}/feed`, tokens.access_token, "Facebook",
        { method: "POST", body: JSON.stringify(body) }
      );
      return {
        success: true, platform: "facebook", externalPostId: result.id,
        postUrl: `https://www.facebook.com/${result.id}`, status: "published",
        message: "Published to Facebook successfully",
      };
    } catch (e) {
      return {
        success: false, platform: "facebook", externalPostId: null,
        postUrl: null, status: "failed", message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    try {
      const insights = await metaFetch<{
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      }>(`/${postId}/insights?metric=post_impressions,post_engaged_users,post_clicks`, tokens.access_token, "Facebook");
      const get = (name: string) => insights.data.find(m => m.name === name)?.values[0]?.value ?? 0;
      const impressions = get("post_impressions");
      return {
        impressions, reach: impressions, likes: 0, comments: 0, shares: 0,
        saves: 0, clicks: get("post_clicks"),
        engagementRate: impressions > 0 ? get("post_engaged_users") / impressions : 0,
        videoViews: 0, watchTimeSeconds: 0, completionRate: 0, followersGained: 0,
      };
    } catch {
      return emptyMetrics();
    }
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const data = await refreshMetaToken(tokens.access_token, "Facebook");
    return { ...tokens, access_token: data.access_token, expires_in: data.expires_in };
  },
};
