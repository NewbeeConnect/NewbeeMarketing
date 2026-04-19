"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectSlug, ImageRatio, VideoRatio } from "@/lib/projects";
import type { GenerationRow } from "./useGeneration";

export type LibraryFilter = {
  project?: ProjectSlug;
  type?: "image" | "video";
  ratio?: ImageRatio | VideoRatio;
};

export function useLibrary(filter: LibraryFilter = {}) {
  const params = new URLSearchParams();
  if (filter.project) params.set("project", filter.project);
  if (filter.type) params.set("type", filter.type);
  if (filter.ratio) params.set("ratio", filter.ratio);
  const qs = params.toString();

  return useQuery<GenerationRow[]>({
    queryKey: ["library", filter],
    queryFn: async () => {
      const res = await fetch(`/api/library${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(await readApiError(res));
      const data = (await res.json()) as { items: GenerationRow[] };
      return data.items;
    },
    refetchInterval: (query) => {
      const items = query.state.data ?? [];
      const hasInFlight = items.some(
        (g) => g.status === "pending" || g.status === "processing"
      );
      return hasInFlight ? 8000 : false;
    },
  });
}

export function useDeleteGeneration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (generationId: string) => {
      const res = await fetch(`/api/library/${generationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await readApiError(res));
      return (await res.json()) as { deleted: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
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
