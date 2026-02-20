"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BrandKit } from "@/types/database";
import type { BrandKitFormData } from "@/lib/validations";

const BRAND_KIT_KEY = ["brand-kit"];

export function useBrandKit() {
  const supabase = createClient();

  return useQuery({
    queryKey: BRAND_KIT_KEY,
    queryFn: async (): Promise<BrandKit | null> => {
      const { data, error } = await supabase
        .from("mkt_brand_kit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BrandKit | null;
    },
  });
}

export function useUpsertBrandKit() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string;
      data: BrandKitFormData;
    }): Promise<BrandKit> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (id) {
        const { data: updated, error } = await supabase
          .from("mkt_brand_kit")
          .update(data)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return updated as BrandKit;
      }

      const { data: created, error } = await supabase
        .from("mkt_brand_kit")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return created as BrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KIT_KEY });
    },
  });
}
