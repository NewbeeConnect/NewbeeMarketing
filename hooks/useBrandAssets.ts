"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BrandAsset } from "@/types/database";

const BRAND_ASSETS_KEY = ["brand-assets"];

export function useBrandAssets(type?: "image" | "video" | "screenshot") {
  const supabase = createClient();

  return useQuery({
    queryKey: type ? [...BRAND_ASSETS_KEY, type] : BRAND_ASSETS_KEY,
    queryFn: async (): Promise<BrandAsset[]> => {
      let query = supabase
        .from("mkt_brand_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BrandAsset[];
    },
  });
}

export function useUploadBrandAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      brandKitId,
      file,
      name,
      type,
      tags,
    }: {
      brandKitId: string;
      file: File;
      name: string;
      type: "image" | "video" | "screenshot";
      tags?: string[];
    }): Promise<BrandAsset> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "png";
      const fileName = `brand/${user.id}/assets/${type}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("mkt-assets")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("mkt-assets")
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from("mkt_brand_assets")
        .insert({
          brand_kit_id: brandKitId,
          name,
          type,
          url: publicUrl.publicUrl,
          tags: tags ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BrandAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_ASSETS_KEY });
    },
  });
}

export function useDeleteBrandAsset() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from("mkt_brand_assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_ASSETS_KEY });
    },
  });
}
