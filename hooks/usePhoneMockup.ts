"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GenerateMockupParams {
  screenshotUrl: string;
  templateId: string;
  aspectRatio?: string;
  backgroundColor?: string;
  sceneId?: string;
  projectId?: string;
}

interface MockupResult {
  mockupUrl: string;
  width: number;
  height: number;
}

export function useGenerateMockup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateMockupParams): Promise<MockupResult> => {
      const response = await fetch("/api/generate/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshotUrl: params.screenshotUrl,
          templateId: params.templateId,
          aspectRatio: params.aspectRatio || "9:16",
          backgroundColor: params.backgroundColor,
          sceneId: params.sceneId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate mockup");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["scenes", variables.projectId],
        });
      }
    },
  });
}
