"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CodeContext } from "@/types/database";

const CODE_CONTEXTS_KEY = ["code-contexts"];

export function useCodeContexts() {
  const supabase = createClient();

  return useQuery({
    queryKey: CODE_CONTEXTS_KEY,
    queryFn: async (): Promise<CodeContext[]> => {
      const { data, error } = await supabase
        .from("mkt_code_contexts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as CodeContext[];
    },
  });
}

export function useUploadCodeContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }): Promise<CodeContext> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);

      const response = await fetch("/api/code-context/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload and analyze code");
      }

      const { codeContext } = await response.json();
      return codeContext as CodeContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODE_CONTEXTS_KEY });
    },
  });
}

export function useFetchGithubContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repoUrl: string): Promise<CodeContext> => {
      const response = await fetch("/api/code-context/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch and analyze repository");
      }

      const { codeContext } = await response.json();
      return codeContext as CodeContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODE_CONTEXTS_KEY });
    },
  });
}

export function useDeleteCodeContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/code-context/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete code context");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODE_CONTEXTS_KEY });
    },
  });
}
