"use client";

import Link from "next/link";
import { Plus, Megaphone, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
  return (
    <>
      <AppHeader title="Campaigns" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Campaign Manager</h2>
            <p className="text-sm text-muted-foreground">
              Organize your marketing efforts into campaigns with budget tracking
            </p>
          </div>
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create a campaign to group related video projects, track budgets,
              and compare A/B variants
            </p>
            <Button asChild>
              <Link href="/campaigns/new">
                <Plus className="h-4 w-4 mr-1" />
                Create Campaign
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
