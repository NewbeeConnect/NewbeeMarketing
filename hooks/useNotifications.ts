"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";

const NOTIFICATIONS_KEY = ["notifications"];

export function useNotifications() {
  const supabase = createClient();

  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("mkt_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

export function useUnreadCount() {
  const supabase = createClient();

  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("mkt_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 10000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("mkt_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("mkt_notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
