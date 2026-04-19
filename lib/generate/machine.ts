/**
 * Intent-first state machine for the /generate page.
 *
 * Intent is the user's goal ("what do I want to make"). Phase is where we are
 * inside that intent's flow. Having two axes keeps the orchestrator small —
 * the rendering code is a single `switch(phase)` per intent, and transitions
 * are pure functions.
 */

import type {
  AnyRatio,
  ImageRatio,
  VideoRatio,
} from "@/lib/projects";
import { IMAGE_RATIOS, VIDEO_RATIOS } from "@/lib/projects";

export type Intent = "image" | "video" | "pipeline";

export type Phase =
  | "intent"      // intent not picked yet
  | "brief"       // write brief + blueprint(s)
  | "image"       // generate or upload image
  | "postImage"   // pipeline only — "continue or stop"
  | "video"       // generate or upload video
  | "done";       // completion card

/** First phase after an intent is chosen. */
export function initialPhaseFor(): Phase {
  return "brief";
}

/**
 * Given the current phase + intent, what comes next. Returning `null` means
 * we're already at the terminal phase for this intent.
 */
export function nextPhaseFor(intent: Intent, phase: Phase): Phase | null {
  if (intent === "image") {
    if (phase === "brief") return "image";
    if (phase === "image") return "done";
    return null;
  }
  if (intent === "video") {
    if (phase === "brief") return "video";
    if (phase === "video") return "done";
    return null;
  }
  // pipeline
  if (phase === "brief") return "image";
  if (phase === "image") return "postImage";
  if (phase === "postImage") return "video";
  if (phase === "video") return "done";
  return null;
}

/**
 * What the big primary CTA in the current phase should say + do. The
 * orchestrator binds `onClick` to the mutation or setPhase call — this helper
 * only owns labels and disabled state.
 */
export type PrimaryAction = {
  label: string;
  /** One of "generate-image" | "generate-video" | "continue" | "finish" — purely a hint. */
  kind: "generate-image" | "generate-video" | "continue" | "finish";
  disabled?: boolean;
};

export function primaryActionFor(
  intent: Intent,
  phase: Phase
): PrimaryAction | null {
  if (phase === "brief") {
    return {
      label: intent === "video" ? "Continue to video" : "Continue to image",
      kind: "continue",
    };
  }
  if (phase === "image") return { label: "Generate image", kind: "generate-image" };
  if (phase === "video") return { label: "Generate video", kind: "generate-video" };
  if (phase === "postImage") return { label: "Continue and animate it", kind: "continue" };
  if (phase === "done") return { label: "Create another variant", kind: "finish" };
  return null;
}

/**
 * Which ratios the aspect-ratio picker should offer for a given intent.
 * - Image: all four (4:5, 9:16, 1:1, 16:9) since Nano Banana 2 supports them.
 * - Video: only 9:16 / 16:9 (Veo 3.1 native).
 * - Pipeline: 9:16 / 16:9 (image + video must match).
 */
export function ratiosFor(intent: Intent): readonly AnyRatio[] {
  if (intent === "image") return IMAGE_RATIOS;
  return VIDEO_RATIOS;
}

/**
 * Pick a safe default when the user switches intent and the previously-picked
 * ratio is no longer valid.
 */
export function defaultRatioFor(intent: Intent): AnyRatio {
  if (intent === "image") return "9:16";
  return "9:16";
}

/**
 * Type guards — the generation mutations want narrow ratio types.
 */
export function asImageRatio(r: AnyRatio): ImageRatio {
  if ((IMAGE_RATIOS as readonly string[]).includes(r)) return r as ImageRatio;
  throw new Error(`Expected image ratio, got ${r}`);
}

export function asVideoRatio(r: AnyRatio): VideoRatio {
  if ((VIDEO_RATIOS as readonly string[]).includes(r)) return r as VideoRatio;
  throw new Error(`Expected video ratio, got ${r}`);
}

/** Human-friendly intent labels for stepper + pills. */
export function intentLabel(intent: Intent): string {
  if (intent === "image") return "Image";
  if (intent === "video") return "Video";
  return "Image → Video";
}

/** Step count in the stepper per intent. */
export function stepCountFor(intent: Intent): number {
  return intent === "pipeline" ? 3 : 2;
}

/** Which stepper step the current phase maps to (1-indexed). */
export function stepIndexFor(intent: Intent, phase: Phase): number {
  if (phase === "intent" || phase === "brief") return 1;
  if (phase === "image") return 2;
  if (phase === "postImage") return 2;
  if (phase === "video") return intent === "pipeline" ? 3 : 2;
  // done = final step
  return stepCountFor(intent);
}
