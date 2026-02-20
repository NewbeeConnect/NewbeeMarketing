"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectStrategy, ProjectStatus } from "@/types/database";

export function projectKey(id: string) {
  return ["project", id];
}

export function useProject(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: projectKey(projectId),
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from("mkt_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        strategy: ProjectStrategy;
        strategy_approved: boolean;
        status: ProjectStatus;
        current_step: number;
      }>;
    }) => {
      const updatePayload = data.strategy
        ? { ...data, strategy: JSON.parse(JSON.stringify(data.strategy)) }
        : data;
      const { data: updated, error } = await supabase
        .from("mkt_projects")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated as Project;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(projectKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
