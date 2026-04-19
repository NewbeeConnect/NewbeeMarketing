/**
 * Filename + storage-path strategy for library assets.
 *
 * Design goals:
 * - Sortable: timestamp prefix means `ls` / storage listing naturally orders
 *   newest-last (or newest-first, depending on direction).
 * - Readable: the slug is a human-recognizable hint from the prompt so the
 *   user can eyeball a folder and see what's inside.
 * - Collision-safe: the timestamp has second-level resolution; we add a short
 *   random suffix in case two generations happen in the same second.
 * - Portable: no colons (S3/GCS path issues), no spaces, ASCII-only.
 */

import { ratioToSlug, type AnyRatio, type ProjectSlug } from "./projects";

const MAX_SLUG_LEN = 60;

/**
 * Derive a filesystem-safe slug from a prompt. Keeps the first ~60 chars of
 * meaningful content, kebab-case, ASCII-only.
 *
 * Examples:
 *   "Annen için altın kolye reklamı"  →  "annen-icin-altin-kolye-reklami"
 *   ""                                 →  "untitled"
 *   "!@#$%"                            →  "untitled"
 */
export function slugifyPrompt(prompt: string): string {
  const normalized = prompt
    .toLowerCase()
    .normalize("NFKD")
    // strip combining marks (é → e, ş → s)
    .replace(/\p{Diacritic}/gu, "")
    // collapse any non-alphanum into a single hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  if (!normalized) return "untitled";
  return normalized.slice(0, MAX_SLUG_LEN).replace(/-+$/, "") || "untitled";
}

/**
 * Timestamp part of the filename. ISO-like but filesystem-safe
 * (colons swapped to hyphens).
 *
 * Example: "2026-04-19T14-23-00Z"
 */
export function timestampPart(date: Date = new Date()): string {
  return date.toISOString().replace(/:/g, "-").replace(/\.\d+/, "");
}

/**
 * Short random suffix to avoid collisions when two generations land in the
 * same second with the same prompt. 6 hex chars = 16M options.
 */
function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 8);
}

/**
 * Full filename for an asset.
 *
 * Examples:
 *   buildFilename({ prompt: "Gold necklace hero", type: "image", ts: ... })
 *     → "2026-04-19T14-23-00Z_gold-necklace-hero_a1b2c3.png"
 *   buildFilename({ prompt: "App launch teaser", type: "video", ts: ... })
 *     → "2026-04-19T14-30-12Z_app-launch-teaser_f4e5d6.mp4"
 */
export function buildFilename(input: {
  prompt: string;
  type: "image" | "video";
  date?: Date;
}): string {
  const ts = timestampPart(input.date ?? new Date());
  const slug = slugifyPrompt(input.prompt);
  const ext = input.type === "image" ? "png" : "mp4";
  return `${ts}_${slug}_${randomSuffix()}.${ext}`;
}

/**
 * Storage path relative to the `mkt-assets` bucket root.
 *
 * Example:
 *   buildStoragePath({ project: "newbee", type: "image", ratio: "9:16", filename: "..." })
 *     → "newbee/image/9-16/2026-04-19T14-23-00Z_hero_a1b2c3.png"
 */
export function buildStoragePath(input: {
  project: ProjectSlug;
  type: "image" | "video";
  ratio: AnyRatio;
  filename: string;
}): string {
  return `${input.project}/${input.type}/${ratioToSlug(input.ratio)}/${input.filename}`;
}
