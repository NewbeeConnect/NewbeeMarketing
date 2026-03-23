/**
 * Social Metrics Syncer
 *
 * Fetches metrics from all platforms for published content
 * and upserts into mkt_social_post_metrics.
 * Follows the pattern of lib/ads/performance-syncer.ts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SocialPlatform } from "./types";
import { fetchPostMetrics } from "./publisher";

type ServiceClient = SupabaseClient<Database>;

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync metrics for all published content of a user.
 * Called by the cron job /api/cron/social-metrics-sync.
 */
export async function syncAllSocialMetrics(
  serviceClient: ServiceClient,
  userId?: string
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  // Get all published content with external post IDs
  let query = serviceClient
    .from("mkt_content_queue")
    .select("id, user_id, platform_post_ids, target_platforms")
    .eq("status", "published")
    .not("platform_post_ids", "eq", "{}");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: publishedContent, error } = await query.limit(200);

  if (error || !publishedContent) {
    console.error("[MetricsSyncer] Failed to fetch published content:", error);
    return { ...result, errors: [error?.message ?? "Unknown error"] };
  }

  const today = new Date().toISOString().split("T")[0];

  // Build a flat list of all (content, platform, postId) tuples to sync
  const syncTasks: Array<{
    contentId: string;
    userId: string;
    platform: SocialPlatform;
    externalPostId: string;
  }> = [];

  for (const content of publishedContent) {
    const postIds = content.platform_post_ids as Record<string, string>;
    if (!postIds || Object.keys(postIds).length === 0) continue;

    for (const [platform, externalPostId] of Object.entries(postIds)) {
      if (!externalPostId) continue;
      syncTasks.push({
        contentId: content.id,
        userId: content.user_id,
        platform: platform as SocialPlatform,
        externalPostId,
      });
    }
  }

  // Process in batches of 10 to avoid overwhelming platform APIs
  const BATCH_SIZE = 10;
  for (let i = 0; i < syncTasks.length; i += BATCH_SIZE) {
    const batch = syncTasks.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (task) => {
        const metrics = await fetchPostMetrics(
          serviceClient,
          task.userId,
          task.platform,
          task.externalPostId
        );

        if (!metrics) {
          throw new Error("No metrics returned");
        }

        const { error: upsertError } = await serviceClient
          .from("mkt_social_post_metrics")
          .upsert(
            {
              user_id: task.userId,
              content_queue_id: task.contentId,
              platform: task.platform,
              external_post_id: task.externalPostId,
              date: today,
              impressions: metrics.impressions,
              reach: metrics.reach,
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              saves: metrics.saves,
              clicks: metrics.clicks,
              engagement_rate: metrics.engagementRate,
              video_views: metrics.videoViews,
              watch_time_seconds: metrics.watchTimeSeconds,
              completion_rate: metrics.completionRate,
              followers_gained: metrics.followersGained,
            },
            { onConflict: "content_queue_id,platform,date" }
          );

        if (upsertError) throw new Error(upsertError.message);
      })
    );

    for (let j = 0; j < results.length; j++) {
      const settled = results[j];
      const task = batch[j];
      if (settled.status === "fulfilled") {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push(`${task.platform}/${task.contentId}: ${settled.reason?.message ?? "Unknown error"}`);
      }
    }
  }

  console.log(
    `[MetricsSyncer] Sync complete: ${result.synced} synced, ${result.failed} failed`
  );
  return result;
}

/**
 * Sync metrics for specific content queue IDs only.
 * Use this when you know exactly which items need syncing (e.g., A/B test variants)
 * instead of syncAllSocialMetrics which scans all published content.
 */
export async function syncMetricsForContentIds(
  serviceClient: ServiceClient,
  contentIds: string[]
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  if (contentIds.length === 0) return result;

  const { data: content, error } = await serviceClient
    .from("mkt_content_queue")
    .select("id, user_id, platform_post_ids")
    .in("id", contentIds)
    .eq("status", "published")
    .not("platform_post_ids", "eq", "{}");

  if (error || !content) {
    console.error("[MetricsSyncer] Failed to fetch content by IDs:", error);
    return { ...result, errors: [error?.message ?? "Unknown error"] };
  }

  const today = new Date().toISOString().split("T")[0];

  const syncTasks: Array<{
    contentId: string;
    userId: string;
    platform: SocialPlatform;
    externalPostId: string;
  }> = [];

  for (const item of content) {
    const postIds = item.platform_post_ids as Record<string, string>;
    if (!postIds || Object.keys(postIds).length === 0) continue;

    for (const [platform, externalPostId] of Object.entries(postIds)) {
      if (!externalPostId) continue;
      syncTasks.push({
        contentId: item.id,
        userId: item.user_id,
        platform: platform as SocialPlatform,
        externalPostId,
      });
    }
  }

  // All tasks can run in parallel since the set is small (test variants only)
  const results = await Promise.allSettled(
    syncTasks.map(async (task) => {
      const metrics = await fetchPostMetrics(
        serviceClient,
        task.userId,
        task.platform,
        task.externalPostId
      );

      if (!metrics) throw new Error("No metrics returned");

      const { error: upsertError } = await serviceClient
        .from("mkt_social_post_metrics")
        .upsert(
          {
            user_id: task.userId,
            content_queue_id: task.contentId,
            platform: task.platform,
            external_post_id: task.externalPostId,
            date: today,
            impressions: metrics.impressions,
            reach: metrics.reach,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            saves: metrics.saves,
            clicks: metrics.clicks,
            engagement_rate: metrics.engagementRate,
            video_views: metrics.videoViews,
            watch_time_seconds: metrics.watchTimeSeconds,
            completion_rate: metrics.completionRate,
            followers_gained: metrics.followersGained,
          },
          { onConflict: "content_queue_id,platform,date" }
        );

      if (upsertError) throw new Error(upsertError.message);
    })
  );

  for (let i = 0; i < results.length; i++) {
    const settled = results[i];
    const task = syncTasks[i];
    if (settled.status === "fulfilled") {
      result.synced++;
    } else {
      result.failed++;
      result.errors.push(`${task.platform}/${task.contentId}: ${settled.reason?.message ?? "Unknown error"}`);
    }
  }

  console.log(
    `[MetricsSyncer] Scoped sync complete: ${result.synced} synced, ${result.failed} failed`
  );
  return result;
}
