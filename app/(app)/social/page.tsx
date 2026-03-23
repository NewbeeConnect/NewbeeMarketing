"use client";

import Link from "next/link";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useQueueStats } from "@/hooks/useContentQueue";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { PLATFORM_ICONS, PLATFORM_COLORS } from "@/lib/social/platform-icons";

export default function SocialHubPage() {
  const { data: accounts, isLoading: accountsLoading } = useSocialAccounts();
  const { data: queueStats } = useQueueStats();

  const connectedCount = accounts?.filter((a) => a.is_active).length ?? 0;
  const pendingCount = queueStats?.pending_review ?? 0;
  const publishedCount = queueStats?.published ?? 0;

  return (
    <>
      <AppHeader title="Social Hub" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Social Media Hub</h2>
            <p className="text-sm text-muted-foreground">
              Manage accounts, content queue, and publishing across all platforms
            </p>
          </div>
          <Button asChild>
            <Link href="/social/accounts">
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">of 6 platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{pendingCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">content items awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{publishedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">total published posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Connected Accounts</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/social/accounts">Manage <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {accountsLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(a => a.is_active).map((account) => {
                const Icon = PLATFORM_ICONS[account.platform] ?? Share2;
                return (
                  <Card key={account.id}>
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <Icon className={`h-5 w-5 ${PLATFORM_COLORS[account.platform] ?? ""}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-500/30 text-xs">
                        Connected
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Share2 className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No accounts connected</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Connect your social media accounts to start publishing content
                </p>
                <Button asChild>
                  <Link href="/social/accounts">
                    <Plus className="h-4 w-4 mr-1" /> Connect Account
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/social/queue">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Content Queue</p>
                  <p className="text-xs text-muted-foreground">{pendingCount} pending review</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/social/ab-tests">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <Share2 className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">A/B Tests</p>
                  <p className="text-xs text-muted-foreground">Multi-variant testing</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/social/analytics">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Social Analytics</p>
                  <p className="text-xs text-muted-foreground">Cross-platform metrics</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/trends">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <XCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Trending Now</p>
                  <p className="text-xs text-muted-foreground">Discover trends</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}
