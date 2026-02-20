"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Caption } from "@/types/database";

export function captionsKey(projectId: string) {
  return ["captions", projectId];
}

export function useCaptions(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: captionsKey(projectId),
    queryFn: async (): Promise<Caption[]> => {
      // Fetch captions through generation records
      const { data: generations, error: genError } = await supabase
        .from("mkt_generations")
        .select("id")
        .eq("project_id", projectId)
        .eq("type", "video")
        .eq("status", "completed");

      if (genError || !generations?.length) return [];

      const genIds = (generations as { id: string }[]).map((g) => g.id);
      const { data, error } = await supabase
        .from("mkt_captions")
        .select("*")
        .in("generation_id", genIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Caption[];
    },
    enabled: !!projectId,
  });
}

export function useGenerateCaptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      language,
      generationId,
    }: {
      projectId: string;
      language: string;
      generationId?: string;
    }) => {
      const response = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, language, generationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate captions");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: captionsKey(variables.projectId),
      });
    },
  });
}

export function useUpdateCaption() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      captionId,
      srtContent,
    }: {
      captionId: string;
      srtContent: string;
      projectId: string;
    }) => {
      const { data, error } = await supabase
        .from("mkt_captions")
        .update({ srt_content: srtContent })
        .eq("id", captionId)
        .select()
        .single();

      if (error) throw error;
      return data as Caption;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: captionsKey(variables.projectId),
      });
    },
  });
}
