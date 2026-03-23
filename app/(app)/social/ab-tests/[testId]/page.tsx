"use client";

import { use } from "react";
import { useAbTest, useAbTestAction } from "@/hooks/useAbTests";
import { formatStatus } from "@/lib/format";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, XCircle, Trophy, FlaskConical, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600",
  running: "bg-green-500/10 text-green-600",
  paused: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-blue-500/10 text-blue-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export default function ABTestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params);
  const { data: test, isLoading } = useAbTest(testId);
  const action = useAbTestAction();

  const handleAction = async (act: "start" | "pause" | "cancel") => {
    try {
      await action.mutateAsync({ testId, action: act });
      toast.success(`Test ${act === "start" ? "started" : act === "pause" ? "paused" : "cancelled"}`);
    } catch { toast.error(`Failed to ${act} test`); }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="A/B Test" />
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  if (!test) {
    return (
      <>
        <AppHeader title="A/B Test" />
        <div className="flex-1 p-4 lg:p-6">
          <Card><CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Test not found</p>
            <Button asChild variant="outline" className="mt-4"><Link href="/social/ab-tests">Back to Tests</Link></Button>
          </CardContent></Card>
        </div>
      </>
    );
  }

  const variants = test.mkt_ab_test_variants ?? [];

  return (
    <>
      <AppHeader title="A/B Test Detail" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/social/ab-tests"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{test.name}</h2>
              <Badge className={STATUS_COLORS[test.status] ?? ""}>{test.status}</Badge>
            </div>
            {test.hypothesis && <p className="text-sm text-muted-foreground">{test.hypothesis}</p>}
          </div>
          <div className="flex gap-2">
            {test.status === "draft" && (
              <Button onClick={() => handleAction("start")} disabled={action.isPending}>
                <Play className="h-4 w-4 mr-1" /> Start
              </Button>
            )}
            {test.status === "running" && (
              <Button variant="outline" onClick={() => handleAction("pause")} disabled={action.isPending}>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </Button>
            )}
            {(test.status === "running" || test.status === "paused") && (
              <Button variant="destructive" onClick={() => handleAction("cancel")} disabled={action.isPending}>
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Config */}
        <Card>
          <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <div><span className="text-muted-foreground">Success Metric</span><p className="font-medium">{formatStatus(test.success_metric ?? "")}</p></div>
              <div><span className="text-muted-foreground">Confidence</span><p className="font-medium">{((test.confidence_level ?? 0.95) * 100).toFixed(0)}%</p></div>
              <div><span className="text-muted-foreground">Strategy</span><p className="font-medium">{formatStatus(test.allocation_strategy ?? "")}</p></div>
              <div><span className="text-muted-foreground">Max Duration</span><p className="font-medium">{test.max_duration_days} days</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Winner Banner */}
        {test.winner_variant && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <Trophy className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Winner: Variant {test.winner_variant}</p>
                {test.significance_p_value != null && (
                  <p className="text-sm text-muted-foreground">p-value: {test.significance_p_value.toFixed(4)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variants */}
        <div>
          <h3 className="font-medium mb-3">Variants ({variants.length})</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {variants.map((v: { id: string; label: string; strategy_type: string | null; allocation_pct: number; total_impressions: number; total_clicks: number; engagement_rate: number; is_winner: boolean }) => (
              <Card key={v.id} className={v.is_winner ? "border-green-500/50" : ""}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Variant {v.label}</span>
                      {v.is_winner && <Badge className="bg-green-500/10 text-green-600 text-xs">Winner</Badge>}
                    </div>
                    {v.strategy_type && <Badge variant="outline" className="text-xs capitalize">{v.strategy_type}</Badge>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Allocation</span>
                      <span>{(v.allocation_pct * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={v.allocation_pct * 100} className="h-1.5" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="font-medium">{v.total_impressions}</p><p className="text-muted-foreground">Impressions</p></div>
                    <div><p className="font-medium">{v.total_clicks}</p><p className="text-muted-foreground">Clicks</p></div>
                    <div><p className="font-medium">{(v.engagement_rate * 100).toFixed(2)}%</p><p className="text-muted-foreground">Engagement</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
