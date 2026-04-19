"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type StoryRow = {
  id: string;
  user_id: string;
  topic: string;
  aspect_ratio: "9:16" | "16:9" | "1:1";
  duration_per_clip_seconds: 4 | 6 | 8;
  model_tier: "fast" | "standard";
  style_anchor: string | null;
  scene_scripts: Record<string, string>;
  frame_prompts: Record<string, string>;
  status: "draft" | "generating" | "ready" | "failed";
  stitched_generation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StoryGeneration = {
  id: string;
  story_role: "frame" | "clip" | "stitched";
  sequence_index: number;
  type: "image" | "video" | "stitched";
  status: "pending" | "processing" | "completed" | "failed";
  output_url: string | null;
  operation_name: string | null;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
};

export type StoryBundle = {
  story: StoryRow;
  frames: StoryGeneration[];
  clips: StoryGeneration[];
  stitched: StoryGeneration | null;
};

/**
 * Best-effort parser for API error responses. If the body is JSON with an
 * `error` field, uses that; otherwise truncates the text so users aren't
 * shown a full HTML 500 page.
 */
async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // not JSON — fall through
  }
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

export function useStory(storyId: string | null) {
  return useQuery<StoryBundle>({
    queryKey: ["story", storyId],
    enabled: !!storyId,
    queryFn: async () => {
      const res = await fetch(`/api/stories/${storyId}`);
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as StoryBundle;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const anyProcessing = [...data.frames, ...data.clips].some(
        (g) => g.status === "processing" || g.status === "pending"
      );
      return anyProcessing ? 8000 : false;
    },
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      topic: string;
      aspect_ratio: "9:16" | "16:9" | "1:1";
      duration_per_clip_seconds: 4 | 6 | 8;
      model_tier: "fast" | "standard";
    }) => {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as { story: StoryRow };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["story", data.story.id] });
    },
  });
}

export function useUpdateStory(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: {
      scene_scripts?: Record<string, string>;
      frame_prompts?: Record<string, string>;
      style_anchor?: string;
    }) => {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as { story: StoryRow };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["story", storyId] }),
  });
}

export function useGenerateFrame(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (index: number) => {
      const res = await fetch(`/api/stories/${storyId}/frames/${index}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["story", storyId] }),
  });
}

export function useGenerateClip(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (index: number) => {
      const res = await fetch(`/api/stories/${storyId}/clips/${index}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["story", storyId] }),
  });
}

export function useStitchStory(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/stories/${storyId}/stitch`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["story", storyId] }),
  });
}
