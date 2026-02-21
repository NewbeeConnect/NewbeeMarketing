"use client";

import { useAiInsights } from "@/hooks/useAiInsights";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";

const ICON_MAP = {
  success: CheckCircle,
  trend: TrendingUp,
  warning: AlertTriangle,
  info: Info,
} as const;

const COLOR_MAP = {
  success: "bg-green-50 text-green-700 border-green-200",
  trend: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  info: "bg-gray-50 text-gray-700 border-gray-200",
} as const;

export function AiInsightBadges() {
  const { data: insights, isLoading } = useAiInsights();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">AI Insights</h3>
      </div>
      {insights.map((insight, i) => {
        const Icon = ICON_MAP[insight.type] || Info;
        const colors = COLOR_MAP[insight.type] || COLOR_MAP.info;

        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg border p-3 ${colors}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{insight.message}</p>
            <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
              AI
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
