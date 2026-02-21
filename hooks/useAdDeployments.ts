"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AdDeployment } from "@/types/database";
import type { PublishAdRequest } from "@/lib/ads/types";

const AD_DEPLOYMENTS_KEY = ["ad-deployments"];

// ─── Query: Fetch deployments ────────────────────────────────────────────────

export function useAdDeployments(campaignId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: campaignId
      ? [...AD_DEPLOYMENTS_KEY, campaignId]
      : AD_DEPLOYMENTS_KEY,
    queryFn: async (): Promise<AdDeployment[]> => {
      let query = supabase
        .from("mkt_ad_deployments")
        .select("*")
        .order("created_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as AdDeployment[];
    },
  });
}

// ─── Query: Fetch single deployment status ───────────────────────────────────

export function useAdDeploymentStatus(deploymentId: string) {
  return useQuery({
    queryKey: ["ad-deployment", deploymentId],
    queryFn: async (): Promise<AdDeployment> => {
      const res = await fetch(`/api/ads/${deploymentId}/status`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to fetch deployment status");
      }
      const { deployment } = await res.json();
      return deployment as AdDeployment;
    },
    enabled: !!deploymentId,
    refetchInterval: 30_000, // Poll every 30 seconds for status updates
  });
}

// ─── Mutation: Publish ad ────────────────────────────────────────────────────

export function usePublishAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PublishAdRequest): Promise<{
      deployment: AdDeployment;
      publishResult: {
        success: boolean;
        platform: string;
        external_campaign_id: string | null;
        external_ad_id: string | null;
        status: string;
        message: string;
      };
    }> => {
      const res = await fetch("/api/ads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to publish ad");
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate deployment lists
      queryClient.invalidateQueries({ queryKey: AD_DEPLOYMENTS_KEY });
      // Pre-populate the single deployment cache
      if (data.deployment) {
        queryClient.setQueryData(
          ["ad-deployment", data.deployment.id],
          data.deployment
        );
      }
    },
  });
}
