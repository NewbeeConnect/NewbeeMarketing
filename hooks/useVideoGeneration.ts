"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/types/database";

export function generationsKey(projectId: string) {
  return ["generations", projectId];
}

export function useGenerations(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: generationsKey(projectId),
    queryFn: async (): Promise<Generation[]> => {
      const { data, error } = await supabase
        .from("mkt_generations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Generation[];
    },
    enabled: !!projectId,
  });
}

export function useStartVideoGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sceneId,
      language,
      platform,
      aspectRatio,
      resolution,
      useFastModel,
    }: {
      projectId: string;
      sceneId: string;
      language?: string;
      platform?: string;
      aspectRatio?: string;
      resolution?: string;
      useFastModel?: boolean;
    }) => {
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sceneId,
          language,
          platform,
          aspectRatio,
          resolution,
          useFastModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start video generation");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: generationsKey(variables.projectId),
      });
    },
  });
}

export function useCheckVideoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      generationId,
      projectId,
    }: {
      generationId: string;
      projectId: string;
    }) => {
      const response = await fetch(
        `/api/generate/video/status?generationId=${generationId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check video status");
      }

      const result = await response.json();

      // Invalidate if completed or failed
      if (result.status === "completed" || result.status === "failed") {
        queryClient.invalidateQueries({
          queryKey: generationsKey(projectId),
        });
      }

      return result;
    },
  });
}

export function useRetryVideoGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      generationId,
    }: {
      generationId: string;
      projectId: string;
    }) => {
      const response = await fetch("/api/generate/video/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to retry generation");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: generationsKey(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["active-generations", variables.projectId],
      });
    },
  });
}

// Hook for polling active generations
export function useActiveGenerations(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["active-generations", projectId],
    queryFn: async (): Promise<Generation[]> => {
      const { data, error } = await supabase
        .from("mkt_generations")
        .select("*")
        .eq("project_id", projectId)
        .in("status", ["pending", "queued", "processing"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Generation[];
    },
    enabled: !!projectId,
    refetchInterval: 5000, // Poll every 5 seconds for active generations
  });
}
