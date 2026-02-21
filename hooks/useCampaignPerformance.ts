"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CampaignPerformance } from "@/types/database";

interface UseCampaignPerformanceOptions {
  from?: string;
  to?: string;
}

export function useCampaignPerformance(
  campaignId: string,
  options?: UseCampaignPerformanceOptions
) {
  const supabase = createClient();

  return useQuery({
    queryKey: [
      "campaign-performance",
      campaignId,
      options?.from,
      options?.to,
    ],
    queryFn: async (): Promise<CampaignPerformance[]> => {
      let query = supabase
        .from("mkt_campaign_performance")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: false });

      if (options?.from) {
        query = query.gte("date", options.from);
      }
      if (options?.to) {
        query = query.lte("date", options.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as CampaignPerformance[];
    },
    enabled: !!campaignId,
  });
}
