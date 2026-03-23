/**
 * Content Formatter
 *
 * Adapts content for each platform's specific requirements:
 * character limits, hashtag handling, media format, aspect ratios.
 */

import type {
  SocialPlatform,
  SocialContentInput,
  PlatformFormattedContent,
  ContentFormat,
} from "./types";
import { PLATFORM_CONSTRAINTS } from "./types";

/**
 * Format content for a specific platform, enforcing platform constraints.
 */
export function formatContentForPlatform(
  content: SocialContentInput
): PlatformFormattedContent {
  const constraints = PLATFORM_CONSTRAINTS[content.platform];

  // Truncate text to platform limit
  let text = content.text;
  const hashtagString = content.hashtags.length > 0
    ? "\n\n" + content.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")
    : "";

  const maxTextLength = constraints.maxCaptionLength - hashtagString.length;
  if (text.length > maxTextLength) {
    text = text.slice(0, maxTextLength - 3) + "...";
  }

  // Enforce hashtag limit
  let hashtags = content.hashtags.map(h => h.startsWith("#") ? h : `#${h}`);
  if (constraints.maxHashtags && hashtags.length > constraints.maxHashtags) {
    hashtags = hashtags.slice(0, constraints.maxHashtags);
  }

  // Build platform-specific metadata
  const metadata: Record<string, unknown> = {};

  switch (content.platform) {
    case "instagram":
      metadata.caption = text + "\n\n" + hashtags.join(" ");
      metadata.mediaType = content.format === "reel" ? "REELS" : content.format === "carousel" ? "CAROUSEL" : "IMAGE";
      break;

    case "tiktok":
      metadata.description = text + " " + hashtags.join(" ");
      metadata.privacyLevel = "PUBLIC_TO_EVERYONE";
      metadata.disableDuet = false;
      metadata.disableStitch = false;
      break;

    case "youtube":
      metadata.title = text.slice(0, 100);
      metadata.description = text + "\n\n" + hashtags.join(" ");
      metadata.tags = hashtags.map(h => h.replace("#", ""));
      metadata.categoryId = "22"; // People & Blogs (default)
      metadata.privacyStatus = "public";
      metadata.isShort = content.format === "short";
      break;

    case "twitter":
      // Twitter: text + hashtags must fit in 280 chars
      const tweetHashtags = hashtags.join(" ");
      const maxTweetText = 280 - tweetHashtags.length - 1;
      metadata.text = (text.length > maxTweetText ? text.slice(0, maxTweetText - 3) + "..." : text)
        + (tweetHashtags ? " " + tweetHashtags : "");
      break;

    case "linkedin":
      metadata.text = text + "\n\n" + hashtags.join(" ");
      metadata.visibility = "PUBLIC";
      break;

    case "facebook":
      metadata.message = text + "\n\n" + hashtags.join(" ");
      break;
  }

  return {
    platform: content.platform,
    text,
    hashtags,
    mediaUrls: content.mediaUrls,
    mediaType: content.mediaType,
    format: content.format,
    metadata,
  };
}

/**
 * Get the best content format for a platform given the media type.
 */
export function getDefaultFormat(
  platform: SocialPlatform,
  mediaType: "video" | "image"
): ContentFormat {
  if (mediaType === "video") {
    switch (platform) {
      case "instagram": return "reel";
      case "tiktok": return "video";
      case "youtube": return "short";
      case "twitter": return "feed_post";
      case "linkedin": return "video";
      case "facebook": return "reel";
    }
  }
  // image
  switch (platform) {
    case "instagram": return "feed_post";
    case "tiktok": return "video"; // TikTok doesn't support image posts natively
    case "youtube": return "video"; // YouTube doesn't support image posts
    case "twitter": return "feed_post";
    case "linkedin": return "feed_post";
    case "facebook": return "feed_post";
  }
}

/**
 * Adapt a single piece of content for multiple platforms.
 */
export function formatContentForAllPlatforms(
  baseContent: Omit<SocialContentInput, "platform" | "format">,
  platforms: SocialPlatform[]
): PlatformFormattedContent[] {
  return platforms.map(platform => {
    const effectiveMediaType = baseContent.mediaType === "carousel" ? "image" as const : baseContent.mediaType;
    const format = getDefaultFormat(platform, effectiveMediaType);
    return formatContentForPlatform({
      ...baseContent,
      platform,
      format,
    });
  });
}
