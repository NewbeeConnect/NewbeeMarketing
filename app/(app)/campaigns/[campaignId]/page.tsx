"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCampaign } from "@/hooks/useCampaigns";
import { useProjects } from "@/hooks/useProjects";
import { useAdDeployments } from "@/hooks/useAdDeployments";
import { BudgetIndicator } from "@/components/campaigns/BudgetIndicator";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Film,
  ArrowRight,
  Megaphone,
  Globe,
  CalendarDays,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AdDeploymentStatus } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  paused: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  archived: "bg-muted text-muted-foreground",
};

const DEPLOYMENT_STATUS_COLORS: Record<AdDeploymentStatus, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  pending_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  paused: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: projects } = useProjects(campaignId);
  const { data: deployments } = useAdDeployments(campaignId);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Campaign" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <AppHeader title="Campaign" />
        <div className="p-6">
          <p className="text-muted-foreground">Campaign not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={campaign.name} />
      <div className="p-6 space-y-6">
        {/* Campaign Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{campaign.name}</CardTitle>
              <Badge className={STATUS_COLORS[campaign.status] || ""}>
                {campaign.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaign.description && (
              <p className="text-sm text-muted-foreground">
                {campaign.description}
              </p>
            )}
            {campaign.objective && (
              <p className="text-sm">
                <span className="font-medium">Objective:</span>{" "}
                {campaign.objective}
              </p>
            )}
            {campaign.budget_limit_usd && (
              <BudgetIndicator
                spent={campaign.current_spend_usd}
                limit={campaign.budget_limit_usd}
              />
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              {campaign.start_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Start: {new Date(campaign.start_date).toLocaleDateString()}
                </span>
              )}
              {campaign.end_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  End: {new Date(campaign.end_date).toLocaleDateString()}
                </span>
              )}
              <span>
                Updated{" "}
                {formatDistanceToNow(new Date(campaign.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Projects ({projects?.length ?? 0})
            </h3>
            <Button size="sm" asChild>
              <Link href={`/projects/new?campaign=${campaignId}`}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Project
              </Link>
            </Button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {project.title}
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Step {project.current_step}/6
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No projects in this campaign yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ad Deployments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Ad Deployments ({deployments?.length ?? 0})
            </h3>
            <Button size="sm" asChild>
              <Link href={`/campaigns/${campaignId}/publish`}>
                <Megaphone className="h-3.5 w-3.5 mr-1" />
                Publish Ads
              </Link>
            </Button>
          </div>

          {deployments && deployments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm capitalize">
                          {deployment.platform === "google"
                            ? "Google Ads"
                            : "Meta Ads"}
                        </span>
                      </div>
                      <Badge
                        className={
                          DEPLOYMENT_STATUS_COLORS[deployment.status] || ""
                        }
                      >
                        {deployment.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {deployment.budget_daily_usd && (
                        <span>${deployment.budget_daily_usd}/day</span>
                      )}
                      {deployment.budget_total_usd && (
                        <span>${deployment.budget_total_usd} total</span>
                      )}
                      <span>
                        {deployment.creative_urls.length} creative
                        {deployment.creative_urls.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {deployment.published_at && (
                      <p className="text-xs text-muted-foreground">
                        Published{" "}
                        {formatDistanceToNow(new Date(deployment.published_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  No ad deployments yet. Publish ads to start tracking
                  performance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
