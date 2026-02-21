"use client";

import { useQuery } from "@tanstack/react-query";

export type AiInsight = {
  type: "success" | "trend" | "warning" | "info";
  message: string;
};

export function useAiInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async (): Promise<AiInsight[]> => {
      const res = await fetch("/api/ai/insights");
      if (!res.ok) {
        throw new Error("Failed to fetch insights");
      }
      const data = await res.json();
      return data.insights ?? [];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 120, // Keep in cache for 2 hours
    retry: 1,
  });
}
