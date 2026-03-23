"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AutopilotConfig, AutopilotRun } from "@/types/database";

export function useAutopilotConfig() {
  return useQuery<AutopilotConfig | null>({
    queryKey: ["autopilot-config"],
    queryFn: async () => {
      const res = await fetch("/api/autopilot/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      return data.config;
    },
  });
}

export function useUpdateAutopilotConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<AutopilotConfig>) => {
      const res = await fetch("/api/autopilot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot-config"] }),
  });
}

export function useAutopilotRuns() {
  return useQuery<AutopilotRun[]>({
    queryKey: ["autopilot-runs"],
    queryFn: async () => {
      const res = await fetch("/api/autopilot/runs");
      if (!res.ok) throw new Error("Failed to fetch runs");
      const data = await res.json();
      return data.runs;
    },
  });
}

export function useTriggerAutopilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/autopilot/trigger", { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger autopilot");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot-runs"] }),
  });
}
