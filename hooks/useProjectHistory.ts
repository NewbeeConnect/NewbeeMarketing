"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProjectVersion } from "@/types/database";

export function useProjectHistory(
  projectId: string,
  step?: "strategy" | "scenes" | "prompts"
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["project-history", projectId, step],
    queryFn: async (): Promise<ProjectVersion[]> => {
      let query = supabase
        .from("mkt_project_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (step) {
        query = query.eq("step", step);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProjectVersion[];
    },
    enabled: !!projectId,
  });
}
