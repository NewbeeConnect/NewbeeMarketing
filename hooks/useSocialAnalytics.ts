"use client";

import { useQuery } from "@tanstack/react-query";

export interface SocialAnalyticsData {
  platformTotals: Record<string, {
    impressions: number; reach: number; likes: number; comments: number;
    shares: number; saves: number; clicks: number; avgEngagement: number; posts: number;
  }>;
  dailyMetrics: Array<{
    platform: string; date: string; impressions: number; reach: number;
    likes: number; comments: number; shares: number; engagement_rate: number;
  }>;
  queueStats: Record<string, number>;
  period: { days: number; since: string };
}

export function useSocialAnalytics(days = 30) {
  return useQuery<SocialAnalyticsData>({
    queryKey: ["social-analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/social/analytics?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
}
