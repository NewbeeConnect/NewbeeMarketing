"use client";

import Link from "next/link";
import {
  Film,
  Megaphone,
  Video,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  DollarSign,
  Clock,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TOTAL_CREDIT_USD } from "@/lib/constants";

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
  // TODO: Replace with actual data from hooks
  const stats = {
    totalProjects: 0,
    activeCampaigns: 0,
    videosGenerated: 0,
    imagesGenerated: 0,
    totalSpent: 0,
  };

  const budgetPercentage = (stats.totalSpent / TOTAL_CREDIT_USD) * 100;

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={String(stats.totalProjects)}
            description="Across all campaigns"
            icon={Film}
          />
          <StatCard
            title="Active Campaigns"
            value={String(stats.activeCampaigns)}
            description="Currently running"
            icon={Megaphone}
          />
          <StatCard
            title="Videos Generated"
            value={String(stats.videosGenerated)}
            description="Using Veo 3.1"
            icon={Video}
          />
          <StatCard
            title="Images Generated"
            value={String(stats.imagesGenerated)}
            description="Using Imagen 4"
            icon={ImageIcon}
          />
        </div>

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
                  ${stats.totalSpent.toFixed(2)} / $
                  {TOTAL_CREDIT_USD.toLocaleString()}
                </span>
              </div>
              <Progress value={budgetPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                ${(TOTAL_CREDIT_USD - stats.totalSpent).toLocaleString()}{" "}
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
            </CardContent>
          </Card>
        </div>

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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
