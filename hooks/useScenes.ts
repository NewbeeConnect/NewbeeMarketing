"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Scene } from "@/types/database";

export function scenesKey(projectId: string) {
  return ["scenes", projectId];
}

export function useScenes(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: scenesKey(projectId),
    queryFn: async (): Promise<Scene[]> => {
      const { data, error } = await supabase
        .from("mkt_scenes")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Scene[];
    },
    enabled: !!projectId,
  });
}

export function useUpdateScene() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Scene>;
    }) => {
      const { data: updated, error } = await supabase
        .from("mkt_scenes")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated as Scene;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: scenesKey(data.project_id),
      });
    },
  });
}

export function useReorderScenes() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sceneIds,
    }: {
      projectId: string;
      sceneIds: string[];
    }) => {
      // Update sort_order for each scene
      const updates = sceneIds.map((id, index) =>
        supabase
          .from("mkt_scenes")
          .update({ sort_order: index, scene_number: index + 1 })
          .eq("id", id)
      );

      const results = await Promise.allSettled(updates);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error("Some scene reorder updates failed:", failed);
        throw new Error(`${failed.length} scene(s) failed to reorder`);
      }
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: scenesKey(projectId) });
    },
  });
}

export function useDeleteScene() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sceneId,
      projectId,
    }: {
      sceneId: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from("mkt_scenes")
        .delete()
        .eq("id", sceneId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: scenesKey(projectId) });
    },
  });
}
