"use client";

import { Check } from "lucide-react";
import type { Intent, Phase } from "@/lib/generate/machine";
import {
  stepCountFor,
  stepIndexFor,
} from "@/lib/generate/machine";

/**
 * Tiny horizontal stepper — 2 dots for image/video intents, 3 for pipeline.
 * A dot is "completed" if the current step passed it, "active" if we're on it,
 * and "future" otherwise.
 */
export function Stepper({
  intent,
  phase,
}: {
  intent: Intent;
  phase: Phase;
}) {
  const count = stepCountFor(intent);
  const current = stepIndexFor(intent, phase);

  const labels: string[] =
    intent === "pipeline"
      ? ["Describe", "Image", "Video"]
      : intent === "video"
      ? ["Describe", "Video"]
      : ["Describe", "Image"];

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = phase === "done" || stepNum < current;
        const isActive = stepNum === current && phase !== "done";
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 ${
                isActive
                  ? "text-primary font-semibold"
                  : isDone
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isDone
                    ? "bg-green-600 text-white"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-2.5 w-2.5" /> : stepNum}
              </span>
              <span className="text-xs">{labels[i]}</span>
            </div>
            {i < count - 1 && (
              <div
                className={`h-px w-6 ${
                  stepNum < current ? "bg-green-600" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
