"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/database";
import type { ProjectBriefFormData } from "@/lib/validations";

const PROJECTS_KEY = ["projects"];

export function useProjects(campaignId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: campaignId ? [...PROJECTS_KEY, { campaignId }] : PROJECTS_KEY,
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from("mkt_projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });
}

export function useCreateProject() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brief: ProjectBriefFormData): Promise<Project> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mkt_projects")
        .insert({
          user_id: user.id,
          title: brief.title,
          description: brief.description ?? null,
          product_name: brief.product_name,
          product_description: brief.product_description ?? null,
          target_platforms: brief.target_platforms,
          target_audience: brief.target_audience ?? null,
          languages: brief.languages,
          style: brief.style,
          tone: brief.tone,
          additional_notes: brief.additional_notes ?? null,
          source_url: (brief as Record<string, unknown>).source_url as string ?? null,
          campaign_id: brief.campaign_id ?? null,
          brand_kit_id: brief.brand_kit_id ?? null,
          ...(brief.code_context_id ? { code_context_id: brief.code_context_id } : {}),
          status: "strategy_pending",
          strategy: null,
          parent_project_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useDeleteProject() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("mkt_projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}
