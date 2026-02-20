"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKey } from "./useProject";
import { scenesKey } from "./useScenes";

export function useGenerateScenes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch("/api/ai/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate scenes");
      }

      return res.json();
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: projectKey(projectId) });
      queryClient.invalidateQueries({ queryKey: scenesKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
