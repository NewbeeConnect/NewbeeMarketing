"use client";

import { useRouter } from "next/navigation";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { CampaignFormData } from "@/lib/validations";

export default function NewCampaignPage() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();

  const handleSubmit = async (data: CampaignFormData) => {
    try {
      const campaign = await createCampaign.mutateAsync(data);
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
      <AppHeader title="New Campaign" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm
              onSubmit={handleSubmit}
              isPending={createCampaign.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
