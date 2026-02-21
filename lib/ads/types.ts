/**
 * Ad Distribution Service - Type Definitions
 *
 * Re-exports shared types from the database schema and defines
 * additional types specific to the ad platform integration layer.
 */

// Re-export shared types already defined in database schema
export type {
  AdPlatform,
  AdDeploymentStatus,
  AdTargeting,
  AdDeployment,
} from "@/types/database";

import type { AdPlatform, AdTargeting } from "@/types/database";

// ─── Ad Status (superset used in publish results) ────────────────────────────
export type AdStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "completed"
  | "rejected";

// ─── Campaign Configuration ──────────────────────────────────────────────────
export interface AdCampaignConfig {
  platform: AdPlatform;
  campaign_name: string;
  budget_daily_usd: number;
  budget_total_usd: number;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  targeting: AdTargeting;
  creative_urls: string[];
  project_id: string;
}

// ─── Publish Result ──────────────────────────────────────────────────────────
export interface AdPublishResult {
  success: boolean;
  platform: AdPlatform;
  external_campaign_id: string | null;
  external_ad_id: string | null;
  status: AdStatus;
  message: string;
}

// ─── Performance Metrics ─────────────────────────────────────────────────────
export interface AdPerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
  spend_usd: number;
  date: string; // ISO 8601
}

// ─── Platform API Keys ───────────────────────────────────────────────────────
export interface GoogleAdsKeys {
  client_id: string;
  client_secret: string;
  developer_token: string;
  refresh_token: string;
}

export interface MetaAdsKeys {
  app_id: string;
  app_secret: string;
  access_token: string;
}

export type PlatformKeys = GoogleAdsKeys | MetaAdsKeys;

// ─── API Request / Response shapes ──────────────────────────────────────────
export interface PublishAdRequest {
  platform: AdPlatform;
  campaign_name: string;
  budget_daily_usd: number;
  budget_total_usd: number;
  start_date: string;
  end_date: string;
  targeting: AdTargeting;
  creative_urls: string[];
  project_id: string;
  campaign_id?: string;
}

export interface AdDeploymentRow {
  id: string;
  user_id: string;
  campaign_id: string | null;
  project_id: string;
  platform: AdPlatform;
  external_campaign_id: string | null;
  external_ad_id: string | null;
  creative_urls: string[];
  budget_daily_usd: number | null;
  budget_total_usd: number | null;
  targeting: AdTargeting | null;
  status: AdStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
