"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PromptTemplate } from "@/types/database";

export function usePromptTemplates() {
  return useQuery<PromptTemplate[]>({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const res = await fetch("/api/prompts/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      return data.templates;
    },
  });
}

export function useCreatePromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      template_text: string;
      platform?: string;
      content_format?: string;
      variables?: string[];
    }) => {
      const res = await fetch("/api/prompts/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompt-templates"] }),
  });
}
