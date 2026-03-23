"use client";

import { useState, useMemo } from "react";
import { useSocialAnalytics } from "@/hooks/useSocialAnalytics";
import { formatStatus, formatNumber } from "@/lib/format";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, Eye, Heart, MessageSquare, Share2, MousePointer, TrendingUp,
} from "lucide-react";
import { PLATFORM_ICONS, PLATFORM_COLORS } from "@/lib/social/platform-icons";

const TIME_RANGES = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

export default function SocialAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSocialAnalytics(days);

  const totals = data?.platformTotals ?? {};

  const { allImpressions, allLikes, allComments, allShares, allClicks, totalPosts, avgEngagement } = useMemo(() => {
    const platforms = Object.values(totals);
    const impressions = platforms.reduce((s, p) => s + p.impressions, 0);
    const likes = platforms.reduce((s, p) => s + p.likes, 0);
    const comments = platforms.reduce((s, p) => s + p.comments, 0);
    const shares = platforms.reduce((s, p) => s + p.shares, 0);
    const clicks = platforms.reduce((s, p) => s + p.clicks, 0);
    const posts = platforms.reduce((s, p) => s + p.posts, 0);
    const engagement = posts > 0
      ? platforms.reduce((s, p) => s + p.avgEngagement * p.posts, 0) / posts
      : 0;

    return {
      allImpressions: impressions,
      allLikes: likes,
      allComments: comments,
      allShares: shares,
      allClicks: clicks,
      totalPosts: posts,
      avgEngagement: engagement,
    };
  }, [totals]);

  return (
    <>
      <AppHeader title="Social Analytics" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Social Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Cross-platform performance metrics
            </p>
          </div>
          <div className="flex gap-1">
            {TIME_RANGES.map((r) => (
              <Button key={r.value} variant={days === r.value ? "default" : "outline"} size="sm" onClick={() => setDays(r.value)}>
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" /><span className="text-xs">Impressions</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatNumber(allImpressions)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" /><span className="text-xs">Likes</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatNumber(allLikes)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" /><span className="text-xs">Comments</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatNumber(allComments)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Share2 className="h-4 w-4" /><span className="text-xs">Shares</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatNumber(allShares)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MousePointer className="h-4 w-4" /><span className="text-xs">Clicks</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatNumber(allClicks)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" /><span className="text-xs">Avg Engagement</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{(avgEngagement * 100).toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-Platform Breakdown */}
            <div>
              <h3 className="font-medium mb-3">Platform Breakdown</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(totals).map(([platform, stats]) => {
                  const Icon = PLATFORM_ICONS[platform] ?? Share2;
                  return (
                    <Card key={platform}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`h-5 w-5 ${PLATFORM_COLORS[platform] ?? ""}`} />
                          <span className="font-medium capitalize">{platform}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{stats.posts} posts</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground text-xs">Impressions</span><p className="font-medium">{formatNumber(stats.impressions)}</p></div>
                          <div><span className="text-muted-foreground text-xs">Reach</span><p className="font-medium">{formatNumber(stats.reach)}</p></div>
                          <div><span className="text-muted-foreground text-xs">Engagement</span><p className="font-medium">{(stats.avgEngagement * 100).toFixed(2)}%</p></div>
                          <div><span className="text-muted-foreground text-xs">Clicks</span><p className="font-medium">{formatNumber(stats.clicks)}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Queue Stats */}
            {data?.queueStats && Object.keys(data.queueStats).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(data.queueStats).map(([status, count]) => (
                      <div key={status} className="text-center">
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{formatStatus(status)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
