"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ApiKey, ApiKeyPlatform } from "@/types/database";

const API_KEYS_KEY = ["api-keys"];

export function useApiKeys() {
  const supabase = createClient();

  return useQuery({
    queryKey: API_KEYS_KEY,
    queryFn: async (): Promise<ApiKey[]> => {
      const { data, error } = await supabase
        .from("mkt_api_keys")
        .select("*")
        .order("platform");

      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });
}

export function useSaveApiKeys() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      platform,
      keys,
    }: {
      platform: ApiKeyPlatform;
      keys: Record<string, string>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mkt_api_keys")
        .upsert(
          {
            user_id: user.id,
            platform,
            keys_encrypted: keys,
            is_valid: false,
            last_validated_at: null,
          },
          { onConflict: "user_id,platform" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as ApiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useDeleteApiKeys() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: ApiKeyPlatform) => {
      const { error } = await supabase
        .from("mkt_api_keys")
        .delete()
        .eq("platform", platform);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}
