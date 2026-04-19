/**
 * Timeline UX model for /generate. Replaces the single-active-phase pattern
 * with a stack where completed steps collapse to a summary (+ Edit button)
 * and stay on the page for easy scroll-back edits.
 *
 * Each step has three visual states:
 *   - "pending"   — hidden (future step not yet reachable)
 *   - "active"    — fully expanded, user is working on it
 *   - "completed" — collapsed summary with Edit button
 */

import type { Intent } from "./machine";

export type StepId =
  | "goal"       // intent + project + ratio (always step 1)
  | "brief"      // brief + blueprint + assets
  | "prompt"     // assembled prompt, editable
  | "image"      // image generation/upload/library pick
  | "postImage"  // pipeline only: continue or stop
  | "video"      // video generation/upload
  | "done";

export type StepVisual = "pending" | "active" | "completed";

/** Ordered list of steps shown for a given intent. */
export function stepsFor(intent: Intent | null): StepId[] {
  if (!intent) return ["goal"];
  if (intent === "image") return ["goal", "brief", "prompt", "image", "done"];
  if (intent === "video") return ["goal", "brief", "prompt", "video", "done"];
  return ["goal", "brief", "prompt", "image", "postImage", "video", "done"];
}

/** Human label for a step. */
export function stepLabel(step: StepId): string {
  switch (step) {
    case "goal":
      return "Goal";
    case "brief":
      return "Brief & blueprint";
    case "prompt":
      return "Prompt";
    case "image":
      return "Image";
    case "postImage":
      return "Continue?";
    case "video":
      return "Video";
    case "done":
      return "Done";
  }
}

/**
 * Given which steps are "reached" (user advanced past them) and the current
 * editing step, compute visual state for each step in order. A step is:
 *   - active     if it is the editingStep, OR it is the last reached step
 *                 that isn't complete
 *   - completed  if it is reached AND it's not currently active
 *   - pending    if it hasn't been reached yet
 */
export function computeVisuals(
  steps: StepId[],
  reached: Set<StepId>,
  activeStep: StepId
): Record<StepId, StepVisual> {
  const out: Partial<Record<StepId, StepVisual>> = {};
  for (const s of steps) {
    if (s === activeStep) out[s] = "active";
    else if (reached.has(s)) out[s] = "completed";
    else out[s] = "pending";
  }
  return out as Record<StepId, StepVisual>;
}
