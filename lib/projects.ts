/**
 * Project definitions. Hardcoded for now (2 clients); move to a DB table when
 * the third project arrives.
 *
 * The `slug` value is what lands in `mkt_generations.project_slug` and in the
 * storage path (`mkt-assets/{slug}/...`). It must match the CHECK constraint
 * in migration 015.
 */

/**
 * `description` is used by the AI brief suggester and the prompt blueprint
 * endpoint so Gemini knows what each brand actually is. Keep these concrete —
 * vague descriptions produce vague briefs. Edit here when the product evolves.
 */
export const PROJECTS = [
  {
    slug: "newbee",
    name: "Newbee",
    color: "#FBBF24",
    description:
      "Newbee is an AI-powered mobile companion app (iOS + Android + Web, app.newbeeapp.com). It helps users with daily life tasks through an intelligent assistant — natural-language chat, goal tracking, habit support, and community features. Target audience: digitally-native adults 20–45 looking for a smart, approachable daily helper. Tone: warm, confident, modern, a little playful. Brand palette: honey yellow / amber / cream with clean white space. Reference look: Apple-style editorial product photography, soft daylight, crisp UI mockups on real phones.",
  },
  {
    slug: "ateliersayin",
    name: "Atelier Sayın",
    color: "#DC2626",
    description:
      "Atelier Sayın is a bespoke fine-jewelry atelier based in Istanbul specializing in gold and gemstones. Handcrafted statement pieces — necklaces, rings, earrings — with an editorial, heritage-craft sensibility. Target audience: discerning women 30–55 who value craftsmanship and gifting. Tone: elegant, intimate, timeless. Brand palette: deep burgundy, champagne gold, velvet black. Reference look: editorial fashion photography, macro detail shots, warm window light, silk and velvet textures.",
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
