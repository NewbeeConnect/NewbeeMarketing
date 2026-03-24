"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  category: string;
  language: string;
  topic: string | null;
  is_thread: boolean;
  thread_tweets: string[] | null;
  status: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed";
  tweet_id: string | null;
  tweet_url: string | null;
  error_message: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  generated_at: string;
}

interface ListResponse {
  data: Tweet[];
  meta: { total: number; limit: number; offset: number };
}

interface GenerateInput {
  category: string;
  language?: string;
  topic?: string;
  context?: string;
  count?: number;
  threadLength?: number;
}

export function useTweets(status?: string, category?: string) {
  return useQuery<ListResponse>({
    queryKey: ["tweets", status, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      const res = await fetch(`/api/twitter/list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tweets");
      return res.json();
    },
  });
}

export function useGenerateTweets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateInput) => {
      const res = await fetch("/api/twitter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
    },
  });
}

export function usePostTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tweetId?: string; text?: string; thread?: string[] }) => {
      const res = await fetch("/api/twitter/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Post failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
    },
  });
}

export function useScheduleTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tweetId: string; action: "approve" | "schedule" | "draft"; scheduledFor?: string }) => {
      const res = await fetch("/api/twitter/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Schedule failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
    },
  });
}

export function useReplySuggest() {
  return useMutation({
    mutationFn: async (input: { tweetText: string; tweetAuthor?: string; style?: string; language?: string }) => {
      const res = await fetch("/api/twitter/reply-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate reply");
      }
      return res.json() as Promise<{ data: string[] }>;
    },
  });
}

export function useSendReply() {
  return useMutation({
    mutationFn: async (input: { tweetUrl: string; replyText: string }) => {
      const res = await fetch("/api/twitter/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to send reply");
      }
      return res.json() as Promise<{ data: { replyId: string; replyUrl: string; inReplyTo: string } }>;
    },
  });
}

export function useDeleteTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { tweetId: string; deleteFromX?: boolean }) => {
      const res = await fetch("/api/twitter/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Delete failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
    },
  });
}
