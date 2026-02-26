"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scenesKey } from "./useScenes";

interface OptimizeResult {
  sceneId: string;
  optimized_prompt: string;
  negative_prompt: string;
}

async function optimizeSingleScene(
  projectId: string,
  sceneId: string
): Promise<OptimizeResult[]> {
  const response = await fetch("/api/ai/optimize-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, sceneId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to optimize prompt");
  }

  const data = await response.json();
  return data.results;
}

/** Optimize a single scene prompt */
export function useOptimizePrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sceneId,
    }: {
      projectId: string;
      sceneId: string;
    }): Promise<OptimizeResult[]> => {
      return optimizeSingleScene(projectId, sceneId);
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

/** Optimize all scenes one-by-one with progress tracking */
export function useOptimizeAllPrompts() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      sceneIds,
    }: {
      projectId: string;
      sceneIds: string[];
    }): Promise<OptimizeResult[]> => {
      setProgress({ completed: 0, total: sceneIds.length });
      const allResults: OptimizeResult[] = [];

      for (let i = 0; i < sceneIds.length; i++) {
        const results = await optimizeSingleScene(projectId, sceneIds[i]);
        allResults.push(...results);
        setProgress({ completed: i + 1, total: sceneIds.length });

        // Invalidate after each scene so UI updates progressively
        queryClient.invalidateQueries({
          queryKey: scenesKey(projectId),
        });

        // Delay between calls to avoid rate limiting
        if (i < sceneIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return allResults;
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
    onSettled: () => {
      setProgress({ completed: 0, total: 0 });
    },
  });

  const reset = useCallback(() => {
    setProgress({ completed: 0, total: 0 });
  }, []);

  return { ...mutation, progress, reset };
}
