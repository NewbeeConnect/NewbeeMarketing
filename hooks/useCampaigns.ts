"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Campaign } from "@/types/database";
import type { CampaignFormData } from "@/lib/validations";

const CAMPAIGNS_KEY = ["campaigns"];

export function useCampaigns() {
  const supabase = createClient();

  return useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("mkt_campaigns")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });
}

export function useCampaign(campaignId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async (): Promise<Campaign> => {
      const { data, error } = await supabase
        .from("mkt_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CampaignFormData): Promise<Campaign> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mkt_campaigns")
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description ?? null,
          objective: formData.objective ?? null,
          brand_kit_id: formData.brand_kit_id ?? null,
          start_date: formData.start_date ?? null,
          end_date: formData.end_date ?? null,
          budget_limit_usd: formData.budget_limit_usd ?? null,
          status: formData.status ?? "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

export function useUpdateCampaign() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CampaignFormData>;
    }): Promise<Campaign> => {
      const { data: updated, error } = await supabase
        .from("mkt_campaigns")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated as Campaign;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["campaign", data.id], data);
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

export function useDeleteCampaign() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("mkt_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}
