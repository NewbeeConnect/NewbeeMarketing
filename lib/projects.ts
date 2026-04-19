/**
 * Project definitions. This hub is Newbee-only — the single-project setup
 * used to carry a second client (Atelier Sayın) but that was retired. We
 * keep the array shape + slug pipeline so API routes, storage paths, and
 * DB rows (`project_slug` column, `mkt-assets/{slug}/...` paths) continue
 * to work unchanged. Treat the constant as "this is who we make for."
 *
 * `description` is used by the AI brief suggester and the prompt blueprint
 * endpoint so Gemini knows what the brand actually is. Keep it concrete —
 * vague descriptions produce vague briefs.
 */
export const PROJECTS = [
  {
    slug: "newbee",
    name: "Newbee",
    color: "#FBBF24",
    description:
      "Newbee is an AI-powered mobile companion app (iOS + Android + Web, app.newbeeapp.com). It helps users with daily life tasks through an intelligent assistant — natural-language chat, goal tracking, habit support, and community features. Target audience: digitally-native adults 20–45 looking for a smart, approachable daily helper. Tone: warm, confident, modern, a little playful. Brand palette: honey yellow / amber / cream with clean white space. Reference look: Apple-style editorial product photography, soft daylight, crisp UI mockups on real phones.",
  },
] as const;

export type ProjectSlug = (typeof PROJECTS)[number]["slug"];

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug) as readonly ProjectSlug[];

export function isValidProjectSlug(v: string): v is ProjectSlug {
  return (PROJECT_SLUGS as readonly string[]).includes(v);
}

export function getProject(slug: ProjectSlug) {
  return PROJECTS.find((p) => p.slug === slug)!;
}

/**
 * Aspect ratios allowed per media type. Derived from what the underlying model
 * actually supports:
 * - Nano Banana 2 (gemini-3-pro-image-preview) accepts 4:5, 9:16, 1:1 (and
 *   many more — we restrict to these three to match folder layout).
 * - Veo 3.1 only supports 9:16 and 16:9 per SDK (no 4:5, no 1:1).
 */
// 16:9 is also in IMAGE_RATIOS because the 3-stage pipeline generates an
// image at the same ratio as the video, and Veo supports 16:9.
// The fixed library folder layout still shows only 4:5 / 9:16 / 1:1 for
// images — 16:9 images exist as pipeline intermediates and are sorted with
// the video they belong to.
export const IMAGE_RATIOS = ["4:5", "9:16", "1:1", "16:9"] as const;
export const VIDEO_RATIOS = ["9:16", "16:9"] as const;

export type ImageRatio = (typeof IMAGE_RATIOS)[number];
export type VideoRatio = (typeof VIDEO_RATIOS)[number];
export type AnyRatio = ImageRatio | VideoRatio;

export function isValidImageRatio(v: string): v is ImageRatio {
  return (IMAGE_RATIOS as readonly string[]).includes(v);
}

export function isValidVideoRatio(v: string): v is VideoRatio {
  return (VIDEO_RATIOS as readonly string[]).includes(v);
}

/**
 * Convert an aspect ratio string to a filesystem-safe folder name.
 * Storage paths can't contain colons on some object stores, so we swap `:` → `-`.
 */
export function ratioToSlug(ratio: AnyRatio): string {
  return ratio.replace(":", "-");
}
