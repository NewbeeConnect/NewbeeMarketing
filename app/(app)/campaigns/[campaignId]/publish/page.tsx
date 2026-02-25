"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useCampaign } from "@/hooks/useCampaigns";
import { useProjects } from "@/hooks/useProjects";
import { PublishDialog } from "@/components/campaigns/PublishDialog";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Megaphone,
  Loader2,
  Check,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { AdPlatform, Generation } from "@/types/database";

type PlatformOption = {
  value: AdPlatform;
  label: string;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: "google", label: "Google Ads" },
  { value: "meta", label: "Meta Ads" },
];

export default function PublishPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const router = useRouter();
  const { data: campaign, isLoading: campaignLoading } =
    useCampaign(campaignId);
  const { data: projects } = useProjects(campaignId);

  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>([]);
  const [budgetDaily, setBudgetDaily] = useState("");
  const [budgetTotal, setBudgetTotal] = useState("");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [locations, setLocations] = useState("");
  const [interests, setInterests] = useState("");
  const [languages, setLanguages] = useState("en");
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load completed generations from linked projects via React Query
  const { data: completedGenerations = [] } = useQuery({
    queryKey: ["completed-generations", projects?.map((p) => p.id)],
    queryFn: async (): Promise<Generation[]> => {
      const supabase = createClient();
      const projectIds = projects!.map((p) => p.id);
      const { data, error } = await supabase
        .from("mkt_generations")
        .select("*")
        .in("project_id", projectIds)
        .eq("status", "completed")
        .in("type", ["video", "image"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Generation[];
    },
    enabled: !!projects && projects.length > 0,
  });

  const togglePlatform = (platform: AdPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleCreative = (url: string) => {
    setSelectedCreatives((prev) =>
      prev.includes(url)
        ? prev.filter((u) => u !== url)
        : [...prev, url]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    if (!budgetDaily || !budgetTotal) {
      toast.error("Budget settings are required");
      return;
    }
    if (selectedCreatives.length === 0) {
      toast.error("Select at least one creative");
      return;
    }
    if (!locations.trim()) {
      toast.error("At least one location is required");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmPublish = async () => {
    setShowConfirmDialog(false);

    const projectId = projects?.[0]?.id;
    if (!projectId) {
      toast.error("No linked project found");
      return;
    }

    setPublishing(true);

    try {
      const errors: string[] = [];
      const targeting = {
        age_range: [parseInt(ageMin), parseInt(ageMax)],
        locations: locations
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        interests: interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      };

      // Send per-platform requests (API expects singular "platform", not array)
      for (const platform of selectedPlatforms) {
        const response = await fetch("/api/ads/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            campaign_id: campaignId,
            campaign_name: campaign?.name || "Untitled Campaign",
            budget_daily_usd: parseFloat(budgetDaily),
            budget_total_usd: parseFloat(budgetTotal),
            targeting,
            creative_urls: selectedCreatives,
            project_id: projectId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          errors.push(`${platform}: ${data.error || "Failed"}`);
        }
      }

      if (errors.length > 0) {
        toast.error(`Some platforms failed: ${errors.join(", ")}`);
      } else {
        toast.success("Ads published successfully!");
        router.push(`/campaigns/${campaignId}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish ads"
      );
    } finally {
      setPublishing(false);
    }
  };

  const baseBreadcrumbs = [{ label: "Campaigns", href: "/campaigns" }];

  if (campaignLoading) {
    return (
      <>
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Loading..." }]} />
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
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Not Found" }]} />
        <div className="p-6">
          <p className="text-muted-foreground">Campaign not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: campaign.name, href: `/campaigns/${campaignId}` }, { label: "Publish" }]} />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold">
            Publish Ads: {campaign.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure ad deployment settings and push your creatives to ad
            platforms.
          </p>
        </div>

        {/* Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = selectedPlatforms.includes(platform.value);
                return (
                  <Button
                    key={platform.value}
                    variant={selected ? "default" : "outline"}
                    size="lg"
                    onClick={() => togglePlatform(platform.value)}
                    className="flex-1 gap-2"
                  >
                    {selected && <Check className="h-4 w-4" />}
                    {platform.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_daily">Daily Budget (USD)</Label>
                <Input
                  id="budget_daily"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="25.00"
                  value={budgetDaily}
                  onChange={(e) => setBudgetDaily(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_total">Total Budget (USD)</Label>
                <Input
                  id="budget_total"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="500.00"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Targeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_min">Min Age</Label>
                <Input
                  id="age_min"
                  type="number"
                  min="13"
                  max="65"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age_max">Max Age</Label>
                <Input
                  id="age_max"
                  type="number"
                  min="13"
                  max="65"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locations">Locations (comma-separated)</Label>
              <Input
                id="locations"
                placeholder="Germany, Austria, Switzerland"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                placeholder="technology, expat life, travel"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input
                id="languages"
                placeholder="en, de, tr"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Creative Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Select Creatives ({selectedCreatives.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedGenerations.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {completedGenerations.map((gen) => {
                  if (!gen.output_url) return null;
                  const isSelected = selectedCreatives.includes(gen.output_url);
                  return (
                    <button
                      key={gen.id}
                      onClick={() => toggleCreative(gen.output_url!)}
                      className={`relative group rounded-lg border-2 overflow-hidden transition-colors ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {gen.thumbnail_url ? (
                          <img
                            src={gen.thumbnail_url}
                            alt={gen.prompt.slice(0, 50)}
                            className="w-full h-full object-cover"
                          />
                        ) : gen.type === "video" ? (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div className="p-2">
                        <Badge variant="outline" className="text-[10px]">
                          {gen.type}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  No completed creatives found in linked projects. Generate
                  videos or images first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/campaigns/${campaignId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || selectedPlatforms.length === 0}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Push to Live
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <PublishDialog
        open={showConfirmDialog}
        onConfirm={handleConfirmPublish}
        onCancel={() => setShowConfirmDialog(false)}
        config={{
          platforms: selectedPlatforms,
          budgetDaily: parseFloat(budgetDaily) || 0,
          budgetTotal: parseFloat(budgetTotal) || 0,
          targeting: {
            ageRange: [parseInt(ageMin) || 18, parseInt(ageMax) || 65],
            locations: locations
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean),
            interests: interests
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean),
            languages: languages
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean),
          },
          creativeCount: selectedCreatives.length,
        }}
      />
    </>
  );
}
