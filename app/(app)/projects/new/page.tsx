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
  Link as LinkIcon,
  Search,
  Code2,
  Upload,
  Github,
  Trash2,
  X,
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
import { useCodeContexts, useUploadCodeContext, useFetchGithubContext, useDeleteCodeContext } from "@/hooks/useCodeContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { CardDescription } from "@/components/ui/card";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [fetchingContext, setFetchingContext] = useState(false);
  const [contextFetched, setContextFetched] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const { data: codeContexts } = useCodeContexts();
  const { data: apiKeys } = useApiKeys();
  const uploadCodeContext = useUploadCodeContext();
  const fetchGithubContext = useFetchGithubContext();
  const deleteCodeContext = useDeleteCodeContext();
  const githubConfigured = apiKeys?.some((k) => k.platform === "github");
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
    source_url: "",
    code_context_id: null as string | null,
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

  const handleFetchContext = async () => {
    if (!form.source_url) {
      toast.error("Please enter a URL first");
      return;
    }

    setFetchingContext(true);
    try {
      const response = await fetch("/api/context/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.source_url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch context");
      }

      const { context } = await response.json();

      // Auto-fill form fields from context
      setForm((prev) => ({
        ...prev,
        product_name: prev.product_name || context.companyName || "",
        product_description: prev.product_description || context.productDescription || "",
        target_audience: prev.target_audience || context.targetAudience || "",
        additional_notes: prev.additional_notes
          ? prev.additional_notes
          : [
              context.keyFeatures?.length > 0 ? `Key Features: ${context.keyFeatures.join(", ")}` : "",
              context.uniqueSellingPoints?.length > 0 ? `USPs: ${context.uniqueSellingPoints.join(", ")}` : "",
            ].filter(Boolean).join("\n"),
      }));

      setContextFetched(true);
      toast.success("Context fetched! Fields have been auto-filled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch context");
    } finally {
      setFetchingContext(false);
    }
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
        source_url: form.source_url || null,
        code_context_id: form.code_context_id || null,
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
      <AppHeader breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "New Project" }]} />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-4xl">
        <div>
          <h2 className="text-lg font-semibold">Project Brief</h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you want to promote. AI will use this to craft your
            marketing strategy and video.
          </p>
        </div>

        {/* Context Fetching */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Quick Start: Fetch from URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a website URL or GitHub link and we&apos;ll automatically extract product info to fill the brief.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com or https://github.com/org/repo"
                value={form.source_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, source_url: e.target.value, }))
                }
                className="flex-1"
              />
              <Button
                onClick={handleFetchContext}
                disabled={fetchingContext || !form.source_url}
                variant={contextFetched ? "outline" : "default"}
              >
                {fetchingContext ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : contextFetched ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {fetchingContext ? "Fetching..." : contextFetched ? "Fetched" : "Fetch Context"}
                </span>
              </Button>
            </div>
            {contextFetched && (
              <p className="text-xs text-green-600">
                Context extracted successfully. Review and edit the auto-filled fields below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Code Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Code Context
            </CardTitle>
            <CardDescription>
              Help AI understand your app&apos;s code to create more accurate briefs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing contexts selector */}
            {codeContexts && codeContexts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Select Existing Analysis</Label>
                <div className="flex flex-wrap gap-2">
                  {codeContexts.map((ctx) => {
                    const selected = form.code_context_id === ctx.id;
                    return (
                      <div key={ctx.id} className="flex items-center gap-1">
                        <Button
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            code_context_id: selected ? null : ctx.id,
                          }))}
                          className="gap-1"
                        >
                          {selected && <Check className="h-3 w-3" />}
                          <Code2 className="h-3 w-3" />
                          {ctx.name}
                          <Badge variant="secondary" className="ml-1 text-[10px]">
                            {ctx.source_type === "github_pat" ? "GitHub" : "Upload"}
                          </Badge>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={async () => {
                            if (form.code_context_id === ctx.id) {
                              setForm((prev) => ({ ...prev, code_context_id: null }));
                            }
                            await deleteCodeContext.mutateAsync(ctx.id);
                            toast.success("Code context removed");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload new */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Upload Repomix File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".txt,.md"
                    className="flex-1 text-xs"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const result = await uploadCodeContext.mutateAsync({
                          file,
                          name: file.name.replace(/\.(txt|md)$/, ""),
                        });
                        setForm((prev) => ({ ...prev, code_context_id: result.id }));
                        toast.success(`Code analyzed: ${result.analysis.appName}`);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      }
                    }}
                    disabled={uploadCodeContext.isPending}
                  />
                  {uploadCodeContext.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin self-center" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Run <code className="bg-muted px-1 rounded">npx repomix</code> in your project to generate the file
                </p>
              </div>

              {githubConfigured && (
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Fetch from GitHub</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://github.com/org/repo"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!githubRepoUrl || fetchGithubContext.isPending}
                      onClick={async () => {
                        try {
                          const result = await fetchGithubContext.mutateAsync(githubRepoUrl);
                          setForm((prev) => ({ ...prev, code_context_id: result.id }));
                          toast.success(`Repo analyzed: ${result.analysis.appName}`);
                          setGithubRepoUrl("");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Fetch failed");
                        }
                      }}
                    >
                      {fetchGithubContext.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Github className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected context preview */}
            {form.code_context_id && codeContexts && (() => {
              const selected = codeContexts.find((c) => c.id === form.code_context_id);
              if (!selected) return null;
              const a = selected.analysis;
              return (
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium">{a.appName} ({a.appType})</p>
                  {a.techStack.length > 0 && (
                    <p className="text-muted-foreground">Stack: {a.techStack.slice(0, 6).join(", ")}</p>
                  )}
                  {a.mainFeatures.length > 0 && (
                    <p className="text-muted-foreground">Features: {a.mainFeatures.slice(0, 4).join(", ")}</p>
                  )}
                  {a.marketingAngles.length > 0 && (
                    <p className="text-muted-foreground">Angles: {a.marketingAngles.slice(0, 3).join(", ")}</p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

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
