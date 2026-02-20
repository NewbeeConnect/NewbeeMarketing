"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  DollarSign,
  Video,
  Image as ImageIcon,
  Mic,
  Zap,
  Film,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { TOTAL_CREDIT_USD, BUDGET_THRESHOLDS } from "@/lib/constants";

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  const totalSpent = data?.totalSpent ?? 0;
  const remaining = TOTAL_CREDIT_USD - totalSpent;
  const budgetPercentage = (totalSpent / TOTAL_CREDIT_USD) * 100;

  // Budget alert level
  const alertLevel = BUDGET_THRESHOLDS.reduce<number | null>((level, threshold) => {
    if (budgetPercentage / 100 >= threshold) return threshold;
    return level;
  }, null);

  const budgetColor =
    alertLevel === 0.95
      ? "text-red-600"
      : alertLevel === 0.9
        ? "text-orange-600"
        : alertLevel === 0.75
          ? "text-yellow-600"
          : "text-green-600";

  const progressColor =
    alertLevel === 0.95
      ? "[&>div]:bg-red-500"
      : alertLevel === 0.9
        ? "[&>div]:bg-orange-500"
        : alertLevel === 0.75
          ? "[&>div]:bg-yellow-500"
          : "";

  if (isLoading) {
    return (
      <>
        <AppHeader title="Analytics" />
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  const stats = data?.generationStats ?? {
    total: 0,
    completed: 0,
    failed: 0,
    videoCount: 0,
    imageCount: 0,
    voiceoverCount: 0,
  };
  const successRate =
    stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0";

  return (
    <>
      <AppHeader title="Analytics" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track API usage, costs, and generation performance
          </p>
        </div>

        {/* Budget Alert */}
        {alertLevel && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              alertLevel === 0.95
                ? "bg-red-50 border-red-200 text-red-800"
                : alertLevel === 0.9
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Budget Alert: {(alertLevel * 100).toFixed(0)}% threshold reached
              </p>
              <p className="text-xs opacity-80">
                You have used ${totalSpent.toFixed(2)} of your $
                {TOTAL_CREDIT_USD.toLocaleString()} budget.
                {alertLevel === 0.95 && " Consider pausing non-essential generations."}
              </p>
            </div>
          </div>
        )}

        {/* Budget Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Google Cloud Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-bold text-lg">
                ${TOTAL_CREDIT_USD.toLocaleString()}
              </span>
            </div>
            <Progress
              value={budgetPercentage}
              className={`h-3 ${progressColor}`}
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-lg font-bold ${budgetColor}`}>
                  ${totalSpent.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  ${remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {budgetPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <div className="grid gap-4 md:grid-cols-4">
          <CostCard
            title="Gemini (AI)"
            cost={data?.costByService.gemini ?? 0}
            description="Strategy + Scripts + Captions"
            icon={Zap}
          />
          <CostCard
            title="Veo 3.1"
            cost={data?.costByService.veo ?? 0}
            description="Video Generation"
            icon={Video}
          />
          <CostCard
            title="Imagen 4"
            cost={data?.costByService.imagen ?? 0}
            description="Image Generation"
            icon={ImageIcon}
          />
          <CostCard
            title="Cloud TTS"
            cost={data?.costByService.tts ?? 0}
            description="Voiceovers"
            icon={Mic}
          />
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Generation Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Generation Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.total > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completed}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.failed}
                      </p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Success Rate</span>
                      <span className="font-medium">{successRate}%</span>
                    </div>
                    <Progress
                      value={Number(successRate)}
                      className={
                        Number(successRate) > 80
                          ? "[&>div]:bg-green-500"
                          : Number(successRate) > 50
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-red-500"
                      }
                    />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5 text-muted-foreground" />
                      {stats.videoCount} videos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {stats.imageCount} images
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                      {stats.voiceoverCount} voiceovers
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Generation statistics will appear after your first video
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="h-4 w-4" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Film className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{data?.projectCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Megaphone className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{data?.campaignCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
              </div>

              {/* Monthly Spend Chart */}
              {data?.monthlySpend && data.monthlySpend.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Monthly Spend
                  </p>
                  <div className="space-y-1.5">
                    {data.monthlySpend.slice(-6).map((item) => {
                      const maxSpend = Math.max(
                        ...data.monthlySpend.map((s) => s.amount)
                      );
                      const barWidth =
                        maxSpend > 0 ? (item.amount / maxSpend) * 100 : 0;
                      return (
                        <div key={item.month} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">
                            {item.month}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-16 text-right">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function CostCard({
  title,
  cost,
  description,
  icon: Icon,
}: {
  title: string;
  cost: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${cost.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
