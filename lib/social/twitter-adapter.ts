/**
 * X/Twitter Platform Adapter
 *
 * Uses X API v2 with OAuth 2.0 PKCE for posting tweets with media.
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

const TWITTER_API_BASE = "https://api.x.com/2";
const TWITTER_UPLOAD_BASE = "https://upload.twitter.com/1.1";

async function xFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${TWITTER_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`X API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const twitterAdapter: SocialPlatformAdapter = {
  platform: "twitter",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await xFetch<{ data: { id: string } }>("/users/me", tokens.access_token);
      return !!data.data.id;
    } catch { return false; }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(media: MediaUploadInput, tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    try {
      if (media.mediaType === "video") {
        // Step 1: INIT
        const initRes = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${tokens.access_token}` },
          body: new URLSearchParams({
            command: "INIT",
            media_type: "video/mp4",
            media_category: "tweet_video",
          }),
        });
        if (!initRes.ok) throw new Error("X media init failed");
        const { media_id_string } = await initRes.json() as { media_id_string: string };

        // Step 2: Download video and APPEND
        const videoRes = await fetch(media.mediaUrl);
        const videoBlob = await videoRes.blob();
        const formData = new FormData();
        formData.append("command", "APPEND");
        formData.append("media_id", media_id_string);
        formData.append("segment_index", "0");
        formData.append("media", videoBlob);

        const appendRes = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${tokens.access_token}` },
          body: formData,
        });
        if (!appendRes.ok) throw new Error("X media append failed");

        // Step 3: FINALIZE
        const finalRes = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${tokens.access_token}` },
          body: new URLSearchParams({ command: "FINALIZE", media_id: media_id_string }),
        });
        if (!finalRes.ok) throw new Error("X media finalize failed");

        return { success: true, platformMediaId: media_id_string };
      }

      // Image upload
      const imgRes = await fetch(media.mediaUrl);
      const imgBlob = await imgRes.blob();
      const formData = new FormData();
      formData.append("media", imgBlob);
      formData.append("media_category", "tweet_image");

      const uploadRes = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tokens.access_token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("X image upload failed");
      const { media_id_string } = await uploadRes.json() as { media_id_string: string };
      return { success: true, platformMediaId: media_id_string };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    try {
      const text = (post.metadata.text as string) ?? post.text;

      // Upload media first if present
      const mediaIds: string[] = [];
      if (post.mediaUrls.length > 0) {
        for (const url of post.mediaUrls.slice(0, post.mediaType === "video" ? 1 : 4)) {
          const upload = await twitterAdapter.uploadMedia(
            { platform: "twitter", mediaUrl: url, mediaType: post.mediaType === "carousel" ? "image" : post.mediaType },
            tokens
          );
          if (upload.success && upload.platformMediaId) {
            mediaIds.push(upload.platformMediaId);
          }
        }
      }

      const tweetBody: Record<string, unknown> = { text };
      if (mediaIds.length > 0) {
        tweetBody.media = { media_ids: mediaIds };
      }

      const result = await xFetch<{ data: { id: string } }>(
        "/tweets", tokens.access_token,
        { method: "POST", body: JSON.stringify(tweetBody) }
      );

      const tweetId = result.data.id;
      const userId = (tokens as Record<string, string>).twitter_user_id ?? "";

      return {
        success: true, platform: "twitter", externalPostId: tweetId,
        postUrl: `https://x.com/${userId}/status/${tweetId}`,
        status: "published", message: "Published to X successfully",
      };
    } catch (e) {
      return {
        success: false, platform: "twitter", externalPostId: null,
        postUrl: null, status: "failed", message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    try {
      const data = await xFetch<{
        data: { public_metrics: {
          like_count: number; reply_count: number; retweet_count: number;
          impression_count: number; quote_count: number;
        } };
      }>(`/tweets/${postId}?tweet.fields=public_metrics`, tokens.access_token);

      const m = data.data.public_metrics;
      const engagement = m.like_count + m.reply_count + m.retweet_count + m.quote_count;
      return {
        impressions: m.impression_count, reach: m.impression_count,
        likes: m.like_count, comments: m.reply_count,
        shares: m.retweet_count + m.quote_count, saves: 0, clicks: 0,
        engagementRate: m.impression_count > 0 ? engagement / m.impression_count : 0,
        videoViews: 0, watchTimeSeconds: 0, completionRate: 0, followersGained: 0,
      };
    } catch { return emptyMetrics(); }
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const res = await fetch(`${TWITTER_API_BASE}/../2/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token!,
      }),
    });
    if (!res.ok) throw new Error(`X refresh failed: ${res.status}`);
    return { ...tokens, ...(await res.json()) };
  },
};

