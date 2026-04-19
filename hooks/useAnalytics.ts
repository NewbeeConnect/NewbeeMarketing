"use client";

import { useQuery } from "@tanstack/react-query";

export interface AnalyticsData {
  totalSpent: number;
  costByService: {
    gemini: number;
    veo: number;
    imagen: number;
    tts: number;
  };
  generationStats: {
    total: number;
    completed: number;
    failed: number;
    videoCount: number;
    imageCount: number;
  };
  monthlySpend: { month: string; amount: number }[];
}

/**
 * Fetches team-wide analytics from the server route (service-role backed).
 * Previously this hook queried Supabase client-side which relied on RLS —
 * with a single-tenant, team-shared setup we want every admin to see the
 * same totals, so the server endpoint skips per-user filters.
 */
export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Analytics request failed (${res.status})`);
      }
      return (await res.json()) as AnalyticsData;
    },
    staleTime: 60_000,
  });
}
