"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SocialAccount } from "@/types/database";

export function useSocialAccounts() {
  return useQuery<SocialAccount[]>({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      return data.accounts;
    },
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch("/api/social/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });
}
