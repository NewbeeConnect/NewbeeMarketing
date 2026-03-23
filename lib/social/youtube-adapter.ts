/**
 * YouTube Platform Adapter
 *
 * Uses YouTube Data API v3 for video/Shorts uploading.
 * Google OAuth 2.0 with youtube.upload scope required.
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

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3";

async function ytFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${YOUTUBE_API_BASE}${path}`;
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const youtubeAdapter: SocialPlatformAdapter = {
  platform: "youtube",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await ytFetch<{ items: Array<{ id: string }> }>(
        "/channels?part=id&mine=true", tokens.access_token
      );
      return data.items.length > 0;
    } catch { return false; }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(_media: MediaUploadInput, _tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    // YouTube handles upload as part of publish via resumable upload
    return { success: true, platformMediaId: "youtube-resumable" };
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    try {
      const title = ((post.metadata.title as string) ?? post.text).slice(0, 100);
      const description = (post.metadata.description as string) ?? post.text + "\n\n" + post.hashtags.join(" ");
      const tags = (post.metadata.tags as string[]) ?? post.hashtags.map(h => h.replace("#", ""));
      const isShort = post.format === "short";

      // Step 1: Download video to buffer
      const videoResponse = await fetch(post.mediaUrls[0]);
      if (!videoResponse.ok) throw new Error("Failed to download video for YouTube upload");
      const videoBuffer = await videoResponse.arrayBuffer();

      // Step 2: Resumable upload - init
      const initRes = await fetch(
        `${YOUTUBE_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": String(videoBuffer.byteLength),
          },
          body: JSON.stringify({
            snippet: {
              title: isShort ? `${title} #Shorts` : title,
              description,
              tags,
              categoryId: (post.metadata.categoryId as string) ?? "22",
            },
            status: {
              privacyStatus: (post.metadata.privacyStatus as string) ?? "public",
              selfDeclaredMadeForKids: false,
            },
          }),
        }
      );

      if (!initRes.ok) throw new Error(`YouTube upload init failed: ${initRes.status}`);
      const uploadUrl = initRes.headers.get("Location");
      if (!uploadUrl) throw new Error("YouTube did not return upload URL");

      // Step 3: Upload video data
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: videoBuffer,
      });

      if (!uploadRes.ok) throw new Error(`YouTube upload failed: ${uploadRes.status}`);
      const video = (await uploadRes.json()) as { id: string };

      return {
        success: true,
        platform: "youtube",
        externalPostId: video.id,
        postUrl: isShort
          ? `https://youtube.com/shorts/${video.id}`
          : `https://youtube.com/watch?v=${video.id}`,
        status: "published",
        message: `Published to YouTube ${isShort ? "Shorts" : "Videos"} successfully`,
      };
    } catch (e) {
      return {
        success: false, platform: "youtube", externalPostId: null,
        postUrl: null, status: "failed", message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    try {
      const data = await ytFetch<{
        items: Array<{ statistics: {
          viewCount: string; likeCount: string; commentCount: string;
        } }>;
      }>(`/videos?part=statistics&id=${postId}`, tokens.access_token);

      const stats = data.items[0]?.statistics;
      if (!stats) return emptyMetrics();

      const views = parseInt(stats.viewCount) || 0;
      const likes = parseInt(stats.likeCount) || 0;
      const comments = parseInt(stats.commentCount) || 0;
      return {
        impressions: views, reach: views, likes, comments, shares: 0,
        saves: 0, clicks: 0,
        engagementRate: views > 0 ? (likes + comments) / views : 0,
        videoViews: views, watchTimeSeconds: 0, completionRate: 0, followersGained: 0,
      };
    } catch { return emptyMetrics(); }
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token!,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`YouTube refresh failed: ${res.status}`);
    return { ...tokens, ...(await res.json()) };
  },
};

