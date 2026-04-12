"use client";

import { useSocialAccounts, useDisconnectAccount } from "@/hooks/useSocialAccounts";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Instagram, Youtube, Twitter, Linkedin, Facebook, Share2,
  Plus, Unplug, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500", description: "Reels, Stories, Feed Posts" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500", description: "Page Posts, Reels" },
  { id: "tiktok", name: "TikTok", icon: Share2, color: "text-gray-900 dark:text-white", description: "Short Videos" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500", description: "Shorts & Videos" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-blue-400", description: "Tweets with Media" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600", description: "Company Posts" },
];

export default function SocialAccountsPage() {
  const { data: accounts, isLoading } = useSocialAccounts();
  const disconnect = useDisconnectAccount();

  const connectedPlatforms = new Set(accounts?.filter(a => a.is_active).map(a => a.platform as string));

  const handleConnect = (platform: string) => {
    window.location.assign(`/api/social/auth/${platform}`);
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnect.mutateAsync(accountId);
      toast.success("Account disconnected");
    } catch { toast.error("Failed to disconnect"); }
  };

  return (
    <>
      <AppHeader title="Social Accounts" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to publish content directly
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const account = accounts?.find(a => a.platform === platform.id && a.is_active);
              const isConnected = connectedPlatforms.has(platform.id);

              return (
                <Card key={platform.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-6 w-6 ${platform.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{platform.name}</p>
                        {isConnected && (
                          <Badge variant="outline" className="text-green-600 border-green-500/30 text-xs">
                            Connected
                          </Badge>
                        )}
                      </div>
                      {isConnected && account ? (
                        <p className="text-sm text-muted-foreground truncate">{account.account_name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      )}
                    </div>
                    {isConnected && account ? (
                      <Button variant="outline" size="sm" onClick={() => handleDisconnect(account.id)} disabled={disconnect.isPending}>
                        <Unplug className="h-3.5 w-3.5 mr-1" /> Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(platform.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
