"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Generation } from "@/types/database";

interface GenerationQueueProps {
  generations: Generation[];
  totalExpected: number;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  queued: { icon: Clock, label: "Queued", color: "text-yellow-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500" },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500" },
} as const;

export function GenerationQueue({
  generations,
  totalExpected,
}: GenerationQueueProps) {
  const completed = generations.filter((g) => g.status === "completed").length;
  const failed = generations.filter((g) => g.status === "failed").length;
  const processing = generations.filter(
    (g) => g.status === "processing" || g.status === "queued"
  ).length;
  const pending = generations.filter((g) => g.status === "pending").length;
  const progress =
    totalExpected > 0
      ? Math.round(((completed + failed) / totalExpected) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Generation Queue</CardTitle>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <Badge variant="outline">{pending} pending</Badge>
            )}
            {processing > 0 && (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                {processing} processing
              </Badge>
            )}
            {completed > 0 && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                {completed} done
              </Badge>
            )}
            {failed > 0 && (
              <Badge variant="destructive">{failed} failed</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {completed + failed}/{totalExpected} ({progress}%)
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Individual Generations */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {generations.map((gen) => {
            const config = STATUS_CONFIG[gen.status];
            const Icon = config.icon;
            const genConfig = gen.config as {
              aspect_ratio?: string;
              duration_seconds?: number;
            } | null;

            return (
              <div
                key={gen.id}
                className="flex items-center gap-3 rounded-md border p-3 text-sm"
              >
                <Icon
                  className={`h-4 w-4 ${config.color} ${
                    gen.status === "processing" ? "animate-spin" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{gen.type}</span>
                    {gen.platform && (
                      <Badge variant="outline" className="text-xs">
                        {gen.platform}
                      </Badge>
                    )}
                    {gen.language && (
                      <Badge variant="outline" className="text-xs">
                        {gen.language.toUpperCase()}
                      </Badge>
                    )}
                    {genConfig?.aspect_ratio && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {genConfig.aspect_ratio}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {gen.prompt.substring(0, 80)}
                    {gen.prompt.length > 80 ? "..." : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  {gen.estimated_cost_usd && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ~${gen.estimated_cost_usd.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {generations.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No generations started yet. Configure the batch matrix and click
              &quot;Start Generation&quot;.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
