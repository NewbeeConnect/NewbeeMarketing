"use client";

import { useQuery } from "@tanstack/react-query";
import type { Trend } from "@/types/database";

export function useTrends(platform?: string, minScore?: number) {
  return useQuery<Trend[]>({
    queryKey: ["trends", platform, minScore],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.set("platform", platform);
      if (minScore) params.set("minScore", String(minScore));
      const res = await fetch(`/api/trends?${params}`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      const data = await res.json();
      return data.trends;
    },
  });
}
