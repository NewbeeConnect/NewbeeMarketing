"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCreateCampaign } from "@/hooks/useCampaigns";

export default function NewCampaignPage() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();
  const [form, setForm] = useState({
    name: "",
    description: "",
    objective: "",
    start_date: "",
    end_date: "",
    budget_limit_usd: "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        name: form.name,
        description: form.description || null,
        objective: form.objective || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget_limit_usd: form.budget_limit_usd
          ? parseFloat(form.budget_limit_usd)
          : null,
      });
      toast.success("Campaign created!");
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      );
    }
  };

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Campaigns", href: "/campaigns" }, { label: "New Campaign" }]} />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold">Create Campaign</h2>
          <p className="text-sm text-muted-foreground">
            Define your marketing campaign to organize projects, track budgets,
            and manage ad deployments.
          </p>
        </div>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 2026 User Acquisition"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Campaign goals and overview..."
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Input
                id="objective"
                placeholder="e.g., Increase app downloads by 30%"
                value={form.objective}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, objective: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule & Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget Limit (USD)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                value={form.budget_limit_usd}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    budget_limit_usd: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/campaigns")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createCampaign.isPending}>
            {createCampaign.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Create Campaign
          </Button>
        </div>
      </div>
    </>
  );
}
