"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCampaign } from "@/hooks/useCampaigns";
import { useProjects } from "@/hooks/useProjects";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { BudgetIndicator } from "@/components/campaigns/BudgetIndicator";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Film, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: projects } = useProjects(campaignId);

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
              <Badge>{campaign.status}</Badge>
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
                <span>
                  Start: {new Date(campaign.start_date).toLocaleDateString()}
                </span>
              )}
              {campaign.end_date && (
                <span>
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
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                >
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
                          {project.status.replace("_", " ")}
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
      </div>
    </>
  );
}
