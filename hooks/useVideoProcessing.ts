"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generationsKey } from "./useVideoGeneration";

export function useStitchVideos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      language,
      platform,
    }: {
      projectId: string;
      language?: string;
      platform?: string;
    }) => {
      const response = await fetch("/api/process/stitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, language, platform }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to stitch videos");
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

export function useEmbedCaption() {
  return useMutation({
    mutationFn: async ({
      captionId,
      generationId,
    }: {
      captionId: string;
      generationId?: string;
    }) => {
      const response = await fetch("/api/process/caption-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId, generationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to embed captions");
      }

      return response.json();
    },
  });
}

export function useApplyWatermark() {
  return useMutation({
    mutationFn: async ({
      projectId,
      generationId,
    }: {
      projectId: string;
      generationId: string;
    }) => {
      const response = await fetch("/api/process/watermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, generationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply watermark");
      }

      return response.json();
    },
  });
}

export function useExportVideos() {
  return useMutation({
    mutationFn: async ({
      projectId,
      platforms,
      includeCaption,
      includeWatermark,
      resolution,
    }: {
      projectId: string;
      platforms: string[];
      includeCaption?: boolean;
      includeWatermark?: boolean;
      resolution?: string;
    }) => {
      const response = await fetch("/api/process/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          platforms,
          includeCaption,
          includeWatermark,
          resolution,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export videos");
      }

      return response.json();
    },
  });
}
