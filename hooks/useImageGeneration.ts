"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generationsKey } from "./useVideoGeneration";

export function useGenerateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      prompt,
      aspectRatio,
      useFastModel,
      purpose,
    }: {
      projectId: string;
      prompt: string;
      aspectRatio?: string;
      useFastModel?: boolean;
      purpose?: string;
    }) => {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt,
          aspectRatio,
          useFastModel,
          purpose,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
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
