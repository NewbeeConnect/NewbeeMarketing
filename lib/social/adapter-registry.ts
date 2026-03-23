/**
 * Social Platform Adapter Registry
 *
 * Central registry mapping platform names to their adapter implementations.
 * Each adapter implements the SocialPlatformAdapter interface.
 *
 * Platform adapters will be added in Phase 2:
 * - instagram-adapter.ts
 * - facebook-adapter.ts
 * - tiktok-adapter.ts
 * - youtube-adapter.ts
 * - twitter-adapter.ts
 * - linkedin-adapter.ts
 */

import type { SocialPlatform, SocialPlatformAdapter } from "./types";

const adapterMap = new Map<SocialPlatform, SocialPlatformAdapter>();

/**
 * Register a platform adapter. Called once per adapter at module load time.
 */
export function registerAdapter(adapter: SocialPlatformAdapter): void {
  adapterMap.set(adapter.platform, adapter);
}

/**
 * Get the adapter for a given platform.
 * Throws if the platform adapter hasn't been registered yet.
 */
export function getAdapter(platform: SocialPlatform): SocialPlatformAdapter {
  const adapter = adapterMap.get(platform);
  if (!adapter) {
    throw new Error(
      `[AdapterRegistry] No adapter registered for platform "${platform}". ` +
      `Available: ${[...adapterMap.keys()].join(", ") || "none"}`
    );
  }
  return adapter;
}

/**
 * Check if a platform adapter is registered.
 */
export function hasAdapter(platform: SocialPlatform): boolean {
  return adapterMap.has(platform);
}

/**
 * Get all registered platform names.
 */
export function getRegisteredPlatforms(): SocialPlatform[] {
  return [...adapterMap.keys()];
}
