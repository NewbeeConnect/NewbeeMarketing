"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scenesKey } from "./useScenes";

interface OptimizeResult {
  sceneId: string;
  optimized_prompt: string;
  negative_prompt: string;
}

export function useOptimizePrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sceneId,
    }: {
      projectId: string;
      sceneId?: string;
    }): Promise<OptimizeResult[]> => {
      const response = await fetch("/api/ai/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, sceneId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to optimize prompts");
      }

      const data = await response.json();
      return data.results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: scenesKey(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-history", variables.projectId, "prompts"],
      });
    },
  });
}
