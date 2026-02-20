"use client";

import { Progress } from "@/components/ui/progress";
import { DollarSign, AlertTriangle } from "lucide-react";

interface BudgetIndicatorProps {
  spent: number;
  limit: number;
  showAlert?: boolean;
}

export function BudgetIndicator({
  spent,
  limit,
  showAlert = true,
}: BudgetIndicatorProps) {
  const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const isWarning = percentage >= 75;
  const isDanger = percentage >= 90;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          Budget Usage
        </span>
        <span className={isDanger ? "text-red-500 font-medium" : ""}>
          ${spent.toFixed(2)} / ${limit.toFixed(0)} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <Progress
        value={percentage}
        className={
          isDanger
            ? "[&>div]:bg-red-500"
            : isWarning
              ? "[&>div]:bg-yellow-500"
              : ""
        }
      />
      {showAlert && isDanger && (
        <div className="flex items-center gap-2 text-xs text-red-500">
          <AlertTriangle className="h-3 w-3" />
          Budget limit nearly reached!
        </div>
      )}
    </div>
  );
}
