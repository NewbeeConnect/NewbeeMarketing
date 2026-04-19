/**
 * Project definitions. Hardcoded for now (2 clients); move to a DB table when
 * the third project arrives.
 *
 * The `slug` value is what lands in `mkt_generations.project_slug` and in the
 * storage path (`mkt-assets/{slug}/...`). It must match the CHECK constraint
 * in migration 015.
 */

export const PROJECTS = [
  {
    slug: "newbee",
    name: "Newbee",
    /** Display color for sidebar/badges. */
    color: "#FBBF24",
  },
  {
    slug: "ateliersayin",
    name: "Atelier Sayın",
    color: "#DC2626",
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
export const IMAGE_RATIOS = ["4:5", "9:16", "1:1"] as const;
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
