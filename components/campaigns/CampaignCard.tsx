"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, DollarSign, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Campaign } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  paused: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  archived: "bg-muted text-muted-foreground",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const budgetPercentage =
    campaign.budget_limit_usd && campaign.budget_limit_usd > 0
      ? Math.min(
          100,
          (campaign.current_spend_usd / campaign.budget_limit_usd) * 100
        )
      : 0;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <Badge className={STATUS_COLORS[campaign.status] || ""}>
              {campaign.status}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Budget */}
          {campaign.budget_limit_usd && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Budget
                </span>
                <span>
                  ${campaign.current_spend_usd.toFixed(2)} / $
                  {campaign.budget_limit_usd.toFixed(0)}
                </span>
              </div>
              <Progress
                value={budgetPercentage}
                className={budgetPercentage > 90 ? "[&>div]:bg-red-500" : ""}
              />
            </div>
          )}

          {/* Dates & Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {campaign.start_date
                ? new Date(campaign.start_date).toLocaleDateString()
                : "No start date"}
            </div>
            <span>
              {formatDistanceToNow(new Date(campaign.updated_at), {
                addSuffix: true,
              })}
            </span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
