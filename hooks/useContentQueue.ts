"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContentQueueItem } from "@/types/database";

/**
 * Fetch queue item counts grouped by status in a single API call.
 * Use this instead of multiple useContentQueue(status) calls when you only need counts.
 */
export function useQueueStats() {
  return useQuery<Record<string, number>>({
    queryKey: ["content-queue-stats"],
    queryFn: async () => {
      const res = await fetch("/api/social/queue/stats");
      if (!res.ok) throw new Error("Failed to fetch queue stats");
      const data = await res.json();
      return data.counts;
    },
  });
}

export function useContentQueue(status?: string) {
  return useQuery<ContentQueueItem[]>({
    queryKey: ["content-queue", status],
    queryFn: async () => {
      const url = status ? `/api/social/queue?status=${status}` : "/api/social/queue";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch queue");
      const data = await res.json();
      return data.items;
    },
  });
}

export function useCreateQueueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      text_content: string;
      media_urls?: string[];
      media_type?: "video" | "image" | "carousel";
      hashtags?: string[];
      target_platforms: string[];
      campaign_id?: string;
      source?: string;
    }) => {
      const res = await fetch("/api/social/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create queue item");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-queue"] }),
  });
}

export function useApproveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, publishPlatforms }: { contentId: string; publishPlatforms?: string[] }) => {
      const res = await fetch(`/api/social/queue/${contentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishPlatforms }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-queue"] }),
  });
}

export function useRejectContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentId, decision, notes }: { contentId: string; decision: "rejected" | "revision"; notes?: string }) => {
      const res = await fetch(`/api/social/queue/${contentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-queue"] }),
  });
}

export function useBatchApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentIds, publishPlatforms }: { contentIds: string[]; publishPlatforms?: string[] }) => {
      const res = await fetch("/api/social/queue/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds, publishPlatforms }),
      });
      if (!res.ok) throw new Error("Failed to batch approve");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-queue"] }),
  });
}
