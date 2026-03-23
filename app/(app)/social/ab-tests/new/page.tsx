"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateAbTest } from "@/hooks/useAbTests";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewABTestPage() {
  const router = useRouter();
  const create = useCreateAbTest();
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [variantCount, setVariantCount] = useState("2");
  const [metric, setMetric] = useState("engagement_rate");
  const [maxDays, setMaxDays] = useState("14");

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Test name required"); return; }
    try {
      const result = await create.mutateAsync({
        name,
        hypothesis: hypothesis || undefined,
        variant_count: parseInt(variantCount),
        success_metric: metric,
      });
      toast.success("A/B test created");
      router.push(`/social/ab-tests/${result.test.id}`);
    } catch { toast.error("Failed to create test"); }
  };

  return (
    <>
      <AppHeader title="New A/B Test" />
      <div className="flex-1 p-4 lg:p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/social/ab-tests"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h2 className="text-lg font-semibold">Create A/B Test</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500" /> Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Test Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Emotional vs Technical Hook" />
            </div>
            <div>
              <Label>Hypothesis</Label>
              <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="e.g., Emotional hooks will get 20% more engagement than technical hooks" rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Variants</Label>
                <Select value={variantCount} onValueChange={setVariantCount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 variants (A/B)</SelectItem>
                    <SelectItem value="3">3 variants (A/B/C)</SelectItem>
                    <SelectItem value="4">4 variants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Success Metric</Label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="ctr">CTR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Duration</Label>
                <Select value={maxDays} onValueChange={setMaxDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
              Create Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
