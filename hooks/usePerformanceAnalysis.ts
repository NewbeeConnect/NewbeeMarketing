"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PerformanceAnalysis } from "@/app/api/ai/analyze-performance/route";

interface PerformanceAnalysisRecord {
  id: string;
  campaign_id: string;
  deployment_id: string | null;
  analysis: PerformanceAnalysis;
  model: string;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
}

export function usePerformanceAnalyses(campaignId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["performance-analyses", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mkt_performance_analyses")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PerformanceAnalysisRecord[];
    },
    enabled: !!campaignId,
  });
}

export function useLatestAnalysis(campaignId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["performance-analyses", campaignId, "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mkt_performance_analyses")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return (data as unknown as PerformanceAnalysisRecord) || null;
    },
    enabled: !!campaignId,
  });
}

interface RequestAnalysisParams {
  campaign_id: string;
  deployment_id?: string;
  date_from?: string;
  date_to?: string;
}

export function useRequestAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RequestAnalysisParams) => {
      const response = await fetch("/api/ai/analyze-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      return response.json() as Promise<{
        analysis: PerformanceAnalysis;
        analysis_id: string | null;
        model: string;
        data_points: number;
      }>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performance-analyses", variables.campaign_id],
      });
    },
  });
}

export function useSyncPerformance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      campaign_id?: string;
      deployment_id?: string;
    }) => {
      const response = await fetch("/api/ads/sync-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      if (variables.campaign_id) {
        queryClient.invalidateQueries({
          queryKey: ["campaign-performance", variables.campaign_id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["ad-deployments"],
      });
    },
  });
}
