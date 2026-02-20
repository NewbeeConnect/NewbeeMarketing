"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/types/database";

interface GalleryFilters {
  type?: "video" | "image" | "voiceover" | "stitched";
  platform?: string;
  language?: string;
  projectId?: string;
  campaignId?: string;
  search?: string;
}

export function useGallery(filters: GalleryFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["gallery", filters],
    queryFn: async (): Promise<Generation[]> => {
      let query = supabase
        .from("mkt_generations")
        .select("*")
        .eq("status", "completed")
        .not("output_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.platform) {
        query = query.eq("platform", filters.platform);
      }
      if (filters.language) {
        query = query.eq("language", filters.language);
      }
      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId);
      }
      if (filters.search) {
        query = query.ilike("prompt", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Generation[];
    },
  });
}
