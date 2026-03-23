/**
 * TikTok Platform Adapter
 *
 * Uses TikTok Content Posting API for video publishing.
 * Requires TikTok Developer app approval (5-10 business days).
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
  TikTokOAuthTokens,
} from "./types";
import { emptyMetrics } from "./types";
import { formatContentForPlatform } from "./content-formatter";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

async function tiktokFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${TIKTOK_API_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`TikTok API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const tiktokAdapter: SocialPlatformAdapter = {
  platform: "tiktok",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await tiktokFetch<{ data: { user: { open_id: string } } }>(
        "/user/info/?fields=open_id,display_name", tokens.access_token
      );
      return !!data.data.user.open_id;
    } catch { return false; }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(_media: MediaUploadInput, _tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    // TikTok uses a different flow: init upload → upload chunks → publish
    // The publish step handles media upload internally
    return { success: true, platformMediaId: "tiktok-direct-post" };
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    try {
      const description = (post.metadata.description as string) ?? post.text + " " + post.hashtags.join(" ");

      // Step 1: Init video upload (pull from URL)
      const initResult = await tiktokFetch<{
        data: { publish_id: string };
        error: { code: string; message: string };
      }>(
        "/post/publish/video/init/",
        tokens.access_token,
        {
          method: "POST",
          body: JSON.stringify({
            post_info: {
              title: description.slice(0, 150),
              description: description,
              privacy_level: "PUBLIC_TO_EVERYONE",
              disable_duet: false,
              disable_stitch: false,
              disable_comment: false,
              video_cover_timestamp_ms: 1000,
            },
            source_info: {
              source: "PULL_FROM_URL",
              video_url: post.mediaUrls[0],
            },
          }),
        }
      );

      if (initResult.error?.code && initResult.error.code !== "ok") {
        throw new Error(`TikTok init error: ${initResult.error.message}`);
      }

      return {
        success: true,
        platform: "tiktok",
        externalPostId: initResult.data.publish_id,
        postUrl: null, // TikTok doesn't return post URL immediately
        status: "pending", // TikTok processes async
        message: "Video submitted to TikTok for processing",
      };
    } catch (e) {
      return {
        success: false, platform: "tiktok", externalPostId: null,
        postUrl: null, status: "failed", message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    try {
      const data = await tiktokFetch<{
        data: { videos: Array<{
          like_count: number; comment_count: number; share_count: number;
          view_count: number; id: string;
        }> };
      }>(
        `/video/query/?fields=like_count,comment_count,share_count,view_count`,
        tokens.access_token,
        { method: "POST", body: JSON.stringify({ filters: { video_ids: [postId] } }) }
      );

      const video = data.data.videos[0];
      if (!video) return emptyMetrics();

      const engagement = video.like_count + video.comment_count + video.share_count;
      return {
        impressions: video.view_count,
        reach: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        shares: video.share_count,
        saves: 0,
        clicks: 0,
        engagementRate: video.view_count > 0 ? engagement / video.view_count : 0,
        videoViews: video.view_count,
        watchTimeSeconds: 0,
        completionRate: 0,
        followersGained: 0,
      };
    } catch {
      return emptyMetrics();
    }
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const ttTokens = tokens as TikTokOAuthTokens;
    const res = await fetch(`${TIKTOK_API_BASE}/../v2/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: ttTokens.refresh_token!,
      }),
    });
    if (!res.ok) throw new Error(`TikTok refresh failed: ${res.status}`);
    const data = await res.json();
    return { ...tokens, ...data };
  },
};

