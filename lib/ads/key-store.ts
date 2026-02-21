/**
 * Ad Platform Key Store
 *
 * Reads and writes platform API keys from the mkt_api_keys table in Supabase.
 * Keys are stored as JSONB in the `keys_encrypted` column.
 *
 * NOTE: "keys_encrypted" is a column name convention - actual encryption
 * should be handled at the Supabase / database level (e.g. pgsodium).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GoogleAdsKeys, MetaAdsKeys } from "./types";

type ServiceClient = SupabaseClient<Database>;
type PlatformSlug = "google_ads" | "meta_ads";

/**
 * Retrieve a user's stored API keys for the given ad platform.
 *
 * @returns The parsed keys object, or null if no keys exist for this user/platform.
 */
export async function getUserAdKeys<
  T extends GoogleAdsKeys | MetaAdsKeys = GoogleAdsKeys | MetaAdsKeys,
>(
  serviceClient: ServiceClient,
  userId: string,
  platform: PlatformSlug
): Promise<T | null> {
  const { data, error } = await serviceClient
    .from("mkt_api_keys")
    .select("keys_encrypted, is_valid")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();

  if (error) {
    console.error(`[KeyStore] Failed to fetch ${platform} keys for user ${userId}:`, error);
    return null;
  }

  if (!data || !data.keys_encrypted) {
    return null;
  }

  // keys_encrypted is stored as JSONB and comes back as a parsed object
  return data.keys_encrypted as unknown as T;
}

/**
 * Insert or update a user's API keys for the given ad platform.
 *
 * Uses Supabase upsert with a conflict on (user_id, platform) to ensure
 * only one row per user per platform.
 */
export async function saveUserAdKeys(
  serviceClient: ServiceClient,
  userId: string,
  platform: PlatformSlug,
  keys: GoogleAdsKeys | MetaAdsKeys
): Promise<{ success: boolean; error?: string }> {
  const { error } = await serviceClient
    .from("mkt_api_keys")
    .upsert(
      {
        user_id: userId,
        platform,
        keys_encrypted: keys as unknown as Database["public"]["Tables"]["mkt_api_keys"]["Insert"]["keys_encrypted"],
        is_valid: true,
        last_validated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

  if (error) {
    console.error(`[KeyStore] Failed to save ${platform} keys for user ${userId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
