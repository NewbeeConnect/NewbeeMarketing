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
    stitchedCount: number;
  };
  storyCount: number;
  monthlySpend: { month: string; amount: number }[];
}

export function useAnalytics() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: usageLogs, error: usageError } = await supabase
        .from("mkt_usage_logs")
        .select("api_service, estimated_cost_usd, created_at")
        .gte("created_at", twelveMonthsAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000);
      if (usageError) throw usageError;

      const logs = usageLogs ?? [];

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

        const createdAt = log.created_at ?? "";
        if (createdAt) {
          const month = createdAt.substring(0, 7);
          monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + cost);
        }
      }

      const monthlySpend = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const { data: generations, error: genError } = await supabase
        .from("mkt_generations")
        .select("type, status")
        .gte("created_at", twelveMonthsAgo.toISOString())
        .limit(5000);
      if (genError) throw genError;

      const gens = generations ?? [];
      const generationStats = {
        total: gens.length,
        completed: gens.filter((g) => g.status === "completed").length,
        failed: gens.filter((g) => g.status === "failed").length,
        videoCount: gens.filter((g) => g.type === "video").length,
        imageCount: gens.filter((g) => g.type === "image").length,
        stitchedCount: gens.filter((g) => g.type === "stitched").length,
      };

      const { count: storyCount, error: storyCountError } = await supabase
        .from("mkt_stories")
        .select("*", { count: "exact", head: true });
      if (storyCountError) throw storyCountError;

      return {
        totalSpent,
        costByService,
        generationStats,
        storyCount: storyCount ?? 0,
        monthlySpend,
      };
    },
    staleTime: 60_000,
  });
}
