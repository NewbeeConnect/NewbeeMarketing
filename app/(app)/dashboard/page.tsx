"use client";

import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProjects } from "@/hooks/useProjects";
import { useCampaigns } from "@/hooks/useCampaigns";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AiInsightBadges } from "@/components/dashboard/AiInsightBadges";
import {
  Film,
  Megaphone,
  Video,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  DollarSign,
  Settings,
} from "lucide-react";
import { TOTAL_CREDIT_USD, WORKFLOW_STEPS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: campaigns } = useCampaigns();
  const { data: recentProjects, isLoading: projectsLoading } = useProjects();

  const totalSpent = analytics?.totalSpent ?? 0;
  const budgetPercentage = (totalSpent / TOTAL_CREDIT_USD) * 100;
  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const genStats = analytics?.generationStats;

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        {analyticsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={String(analytics?.projectCount ?? 0)}
              description="Across all campaigns"
              icon={Film}
            />
            <StatCard
              title="Active Campaigns"
              value={String(activeCampaigns)}
              description="Currently running"
              icon={Megaphone}
            />
            <StatCard
              title="Videos Generated"
              value={String(genStats?.videoCount ?? 0)}
              description="Using Veo 3.1"
              icon={Video}
            />
            <StatCard
              title="Images Generated"
              value={String(genStats?.imageCount ?? 0)}
              description="Using Imagen 4"
              icon={ImageIcon}
            />
          </div>
        )}

        {/* Budget + Quick Actions Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Google Cloud Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">
                  ${totalSpent.toFixed(2)} / $
                  {TOTAL_CREDIT_USD.toLocaleString()}
                </span>
              </div>
              <Progress
                value={budgetPercentage}
                className={`h-2 ${budgetPercentage > 90 ? "[&>div]:bg-red-500" : budgetPercentage > 75 ? "[&>div]:bg-yellow-500" : ""}`}
              />
              <p className="text-xs text-muted-foreground">
                ${(TOTAL_CREDIT_USD - totalSpent).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                remaining
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Video Project
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/campaigns/new">
                  <Megaphone className="h-4 w-4 mr-2" />
                  New Campaign
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/brand">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Set Up Brand Kit
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Ad API Keys
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <AiInsightBadges />
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentProjects && recentProjects.length > 0 ? (
              <div className="space-y-2">
                {recentProjects.slice(0, 5).map((project) => {
                  const stepLabel =
                    WORKFLOW_STEPS.find((s) => s.number === project.current_step)
                      ?.label ?? "Brief";
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(project.updated_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {project.current_step}: {stepLabel}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Film className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  No projects yet. Create your first marketing video!
                </p>
                <Button asChild size="sm">
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Project
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
