"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampaigns, useDeleteCampaign } from "@/hooks/useCampaigns";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Megaphone,
  Search,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Campaign, CampaignStatus } from "@/types/database";

const STATUS_TABS: { value: CampaignStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  active: "bg-green-500/10 text-green-600 border-green-500/30",
  paused: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  archived: "bg-muted text-muted-foreground",
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = campaigns?.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const statusCounts = campaigns?.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCampaign.mutateAsync(deleteId);
      toast.success("Campaign deleted");
    } catch {
      toast.error("Failed to delete campaign");
    }
    setDeleteId(null);
  };

  return (
    <>
      <AppHeader title="Campaigns" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Campaign Manager</h2>
            <p className="text-sm text-muted-foreground">
              Organize your marketing efforts into campaigns with budget
              tracking
            </p>
          </div>
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {STATUS_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={
                      statusFilter === tab.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                    {tab.value !== "all" &&
                      statusCounts?.[tab.value] !== undefined && (
                        <Badge variant="secondary" className="ml-1.5 text-xs">
                          {statusCounts[tab.value]}
                        </Badge>
                      )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Campaign Grid */}
            {filtered && filtered.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((campaign) => (
                  <CampaignGridCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    No campaigns match your filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create a campaign to group related video projects, track
                budgets, and compare A/B variants
              </p>
              <Button asChild>
                <Link href="/campaigns/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and cannot be undone.
              Projects linked to this campaign will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CampaignGridCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link href={`/campaigns/${campaign.id}`} className="block">
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base line-clamp-1">
              {campaign.name}
            </CardTitle>
            <Badge className={STATUS_COLORS[campaign.status] || ""}>
              {campaign.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>
          )}

          {campaign.budget_limit_usd && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>
                ${campaign.current_spend_usd.toFixed(2)} / $
                {campaign.budget_limit_usd.toFixed(0)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {campaign.start_date
                ? new Date(campaign.start_date).toLocaleDateString("en-US")
                : "No start date"}
              {campaign.end_date && (
                <>
                  {" - "}
                  {new Date(campaign.end_date).toLocaleDateString("en-US")}
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(campaign.updated_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
