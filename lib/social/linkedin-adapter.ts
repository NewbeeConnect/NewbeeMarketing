/**
 * LinkedIn Platform Adapter
 *
 * Uses LinkedIn Marketing API (Community Management) for company page posts.
 * OAuth 2.0 with w_member_social scope required.
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
  LinkedInOAuthTokens,
} from "./types";
import { emptyMetrics } from "./types";
import { formatContentForPlatform } from "./content-formatter";

const LI_API_BASE = "https://api.linkedin.com/rest";

async function liFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${LI_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202402",
      "X-Restli-Protocol-Version": "2.0.0",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`LinkedIn API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const linkedinAdapter: SocialPlatformAdapter = {
  platform: "linkedin",

  async validateCredentials(tokens: SocialOAuthTokens): Promise<boolean> {
    try {
      const data = await liFetch<{ sub: string }>("/userinfo", tokens.access_token);
      return !!data.sub;
    } catch { return false; }
  },

  async formatContent(content: SocialContentInput): Promise<PlatformFormattedContent> {
    return formatContentForPlatform(content);
  },

  async uploadMedia(media: MediaUploadInput, tokens: SocialOAuthTokens): Promise<MediaUploadResult> {
    const liTokens = tokens as LinkedInOAuthTokens;
    const author = liTokens.linkedin_org_id
      ? `urn:li:organization:${liTokens.linkedin_org_id}`
      : `urn:li:person:${liTokens.linkedin_person_id}`;

    try {
      if (media.mediaType === "video") {
        // Step 1: Register upload
        const reg = await liFetch<{
          value: { uploadMechanism: { "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": { uploadUrl: string } }; asset: string };
        }>("/assets?action=registerUpload", tokens.access_token, {
          method: "POST",
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
              owner: author,
              serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
            },
          }),
        });

        const uploadUrl = reg.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const asset = reg.value.asset;

        // Step 2: Upload binary
        const videoRes = await fetch(media.mediaUrl);
        const videoBuffer = await videoRes.arrayBuffer();
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${tokens.access_token}` },
          body: videoBuffer,
        });

        return { success: true, platformMediaId: asset };
      }

      // Image upload
      const reg = await liFetch<{
        value: { uploadMechanism: { "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": { uploadUrl: string } }; asset: string };
      }>("/assets?action=registerUpload", tokens.access_token, {
        method: "POST",
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: author,
            serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
          },
        }),
      });

      const uploadUrl = reg.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      const imgRes = await fetch(media.mediaUrl);
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${tokens.access_token}` },
        body: await imgRes.arrayBuffer(),
      });

      return { success: true, platformMediaId: reg.value.asset };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  async publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult> {
    const liTokens = tokens as LinkedInOAuthTokens;
    const author = liTokens.linkedin_org_id
      ? `urn:li:organization:${liTokens.linkedin_org_id}`
      : `urn:li:person:${liTokens.linkedin_person_id}`;

    try {
      const text = (post.metadata.text as string) ?? post.text + "\n\n" + post.hashtags.join(" ");

      // Upload media if present
      let mediaAsset: string | null = null;
      if (post.mediaUrls.length > 0) {
        const upload = await linkedinAdapter.uploadMedia(
          { platform: "linkedin", mediaUrl: post.mediaUrls[0], mediaType: post.mediaType === "carousel" ? "image" : post.mediaType },
          tokens
        );
        if (upload.success) mediaAsset = upload.platformMediaId ?? null;
      }

      const postBody: Record<string, unknown> = {
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: mediaAsset ? (post.mediaType === "video" ? "VIDEO" : "IMAGE") : "NONE",
            ...(mediaAsset && {
              media: [{
                status: "READY",
                media: mediaAsset,
              }],
            }),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };

      const result = await liFetch<{ id: string }>("/ugcPosts", tokens.access_token, {
        method: "POST",
        body: JSON.stringify(postBody),
      });

      return {
        success: true, platform: "linkedin", externalPostId: result.id,
        postUrl: `https://www.linkedin.com/feed/update/${result.id}/`,
        status: "published", message: "Published to LinkedIn successfully",
      };
    } catch (e) {
      return {
        success: false, platform: "linkedin", externalPostId: null,
        postUrl: null, status: "failed", message: (e as Error).message,
      };
    }
  },

  async getPostMetrics(_postId: string, _tokens: SocialOAuthTokens): Promise<SocialPostMetrics> {
    // LinkedIn analytics require separate API approval
    return emptyMetrics();
  },

  async refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens> {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    if (!res.ok) throw new Error(`LinkedIn refresh failed: ${res.status}`);
    return { ...tokens, ...(await res.json()) };
  },
};
