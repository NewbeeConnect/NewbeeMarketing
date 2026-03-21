/**
 * Meta Marketing API Client
 *
 * Thin wrapper around Meta Graph API v22.0 for Instagram ad management.
 * Uses raw fetch() — no external SDK dependency.
 */

const META_API_BASE = "https://graph.facebook.com/v22.0";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MetaCampaignParams {
  name: string;
  objective:
    | "OUTCOME_TRAFFIC"
    | "OUTCOME_AWARENESS"
    | "OUTCOME_ENGAGEMENT"
    | "OUTCOME_SALES";
  status: "PAUSED" | "ACTIVE";
  special_ad_categories: string[];
}

export interface MetaAdSetParams {
  campaign_id: string;
  name: string;
  daily_budget: number; // in cents (e.g., $10 = 1000)
  start_time: string; // ISO 8601
  end_time?: string;
  billing_event: "IMPRESSIONS";
  optimization_goal:
    | "REACH"
    | "LINK_CLICKS"
    | "IMPRESSIONS"
    | "THRUPLAY"
    | "ENGAGED_USERS";
  targeting: MetaTargetingSpec;
  instagram_actor_id: string;
  publisher_platforms: ("instagram")[];
  instagram_positions: ("stream" | "story" | "reels" | "explore")[];
}

export interface MetaTargetingSpec {
  age_min: number;
  age_max: number;
  geo_locations: {
    countries?: string[];
    cities?: Array<{ key: string }>;
  };
  interests?: Array<{ id: string; name: string }>;
  locales?: number[];
}

export interface MetaCreativeParams {
  name: string;
  object_story_spec: {
    page_id: string;
    instagram_actor_id: string;
    video_data?: {
      video_id: string;
      message: string;
      call_to_action: {
        type: string;
        value: { link: string };
      };
    };
    link_data?: {
      image_hash: string;
      message: string;
      link: string;
      call_to_action: {
        type: string;
        value: { link: string };
      };
    };
  };
}

export interface MetaInsightsRow {
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  ctr: string;
  spend: string;
  reach: string;
  frequency: string;
  actions?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ value: string }>;
  video_p50_watched_actions?: Array<{ value: string }>;
  video_p75_watched_actions?: Array<{ value: string }>;
  video_p100_watched_actions?: Array<{ value: string }>;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
}

interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

interface VideoUploadStatus {
  status: {
    video_status: "ready" | "processing" | "error";
    processing_progress?: number;
  };
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class MetaApiClient {
  private accessToken: string;
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    // Ensure act_ prefix
    this.adAccountId = adAccountId.startsWith("act_")
      ? adAccountId
      : `act_${adAccountId}`;
  }

  // ── Campaign ────────────────────────────────────────────────────────────

