"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ABTest } from "@/types/database";

export function useAbTests() {
  return useQuery<ABTest[]>({
    queryKey: ["ab-tests"],
    queryFn: async () => {
      const res = await fetch("/api/social/ab-tests");
      if (!res.ok) throw new Error("Failed to fetch A/B tests");
      const data = await res.json();
      return data.tests;
    },
  });
}

export function useAbTest(testId: string) {
  return useQuery({
    queryKey: ["ab-tests", testId],
    queryFn: async () => {
      const res = await fetch(`/api/social/ab-tests/${testId}`);
      if (!res.ok) throw new Error("Failed to fetch test");
      const data = await res.json();
      return data.test;
    },
    enabled: !!testId,
  });
}

export function useCreateAbTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; hypothesis?: string; variant_count?: number; success_metric?: string }) => {
      const res = await fetch("/api/social/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create test");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ab-tests"] }),
  });
}

export function useAbTestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ testId, action }: { testId: string; action: "start" | "pause" | "cancel" }) => {
      const res = await fetch(`/api/social/ab-tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} test`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ab-tests"] }),
  });
}
