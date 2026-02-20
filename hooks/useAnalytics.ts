"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
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
    voiceoverCount: number;
  };
  projectCount: number;
  campaignCount: number;
  monthlySpend: { month: string; amount: number }[];
}

export function useAnalytics() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch usage logs for cost breakdown
      const { data: usageLogs } = await supabase
        .from("mkt_usage_logs")
        .select("api_service, estimated_cost_usd, created_at");

      const logs = usageLogs ?? [];

      // Cost by service
      const costByService = { gemini: 0, veo: 0, imagen: 0, tts: 0 };
      let totalSpent = 0;
      const monthlyMap = new Map<string, number>();

      for (const log of logs) {
        const cost = log.estimated_cost_usd ?? 0;
        totalSpent += cost;

        const service = log.api_service as keyof typeof costByService;
        if (service in costByService) {
          costByService[service] += cost;
        }

        // Monthly aggregation
        const month = log.created_at.substring(0, 7); // "2026-02"
        monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + cost);
      }

      const monthlySpend = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Generation stats
      const { data: generations } = await supabase
        .from("mkt_generations")
        .select("type, status");

      const gens = generations ?? [];
      const generationStats = {
        total: gens.length,
        completed: gens.filter((g) => g.status === "completed").length,
        failed: gens.filter((g) => g.status === "failed").length,
        videoCount: gens.filter((g) => g.type === "video" || g.type === "stitched").length,
        imageCount: gens.filter((g) => g.type === "image").length,
        voiceoverCount: gens.filter((g) => g.type === "voiceover").length,
      };

      // Counts
      const { count: projectCount } = await supabase
        .from("mkt_projects")
        .select("*", { count: "exact", head: true });

      const { count: campaignCount } = await supabase
        .from("mkt_campaigns")
        .select("*", { count: "exact", head: true });

      return {
        totalSpent,
        costByService,
        generationStats,
        projectCount: projectCount ?? 0,
        campaignCount: campaignCount ?? 0,
        monthlySpend,
      };
    },
    staleTime: 60_000, // 1 minute cache
  });
}