  async createCampaign(
    params: MetaCampaignParams
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `${this.adAccountId}/campaigns`,
      {
        method: "POST",
        body: this.buildFormData({
          name: params.name,
          objective: params.objective,
          status: params.status,
          special_ad_categories: JSON.stringify(
            params.special_ad_categories
          ),
        }),
      }
    );
  }

  async updateCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED" | "DELETED"
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`${campaignId}`, {
      method: "POST",
      body: this.buildFormData({ status }),
    });
  }

  // ── Ad Set ──────────────────────────────────────────────────────────────

  async createAdSet(params: MetaAdSetParams): Promise<{ id: string }> {
    const targeting: Record<string, unknown> = {
      age_min: params.targeting.age_min,
      age_max: params.targeting.age_max,
      geo_locations: params.targeting.geo_locations,
      publisher_platforms: params.publisher_platforms,
      instagram_positions: params.instagram_positions,
    };

    if (params.targeting.interests?.length) {
      targeting.interests = params.targeting.interests;
    }
    if (params.targeting.locales?.length) {
      targeting.locales = params.targeting.locales;
    }

    return this.request<{ id: string }>(
      `${this.adAccountId}/adsets`,
      {
        method: "POST",
        body: this.buildFormData({
          campaign_id: params.campaign_id,
          name: params.name,
          daily_budget: params.daily_budget.toString(),
          start_time: params.start_time,
          ...(params.end_time && { end_time: params.end_time }),
          billing_event: params.billing_event,
          optimization_goal: params.optimization_goal,
          targeting: JSON.stringify(targeting),
          instagram_actor_id: params.instagram_actor_id,
          status: "PAUSED",
        }),
      }
    );
  }

  // ── Creative Upload ─────────────────────────────────────────────────────

  async uploadVideoFromUrl(
    videoUrl: string,
    title?: string
  ): Promise<{ video_id: string }> {
    const result = await this.request<{ id: string }>(
      `${this.adAccountId}/advideos`,
      {
        method: "POST",
        body: this.buildFormData({
          file_url: videoUrl,
          title: title || "Ad Video",
        }),
      }
    );

    // Poll until video is processed
    const videoId = result.id;
    await this.waitForVideoReady(videoId);

    return { video_id: videoId };
  }

  async uploadImageFromUrl(
    imageUrl: string
  ): Promise<{ hash: string }> {
    const result = await this.request<{
      images: Record<string, { hash: string }>;
    }>(`${this.adAccountId}/adimages`, {
      method: "POST",
      body: this.buildFormData({ url: imageUrl }),
    });

    const hash = Object.values(result.images)[0]?.hash;
    if (!hash) {
      throw new Error("Failed to get image hash from Meta upload response");
    }

    return { hash };
  }

  // ── Ad Creative ─────────────────────────────────────────────────────────

  async createAdCreative(
    params: MetaCreativeParams
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `${this.adAccountId}/adcreatives`,
      {
        method: "POST",
        body: this.buildFormData({
          name: params.name,
          object_story_spec: JSON.stringify(params.object_story_spec),
        }),
      }
    );
  }

  // ── Ad ──────────────────────────────────────────────────────────────────

  async createAd(
    adSetId: string,
    creativeId: string,
    name: string
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `${this.adAccountId}/ads`,
      {
        method: "POST",
        body: this.buildFormData({
          name,
          adset_id: adSetId,
          creative: JSON.stringify({ creative_id: creativeId }),
          status: "PAUSED",
        }),
      }
    );
  }

  // ── Insights ────────────────────────────────────────────────────────────

  async getCampaignInsights(
    campaignId: string,
    fields: string[],
    dateRange: { since: string; until: string }
  ): Promise<MetaInsightsRow[]> {
    const params = new URLSearchParams({
      fields: fields.join(","),
      time_range: JSON.stringify(dateRange),
      time_increment: "1", // daily breakdown
      level: "campaign",
    });

    const result = await this.request<{ data: MetaInsightsRow[] }>(
      `${campaignId}/insights?${params.toString()}`
    );

    return result.data || [];
  }

  async getAdInsights(
    adId: string,
    fields: string[],
    dateRange: { since: string; until: string }
  ): Promise<MetaInsightsRow[]> {
    const params = new URLSearchParams({
      fields: fields.join(","),
      time_range: JSON.stringify(dateRange),
      time_increment: "1",
      level: "ad",
    });

    const result = await this.request<{ data: MetaInsightsRow[] }>(
      `${adId}/insights?${params.toString()}`
    );

    return result.data || [];
  }

  // ── Interest Search ─────────────────────────────────────────────────────

  async searchInterests(
    query: string
  ): Promise<Array<{ id: string; name: string; audience_size: number }>> {
    const params = new URLSearchParams({
      type: "adinterest",
      q: query,
    });

    const result = await this.request<{
      data: Array<{
        id: string;
        name: string;
        audience_size_lower_bound: number;
        audience_size_upper_bound: number;
      }>;
    }>(`search?${params.toString()}`);

    return (result.data || []).map((item) => ({
      id: item.id,
      name: item.name,
      audience_size: Math.round(
        (item.audience_size_lower_bound + item.audience_size_upper_bound) / 2
      ),
    }));
  }

  // ── Campaign Status Check ───────────────────────────────────────────────

  async getCampaignStatus(
    campaignId: string
  ): Promise<{
    id: string;
    effective_status: string;
    configured_status: string;
  }> {
    return this.request<{
      id: string;
      effective_status: string;
      configured_status: string;
    }>(`${campaignId}?fields=id,effective_status,configured_status`);
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  private async waitForVideoReady(
    videoId: string,
    maxWaitMs = 120_000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.request<VideoUploadStatus>(
        `${videoId}?fields=status`
      );

      if (status.status.video_status === "ready") return;
      if (status.status.video_status === "error") {
        throw new Error(`Meta video processing failed for video ${videoId}`);
      }

      // Wait 3 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(
      `Meta video processing timed out after ${maxWaitMs / 1000}s for video ${videoId}`
    );
  }

  private buildFormData(
    params: Record<string, string>
  ): URLSearchParams {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
    return formData;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${META_API_BASE}/${endpoint}`;

    // Append access token
    const separator = url.includes("?") ? "&" : "?";
    const urlWithToken = `${url}${separator}access_token=${this.accessToken}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(urlWithToken, {
          ...options,
          headers: {
            ...options.headers,
          },
        });

        // Check rate limiting
        const usageHeader = response.headers.get(
          "x-business-use-case-usage"
        );
        if (usageHeader) {
          try {
            const usage = JSON.parse(usageHeader);
            const values = Object.values(usage) as Array<
              Array<{ call_count: number; total_cputime: number }>
            >;
            const first = values[0]?.[0];
            if (first && first.call_count > 80) {
              console.warn(
                `[MetaApi] Rate limit warning: ${first.call_count}% usage`
              );
            }
          } catch {
            // Ignore parse errors on usage header
          }
        }

        if (response.status === 429) {
          const delay =
            RETRY_BASE_DELAY_MS * Math.pow(2, attempt) +
            Math.random() * 1000;
          console.warn(
            `[MetaApi] Rate limited (429). Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          const errorBody = (await response.json()) as MetaApiError;
          const metaError = errorBody.error;

          // Transient errors worth retrying
          const transientCodes = [1, 2, 4, 17, 341]; // API Unknown, API Service, Too many calls, etc.
          if (
            transientCodes.includes(metaError.code) &&
            attempt < MAX_RETRIES - 1
          ) {
            const delay =
              RETRY_BASE_DELAY_MS * Math.pow(2, attempt) +
              Math.random() * 1000;
            console.warn(
              `[MetaApi] Transient error (code ${metaError.code}). Retrying in ${Math.round(delay)}ms`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, delay)
            );
            continue;
          }

          throw new Error(
            `Meta API Error [${metaError.code}${metaError.error_subcode ? `:${metaError.error_subcode}` : ""}]: ${metaError.message} (fbtrace: ${metaError.fbtrace_id})`
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        // Don't retry non-transient errors
        if (
          lastError.message.includes("Meta API Error") &&
          !lastError.message.includes("Transient")
        ) {
          throw lastError;
        }

        if (attempt < MAX_RETRIES - 1) {
          const delay =
            RETRY_BASE_DELAY_MS * Math.pow(2, attempt) +
            Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Meta API request failed after all retries");
  }
}
