"use client";

import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useProjects } from "@/hooks/useProjects";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useBrandKit } from "@/hooks/useBrandKit";
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
  Palette,
  CheckCircle,
} from "lucide-react";
import { TOTAL_CREDIT_USD, WORKFLOW_STEPS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@/types/database";
import type { BrandKit } from "@/types/database";

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

function SmartActionBanner({
  brandKit,
  projects,
}: {
  brandKit: BrandKit | null | undefined;
  projects: Project[] | undefined;
}) {
  const inProgressProject = projects?.find((p) => p.status !== "completed");
  const stepLabel =
    inProgressProject
      ? WORKFLOW_STEPS.find((s) => s.number === inProgressProject.current_step)
          ?.label ?? "Brief"
      : null;

  if (!brandKit) {
    return (
      <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Get started: Set up your Brand Kit</p>
            <p className="text-xs text-muted-foreground">
              Define your brand colors, fonts, and voice to generate on-brand content
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/brand">
            Set Up <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Film className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Create your first video project</p>
            <p className="text-xs text-muted-foreground">
              AI-powered video creation in 6 easy steps
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/projects/new">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create
          </Link>
        </Button>
      </div>
    );
  }

  if (inProgressProject) {
    const progressPercent = ((inProgressProject.current_step - 1) / 5) * 100;
    return (
      <div className="rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <Film className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              Continue: {inProgressProject.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPercent} className="h-1.5 flex-1 max-w-32" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Step {inProgressProject.current_step}: {stepLabel}
              </span>
            </div>
          </div>
        </div>
        <Button asChild size="sm" className="ml-3 shrink-0">
          <Link href={`/projects/${inProgressProject.id}`}>
            Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 p-3 flex items-center gap-3">
      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      <p className="text-sm text-muted-foreground">
        All projects completed. Ready to start a new one?
      </p>
      <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
        <Link href="/projects/new">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Project
        </Link>
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: campaigns } = useCampaigns();
  const { data: recentProjects, isLoading: projectsLoading } = useProjects();
  const { data: brandKit } = useBrandKit();

  const totalSpent = analytics?.totalSpent ?? 0;
  const budgetPercentage = (totalSpent / TOTAL_CREDIT_USD) * 100;
  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const genStats = analytics?.generationStats;

  const hasBrandKit = !!brandKit;
  const hasInProgressProject = recentProjects?.some((p) => p.status !== "completed");

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Smart Action Banner */}
        <SmartActionBanner brandKit={brandKit} projects={recentProjects} />

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
                <span className="font-medium" suppressHydrationWarning>
                  ${totalSpent.toFixed(2)} / $
                  {TOTAL_CREDIT_USD.toLocaleString("en-US")}
                </span>
              </div>
              <Progress
                value={budgetPercentage}
                className={`h-2 ${budgetPercentage > 90 ? "[&>div]:bg-red-500" : budgetPercentage > 75 ? "[&>div]:bg-yellow-500" : ""}`}
              />
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                ${(TOTAL_CREDIT_USD - totalSpent).toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                remaining
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions — context-aware */}
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
              {!hasBrandKit && (
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/brand">
                    <Palette className="h-4 w-4 mr-2" />
                    Set Up Brand Kit
                  </Link>
                </Button>
              )}
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
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
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
