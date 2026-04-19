"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectSlug, ImageRatio, VideoRatio } from "@/lib/projects";

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export type GenerationRow = {
  id: string;
  type: "image" | "video";
  project_slug: ProjectSlug;
  ratio: ImageRatio | VideoRatio;
  filename: string;
  prompt: string;
  status: GenerationStatus;
  output_url: string | null;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ReferenceImageInput = {
  imageBytes: string; // base64
  mimeType: string;
};

/**
 * POST /api/generate/image — synchronous. Returns the completed row.
 */
export function useGenerateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project: ProjectSlug;
      ratio: ImageRatio;
      prompt: string;
      referenceImages?: ReferenceImageInput[];
    }) => {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as {
        generationId: string;
        status: "completed";
        outputUrl: string;
        filename: string;
        project: ProjectSlug;
        ratio: ImageRatio;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

/**
 * POST /api/generate/video — async. Returns an operation; client polls
 * `useVideoStatus(generationId)` until completed.
 */
export function useGenerateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project: ProjectSlug;
      ratio: VideoRatio;
      prompt: string;
      durationSeconds?: 4 | 6 | 8;
      referenceImages?: ReferenceImageInput[];
    }) => {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as {
        generationId: string;
        operationName: string | null;
        status: "processing";
        filename: string;
        project: ProjectSlug;
        ratio: VideoRatio;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

/**
 * GET /api/generate/video/[generationId]/status — poll until terminal.
 * `enabled` lets the caller pause polling (e.g. when no video is in flight).
 */
export function useVideoStatus(generationId: string | null) {
  return useQuery({
    queryKey: ["video-status", generationId],
    enabled: !!generationId,
    queryFn: async () => {
      const res = await fetch(
        `/api/generate/video/${generationId}/status`
      );
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as {
        generationId: string;
        status: GenerationStatus;
        outputUrl?: string;
        errorMessage?: string;
      };
    },
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === "completed" || s === "failed") return false;
      return 8000;
    },
  });
}

async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // not JSON
  }
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}
