"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generationsKey } from "./useVideoGeneration";

export function useGenerateVoiceover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sceneId,
      text,
      language,
      voiceName,
    }: {
      projectId: string;
      sceneId?: string;
      text: string;
      language: string;
      voiceName?: string;
    }) => {
      const response = await fetch("/api/generate/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, sceneId, text, language, voiceName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate voiceover");
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
