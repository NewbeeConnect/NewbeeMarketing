/**
 * Simple in-memory cache for AI responses to prevent duplicate Gemini calls.
 * Uses SHA-256 hash of prompt content as cache key.
 *
 * Usage:
 *   const cached = aiCache.get(promptText);
 *   if (cached) return cached; // skip AI call
 *   // ... call AI ...
 *   aiCache.set(promptText, result);
 */

import { createHash } from "crypto";

interface CacheEntry<T = unknown> {
  data: T;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

/** Cache TTL: 10 minutes */
const TTL_MS = 10 * 60 * 1000;

/** Max cache entries to prevent memory leak */
const MAX_ENTRIES = 200;

function hashKey(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function evictStale() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.createdAt > TTL_MS) {
      cache.delete(key);
    }
  }
  // If still over limit, evict oldest
  if (cache.size > MAX_ENTRIES) {
    const entries = [...cache.entries()].sort(
      (a, b) => a[1].createdAt - b[1].createdAt
    );
    const toDelete = entries.slice(0, cache.size - MAX_ENTRIES);
    for (const [key] of toDelete) {
      cache.delete(key);
    }
  }
}

export const aiCache = {
  get<T = unknown>(promptText: string): T | null {
    evictStale();
    const key = hashKey(promptText);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T = unknown>(promptText: string, data: T): void {
    evictStale();
    const key = hashKey(promptText);
    cache.set(key, { data, createdAt: Date.now() });
  },

  clear(): void {
    cache.clear();
  },

  get size(): number {
    return cache.size;
  },
};
