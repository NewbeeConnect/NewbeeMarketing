"use client";

import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DurationBarProps {
  totalSeconds: number;
  targetSeconds: number;
}

export function DurationBar({ totalSeconds, targetSeconds }: DurationBarProps) {
  const percentage = Math.min((totalSeconds / targetSeconds) * 100, 100);
  const isOver = totalSeconds > targetSeconds;
  const isClose = percentage >= 90 && percentage <= 110;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Total Duration</span>
          <span
            className={cn(
              "font-medium",
              isOver && "text-red-500",
              isClose && !isOver && "text-green-500"
            )}
          >
            {totalSeconds}s / {targetSeconds}s
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            "h-2",
            isOver && "[&>[role=progressbar]]:bg-red-500",
            isClose && !isOver && "[&>[role=progressbar]]:bg-green-500"
          )}
        />
      </div>
    </div>
  );
}
