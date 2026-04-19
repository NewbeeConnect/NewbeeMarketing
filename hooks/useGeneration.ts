"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectSlug, ImageRatio, VideoRatio } from "@/lib/projects";

export type ImagePromptFields = {
  subject: string;
  style: string;
  composition: string;
  lighting: string;
  mood: string;
  technical: string;
};

export type VideoPromptFields = {
  subject: string;
  camera: string;
  action: string;
  lighting: string;
  mood: string;
  audio: string;
};

/**
 * Assemble Nano Banana 2 prompt from structured fields. Order mirrors the
 * SYSTEM prompt in /api/generate/prompt so the model sees fields in the
 * sequence it was trained to produce them.
 */
export function assembleImagePrompt(f: ImagePromptFields): string {
  return `${f.subject}. ${f.style}. Composition: ${f.composition}. Lighting: ${f.lighting}. Mood: ${f.mood}. ${f.technical}.`;
}

export function assembleVideoPrompt(f: VideoPromptFields): string {
  return `${f.subject}. Camera: ${f.camera}. Action: ${f.action}. Lighting: ${f.lighting}. Mood: ${f.mood}. Audio: ${f.audio}.`;
}

/**
 * POST /api/generate/suggest-brief — "Roll the dice". Returns one on-brand
 * brief the user can drop into the Brief field. Uses Gemini 3 Pro with the
 * project's description so each suggestion is actually on-brand.
 */
export function useSuggestBrief() {
  return useMutation({
    mutationFn: async (input: {
      project: ProjectSlug;
      target: "image" | "video" | "pipeline";
      ratio: string;
    }) => {
      const res = await fetch("/api/generate/suggest-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as { suggestion: string };
    },
  });
}

/**
 * POST /api/generate/prompt — brief → structured fields (AI fills what each
 * model needs; user edits any field before assembling).
 */
export function useGeneratePromptBlueprint() {
  return useMutation({
    mutationFn: async (input: {
      project: ProjectSlug;
      target: "image" | "video";
      ratio: string;
      brief: string;
    }) => {
      const res = await fetch("/api/generate/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as {
        fields: ImagePromptFields | VideoPromptFields;
        estimatedCost: number;
      };
    },
  });
}

/**
 * POST /api/library/upload — user-provided image or video file.
 */
export function useUploadToLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      project: ProjectSlug;
      type: "image" | "video";
      ratio: ImageRatio | VideoRatio;
      prompt?: string;
    }) => {
      const form = new FormData();
      form.append("file", input.file);
      form.append("project", input.project);
      form.append("type", input.type);
      form.append("ratio", input.ratio);
      if (input.prompt) form.append("prompt", input.prompt);

      const res = await fetch("/api/library/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as {
        generationId: string;
        outputUrl: string;
        filename: string;
        project: ProjectSlug;
        type: "image" | "video";
        ratio: ImageRatio | VideoRatio;
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });
}

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
 *
 * `firstFrameUrl` handles the "use the stage-2 image as the first frame"
 * pipeline path. Mutually exclusive with `referenceImages`.
 */
export function useGenerateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project: ProjectSlug;
      ratio: VideoRatio;
      prompt: string;
      durationSeconds?: 4 | 6 | 8;
      firstFrameUrl?: string;
      referenceImages?: ReferenceImageInput[];
      /** If set, Veo extends from this existing video's last frame. */
      sourceGenerationId?: string;
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
