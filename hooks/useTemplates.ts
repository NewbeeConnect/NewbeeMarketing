"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Template, TemplateCategory } from "@/types/database";
import type { TemplateFormData } from "@/lib/validations";

const TEMPLATES_KEY = ["templates"];

export function useTemplates(category?: TemplateCategory) {
  const supabase = createClient();

  return useQuery({
    queryKey: category ? [...TEMPLATES_KEY, { category }] : TEMPLATES_KEY,
    queryFn: async (): Promise<Template[]> => {
      let query = supabase
        .from("mkt_templates")
        .select("*")
        .order("use_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });
}

export function useCreateTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: TemplateFormData): Promise<Template> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mkt_templates")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description ?? null,
          category: formData.category ?? "general",
          platform: formData.platform ?? null,
          style: formData.style ?? null,
          tone: formData.tone ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("mkt_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useCreateProjectFromTemplate() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<Template> => {
      // Increment use count
      const { data: template, error: fetchError } = await supabase
        .from("mkt_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (fetchError || !template) throw new Error("Template not found");

      const t = template as Template;
      await supabase
        .from("mkt_templates")
        .update({ use_count: t.use_count + 1 })
        .eq("id", templateId);

      return t;
    },
  });
}
