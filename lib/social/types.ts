/**
 * Social Media Automation — Type Definitions
 *
 * Shared types for the social publishing, approval workflow,
 * A/B testing, trend detection, and autopilot modules.
 */

// ─── Platform Types ─────────────────────────────────────────────────────────

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "facebook";

export type ContentFormat =
  | "reel"           // Instagram Reels, Facebook Reels
  | "story"          // Instagram Stories
  | "feed_post"      // Instagram/Facebook/LinkedIn/Twitter feed
  | "carousel"       // Instagram/Facebook carousel
  | "short"          // YouTube Shorts
  | "video"          // YouTube long-form, LinkedIn/Twitter video
  | "thread";        // Twitter thread

export type ContentQueueStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "rejected"
  | "revision_requested";

export type ContentSource =
  | "manual"
  | "autopilot"
  | "trend"
  | "ab_test";

export type ABTestStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type AllocationStrategy =
  | "equal"
  | "thompson_sampling"
  | "epsilon_greedy";

export type ABSuccessMetric =
  | "engagement_rate"
  | "clicks"
  | "impressions"
  | "conversions"
  | "ctr";

export type ABVariantStrategyType =
  | "emotional"
  | "technical"
  | "hybrid"
  | "trending";

export type TrendType =
  | "hashtag"
  | "topic"
  | "sound"
  | "challenge"
  | "keyword";

export type AutopilotFrequency =
  | "daily"
  | "weekly"
  | "biweekly";

export type AutopilotRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// ─── Platform Constraints ───────────────────────────────────────────────────

export interface PlatformConstraints {
  maxCaptionLength: number;
  maxHashtags: number | null;
  supportedMediaTypes: ("video" | "image" | "carousel")[];
  supportedAspectRatios: string[];
  maxVideoDurationSeconds: number;
  supportsScheduling: boolean;
}

export const PLATFORM_CONSTRAINTS: Record<SocialPlatform, PlatformConstraints> = {
  instagram: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportedMediaTypes: ["video", "image", "carousel"],
    supportedAspectRatios: ["9:16", "1:1", "4:5"],
    maxVideoDurationSeconds: 90,
    supportsScheduling: false,
  },
  tiktok: {
    maxCaptionLength: 2200,
    maxHashtags: null,
    supportedMediaTypes: ["video"],
    supportedAspectRatios: ["9:16"],
    maxVideoDurationSeconds: 600,
    supportsScheduling: false,
  },
  youtube: {
    maxCaptionLength: 5000,
    maxHashtags: null,
    supportedMediaTypes: ["video"],
    supportedAspectRatios: ["16:9", "9:16"],
    maxVideoDurationSeconds: 43200, // 12 hours
    supportsScheduling: true,
  },
  twitter: {
    maxCaptionLength: 280,
    maxHashtags: null,
    supportedMediaTypes: ["video", "image"],
    supportedAspectRatios: ["16:9", "1:1", "9:16"],
    maxVideoDurationSeconds: 140,
    supportsScheduling: false,
  },
  linkedin: {
    maxCaptionLength: 3000,
    maxHashtags: null,
    supportedMediaTypes: ["video", "image"],
    supportedAspectRatios: ["16:9", "1:1"],
    maxVideoDurationSeconds: 600,
    supportsScheduling: false,
  },
  facebook: {
    maxCaptionLength: 63206,
    maxHashtags: null,
    supportedMediaTypes: ["video", "image", "carousel"],
    supportedAspectRatios: ["16:9", "1:1", "9:16"],
    maxVideoDurationSeconds: 14400, // 4 hours
    supportsScheduling: true,
  },
};

// ─── OAuth Types ────────────────────────────────────────────────────────────

export interface SocialOAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  /** Platform-specific extra fields */
  [key: string]: string | number | undefined;
}

export interface InstagramOAuthTokens extends SocialOAuthTokens {
  /** Facebook User ID */
  user_id: string;
  /** Instagram Business Account ID */
  instagram_account_id: string;
  /** Facebook Page ID linked to Instagram */
  page_id: string;
}

export interface TikTokOAuthTokens extends SocialOAuthTokens {
  open_id: string;
}

export interface YouTubeOAuthTokens extends SocialOAuthTokens {
  channel_id: string;
}

export interface TwitterOAuthTokens extends SocialOAuthTokens {
  twitter_user_id: string;
}

export interface LinkedInOAuthTokens extends SocialOAuthTokens {
  linkedin_person_id?: string;
  linkedin_org_id?: string;
}

// ─── Content Types ──────────────────────────────────────────────────────────

export interface SocialContentInput {
  text: string;
  mediaUrls: string[];
  mediaType: "video" | "image" | "carousel";
  hashtags: string[];
  platform: SocialPlatform;
  format: ContentFormat;
  scheduledAt?: string;
  aspectRatio?: string;
  duration?: number;
  /** Platform-specific overrides (e.g., YouTube title, TikTok privacy) */
  platformConfig?: Record<string, unknown>;
}

