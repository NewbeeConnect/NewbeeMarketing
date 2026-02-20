"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/types/database";
import type { CalendarEventFormData } from "@/lib/validations";

const CALENDAR_KEY = ["calendar"];

export function useCalendarEvents(month?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: month ? [...CALENDAR_KEY, month] : CALENDAR_KEY,
    queryFn: async (): Promise<CalendarEvent[]> => {
      let query = supabase
        .from("mkt_calendar_events")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (month) {
        // Filter by month: "2026-02" → range "2026-02-01" to "2026-02-28"
        const startDate = `${month}-01`;
        const [year, mon] = month.split("-").map(Number);
        const lastDay = new Date(year, mon, 0).getDate();
        const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
        query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useCreateCalendarEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CalendarEventFormData): Promise<CalendarEvent> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mkt_calendar_events")
        .insert({
          user_id: user.id,
          title: formData.title,
          project_id: formData.project_id ?? null,
          campaign_id: formData.campaign_id ?? null,
          platform: formData.platform ?? null,
          scheduled_date: formData.scheduled_date,
          status: formData.status ?? "planned",
          notes: formData.notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
    },
  });
}

export function useUpdateCalendarEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CalendarEventFormData>;
    }): Promise<CalendarEvent> => {
      const { data: updated, error } = await supabase
        .from("mkt_calendar_events")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
    },
  });
}

export function useDeleteCalendarEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("mkt_calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
    },
  });
}
