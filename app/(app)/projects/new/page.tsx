"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  Palette as PaletteIcon,
  Loader2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, LANGUAGES, STYLES, TONES } from "@/lib/constants";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/useProjects";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [form, setForm] = useState({
    title: "",
    product_name: "",
    product_description: "",
    target_platforms: [] as string[],
    target_audience: "",
    languages: ["en"] as string[],
    style: "modern",
    tone: "professional",
    additional_notes: "",
  });

  const togglePlatform = (value: string) => {
    setForm((prev) => ({
      ...prev,
      target_platforms: prev.target_platforms.includes(value)
        ? prev.target_platforms.filter((p) => p !== value)
        : [...prev.target_platforms, value],
    }));
  };

  const toggleLanguage = (value: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(value)
        ? prev.languages.filter((l) => l !== value)
        : [...prev.languages, value],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.product_name || form.target_platforms.length === 0) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        title: form.title,
        product_name: form.product_name,
        product_description: form.product_description || null,
        target_platforms: form.target_platforms,
        target_audience: form.target_audience || null,
        languages: form.languages,
        style: form.style,
        tone: form.tone,
        additional_notes: form.additional_notes || null,
      });
      toast.success("Project created! Redirecting to strategy...");
      router.push(`/projects/${project.id}/strategy`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    }
  };

  return (
    <>
      <AppHeader title="New Project" />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-4xl">
        <div>
          <h2 className="text-lg font-semibold">Project Brief</h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you want to promote. AI will use this to craft your
            marketing strategy and video.
          </p>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What are you promoting?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Newbee Events Feature Launch"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product / Feature Name *</Label>
              <Input
                id="product_name"
                placeholder="e.g., Newbee Events"
                value={form.product_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    product_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_description">Description</Label>
              <Textarea
                id="product_description"
                placeholder="Describe what this product/feature does and why it matters..."
                value={form.product_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    product_description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="e.g., Expats aged 25-35 living in Germany"
                value={form.target_audience}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target_audience: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Target Platforms *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const selected = form.target_platforms.includes(platform.value);
                return (
                  <Button
                    key={platform.value}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(platform.value)}
                    className="gap-1"
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {platform.label}
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {platform.aspectRatio}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Languages *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = form.languages.includes(lang.value);
                return (
                  <Button
                    key={lang.value}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLanguage(lang.value)}
                    className="gap-2"
                  >
                    {selected && <Check className="h-3 w-3" />}
                    <span>{lang.flag}</span>
                    {lang.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Style & Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PaletteIcon className="h-4 w-4" />
              Style & Tone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Video Style</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {STYLES.map((style) => (
                  <Button
                    key={style.value}
                    variant={
                      form.style === style.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, style: style.value }))
                    }
                    className="flex-col h-auto py-3"
                  >
                    <span className="font-medium">{style.label}</span>
                    <span className="text-[10px] opacity-70">
                      {style.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <Button
                    key={tone.value}
                    variant={form.tone === tone.value ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, tone: tone.value }))
                    }
                  >
                    {tone.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any specific requirements, references, or ideas you want to include..."
              value={form.additional_notes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  additional_notes: e.target.value,
                }))
              }
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Create & Generate Strategy
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}
