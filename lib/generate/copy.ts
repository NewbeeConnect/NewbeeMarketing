/**
 * All English microcopy for /generate lives here so designers / PMs can tune
 * wording in one place without touching component logic.
 */

import type { Intent } from "./machine";

export const COPY = {
  pageTitle: "Generate",
  pageSubtitle: "Pick what you want to make, then follow the steps.",

  intentPicker: {
    heading: "What do you want to make?",
    sub: "We'll only ask for what each model needs for the best result.",
  },

  intentCards: {
    image: {
      title: "Image",
      tagline: "One polished still — for an ad, a social post, a catalogue.",
      time: "~30s",
    },
    video: {
      title: "Video",
      tagline: "A short cinematic clip from a brief or a reference image.",
      time: "~2–3 min",
    },
    pipeline: {
      title: "Image → Video",
      tagline: "Generate a still, then animate it. Most controlled output.",
      time: "~3–4 min",
    },
  } satisfies Record<Intent, { title: string; tagline: string; time: string }>,

  change: {
    pillButton: "Change",
    confirmTitle: "Discard this work?",
    confirmBody: "Your brief, blueprint, and any generated asset on this page will be cleared.",
    confirmAction: "Yes, start over",
    confirmCancel: "Keep editing",
  },

  brief: {
    heading: "Step 1 — Describe",
    sub: "Write a short brief. Gemini fills the exact fields each model needs; you can edit anything.",
    label: "Brief",
    draftButton: "Draft with Gemini",
    drafting: "Drafting…",
    needBrief: "Write a brief first, then Gemini can draft the blueprint.",
    rollDiceButton: "Not sure? Roll the dice",
    rollingDice: "Thinking…",
  },

  /**
   * Project-aware brief placeholders. Default project in the UI is Newbee, so
   * these examples must match the brand the user sees selected.
   */
  briefPlaceholders: {
    newbee: {
      image:
        "e.g. Hero shot of the Newbee app on a phone in a sunlit kitchen, warm honey palette, editorial product look",
      video:
        "e.g. Slow dolly onto a phone unlocking to the Newbee chat, amber highlights, upbeat ambient tone",
      pipeline:
        "e.g. 'Your daily Newbee' launch teaser — phone mockup hero frame, then gentle motion across the UI, honey/cream palette",
    },
    ateliersayin: {
      image:
        "e.g. Macro of a gold signet ring on burgundy velvet, editorial fashion photography, warm window light",
      video:
        "e.g. Slow dolly toward a candle-lit dinner scene where a gold necklace catches the light, rich palette",
      pipeline:
        "e.g. Mother's Day film — close-up on a gift box opening to reveal a gold pendant, warm cinematic grade",
    },
  } as const,

  blueprint: {
    imageTitle: "Image blueprint",
    videoTitle: "Video blueprint",
    ready: "Ready",
    incomplete: "Fill every field",
    /**
     * One-liner sitting next to the "Blueprint" heading. It answers
     * the "what am I doing here?" question without hovering.
     */
    hint: "Each field shapes one part of the final prompt the model sees.",
  },

  imageStage: {
    heading: "Step — Image",
    subStandalone: "Generate with Nano Banana 2 or upload your own.",
    subPipeline: "This image becomes the first frame of your video.",
    aiCardTitle: "Generate with AI",
    aiCardBody: "Nano Banana 2 renders from the blueprint.",
    uploadCardTitle: "Upload my own",
    uploadCardBody: "PNG or JPG, up to 15 MB.",
    savedTo: (project: string, ratio: string) =>
      `Saved to ${project} / Image / ${ratio}`,
    redo: "Redo image",
    download: "Download",
  },

  videoStage: {
    heading: "Step — Video",
    sub: "Veo 3.1 renders the clip. Add reference images for subject consistency (optional).",
    durationLabel: "Duration",
    referenceLabel: "Reference images (optional, max 3)",
    referenceHint:
      "Product photos, brand logos, style references — up to 5 MB each.",
    aiCardTitle: "Generate with AI",
    aiCardBodyPipeline:
      "Veo 3.1 uses your image as the first frame and follows the video blueprint.",
    aiCardBodyStandalone:
      "Veo 3.1 follows the video blueprint; reference images optional.",
    uploadCardTitle: "Upload my own",
    uploadCardBody: "MP4 up to 200 MB.",
    rendering:
      "Veo is rendering… ~2–3 minutes. You can leave this page; the video shows up in the Library.",
    renderingFailed: "Veo failed",
    renderingTryAgain: "Try again",
    savedTo: (project: string, ratio: string) =>
      `Saved to ${project} / Video / ${ratio}`,
    redo: "Redo video",
    download: "Download",
  },

  postImageGate: {
    heading: "Happy with this image?",
    sub: "Continue to animate it, or save just the image and stop here.",
    continue: "Continue and animate it",
    stop: "Save just the image",
  },

  completion: {
    headingImage: "Image ready",
    headingVideo: "Video ready",
    headingPipeline: "Pipeline complete",
    variant: "Create another variant",
    variantHint: "Keeps your brief and blueprint; resets outputs.",
    library: "Open in Library",
    startOver: "Start over",
  },

  toasts: {
    ratioSwap: (oldR: string, newR: string, intent: string) =>
      `Ratio changed to ${newR} — ${oldR} isn't supported for ${intent}.`,
    imageSaved: (project: string, ratio: string) =>
      `Saved to ${project} / Image / ${ratio}`,
    videoStarted: (project: string, ratio: string) =>
      `Rendering video in ${project} / Video / ${ratio} (~2–3 min)`,
    briefNeeded: "Write a brief first.",
    blueprintIncomplete: "Fill every blueprint field first.",
    imageNeeded: "Image must be ready before generating the video.",
    intentSwitched: (label: string) =>
      `Switched to ${label} — brief and blueprint kept.`,
  },

  ratioPicker: {
    disabledHint: "Pick what you want to make first.",
    pipelineHint: "Image and video share this ratio so they line up.",
  },
} as const;
