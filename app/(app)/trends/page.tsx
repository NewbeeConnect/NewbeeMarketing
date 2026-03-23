"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrends } from "@/hooks/useTrends";
import { useCreateQueueItem } from "@/hooks/useContentQueue";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Hash, Music, Zap, Search, Sparkles, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_ICONS } from "@/lib/social/platform-icons";

const TREND_TYPE_ICONS: Record<string, typeof Hash> = {
  hashtag: Hash, topic: TrendingUp, sound: Music,
  challenge: Zap, keyword: Search,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-gray-500";
}

const PLATFORM_TABS = [
  { value: "all", label: "All" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X" },
  { value: "youtube", label: "YouTube" },
];

export default function TrendsPage() {
  const [platform, setPlatform] = useState<string>("all");
  const router = useRouter();
  const createQueue = useCreateQueueItem();
  const { data: trends, isLoading, isError } = useTrends(
    platform === "all" ? undefined : platform,
    0.3
  );

  const handleGenerateFromTrend = async (trendName: string, trendPlatform: string) => {
    try {
      await createQueue.mutateAsync({
        text_content: `[AI will generate] Content based on trending topic: ${trendName}`,
        target_platforms: [trendPlatform],
        hashtags: [trendName.startsWith("#") ? trendName : `#${trendName}`],
        source: "trend",
      });
      toast.success("Content queued for review based on trend");
      router.push("/social/queue");
    } catch {
      toast.error("Failed to generate content from trend");
    }
  };

  return (
    <>
      <AppHeader title="Trends" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Trend Explorer</h2>
          <p className="text-sm text-muted-foreground">
            Discover trending topics across platforms, scored by brand relevance
          </p>
        </div>

        {/* Platform Filter */}
        <div className="flex gap-1 flex-wrap">
          {PLATFORM_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={platform === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(tab.value)}
            >
              {tab.value !== "all" && (() => {
                const Icon = PLATFORM_ICONS[tab.value] ?? Share2;
                return <Icon className="h-3.5 w-3.5 mr-1" />;
              })()}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Trends Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="h-12 w-12 text-destructive mb-4" />
              <h3 className="font-medium mb-1">Failed to load trends</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Something went wrong while fetching trends. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : trends && trends.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trends.map((trend) => {
              const PlatformIcon = PLATFORM_ICONS[trend.platform] ?? Share2;
              const TypeIcon = TREND_TYPE_ICONS[trend.trend_type] ?? Hash;
              const score = Math.round(trend.composite_score * 100);
              const scoreColor = getScoreColor(score);

              return (
                <Card key={trend.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">{trend.name}</p>
                      </div>
                      <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {trend.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{trend.description}</p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Relevance Score</span>
                        <span className={`font-medium ${scoreColor}`}>{score}%</span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{trend.trend_type}</Badge>
                      {trend.volume && (
                        <Badge variant="secondary" className="text-xs">
                          {trend.volume > 1000000 ? `${(trend.volume / 1000000).toFixed(1)}M` : `${(trend.volume / 1000).toFixed(0)}K`} vol
                        </Badge>
                      )}
                      {trend.growth_rate && trend.growth_rate > 0 && (
                        <Badge variant="secondary" className="text-xs text-green-600">
                          +{trend.growth_rate.toFixed(0)}%
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={createQueue.isPending}
                      onClick={() => handleGenerateFromTrend(trend.name, trend.platform)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate Content
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No trends detected yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Trends are scanned every 6 hours. Connect social accounts to start tracking trends.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