export interface PlatformFormattedContent {
  platform: SocialPlatform;
  text: string;
  hashtags: string[];
  mediaUrls: string[];
  mediaType: "video" | "image" | "carousel";
  format: ContentFormat;
  metadata: Record<string, unknown>;
}

// ─── Media Upload Types ─────────────────────────────────────────────────────

export interface MediaUploadInput {
  platform: SocialPlatform;
  mediaUrl: string;
  mediaType: "video" | "image";
  mimeType?: string;
}

export interface MediaUploadResult {
  success: boolean;
  platformMediaId?: string;
  uploadUrl?: string;
  error?: string;
}

// ─── Publish Types ──────────────────────────────────────────────────────────

export interface SocialPublishResult {
  success: boolean;
  platform: SocialPlatform;
  externalPostId: string | null;
  postUrl: string | null;
  status: "published" | "pending" | "failed";
  message: string;
}

// ─── Metrics Types ──────────────────────────────────────────────────────────

export interface SocialPostMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
  videoViews: number;
  watchTimeSeconds: number;
  completionRate: number;
  followersGained: number;
}

// ─── Platform Adapter Interface ─────────────────────────────────────────────

export interface SocialPlatformAdapter {
  platform: SocialPlatform;

  /** Validate that stored OAuth tokens are still active */
  validateCredentials(tokens: SocialOAuthTokens): Promise<boolean>;

  /** Format content for this platform's requirements */
  formatContent(content: SocialContentInput): Promise<PlatformFormattedContent>;

  /** Upload media to the platform (returns platform-specific media ID) */
  uploadMedia(media: MediaUploadInput, tokens: SocialOAuthTokens): Promise<MediaUploadResult>;

  /** Publish a formatted post */
  publish(post: PlatformFormattedContent, tokens: SocialOAuthTokens): Promise<SocialPublishResult>;

  /** Fetch post metrics from the platform */
  getPostMetrics(postId: string, tokens: SocialOAuthTokens): Promise<SocialPostMetrics>;

  /** Refresh expired OAuth tokens */
  refreshToken(tokens: SocialOAuthTokens): Promise<SocialOAuthTokens>;
}

// ─── A/B Test Types ─────────────────────────────────────────────────────────

export interface VariantStats {
  variantLabel: string;
  impressions: number;
  successes: number; // clicks, engagements, conversions — depends on metric
  failures: number;  // impressions - successes
  rate: number;      // successes / impressions
}

export interface SignificanceResult {
  significant: boolean;
  winner: string | null;
  pValue: number;
  confidenceLevel: number;
}

export interface ThompsonAllocation {
  /** Map of variant label → allocation percentage (0-1) */
  allocations: Record<string, number>;
}

// ─── Trend Types ────────────────────────────────────────────────────────────

export interface TrendData {
  id: string;
  platform: SocialPlatform;
  trendType: TrendType;
  name: string;
  description?: string;
  volume?: number;
  growthRate?: number;
  viralityScore: number;
  brandRelevanceScore: number;
  compositeScore: number;
}

export interface TrendScoringInput {
  trendName: string;
  trendDescription?: string;
  brandName: string;
  brandDescription?: string;
  targetAudience?: string;
}

// ─── Autopilot Types ────────────────────────────────────────────────────────

export interface AutopilotAnalysis {
  topPerformingFormats: { format: ContentFormat; avgEngagement: number }[];
  bestPostingTimes: { platform: SocialPlatform; hours: number[] }[];
  topHashtags: { tag: string; avgReach: number }[];
  contentGaps: string[];
  recommendations: string[];
}

export interface AutopilotSuggestion {
  platform: SocialPlatform;
  format: ContentFormat;
  textContent: string;
  hashtags: string[];
  mediaPrompt: string;
  mediaType: "video" | "image";
  scheduledAt?: string;
  trendId?: string;
  promptTemplateId?: string;
  estimatedCostUsd: number;
}

// ─── Approval Workflow Types ────────────────────────────────────────────────

export type ApprovalDecision = "approved" | "rejected" | "revision";

export interface ApprovalPayload {
  decision: ApprovalDecision;
  notes?: string;
  publishPlatforms?: SocialPlatform[];
}

export interface ContentApprovalEvent {
  type: "awaiting_approval" | "publishing" | "published" | "rejected" | "revision" | "error";
  contentId: string;
  hookToken?: string;
  platforms?: SocialPlatform[];
  message?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return a zeroed-out SocialPostMetrics object. Used as fallback in adapter catch blocks. */
export function emptyMetrics(): SocialPostMetrics {
  return {
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    clicks: 0,
    engagementRate: 0,
    videoViews: 0,
    watchTimeSeconds: 0,
    completionRate: 0,
    followersGained: 0,
  };
}
