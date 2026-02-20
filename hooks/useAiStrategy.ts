"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKey } from "./useProject";

export function useGenerateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate strategy");
      }

      return res.json();
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: projectKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useRefineContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      currentContent,
      refinementRequest,
      contentType,
    }: {
      projectId: string;
      currentContent: unknown;
      refinementRequest: string;
      contentType: "strategy" | "scenes" | "prompts";
    }) => {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          currentContent,
          refinementRequest,
          contentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refine content");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKey(variables.projectId),
      });
    },
  });
}
