"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/useProject";
import { useGenerateStrategy } from "@/hooks/useAiStrategy";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { StrategyPanel } from "@/components/projects/strategy/StrategyPanel";
import { RefinementChat } from "@/components/projects/strategy/RefinementChat";
import { VersionHistory } from "@/components/projects/strategy/VersionHistory";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, Loader2, GitBranch, Heart, Cpu } from "lucide-react";
import type { ProjectStrategy } from "@/types/database";

// ---------- A/B extended types ----------

interface AbStrategyVariant extends ProjectStrategy {
  persona_type: "emotional" | "technical";
  persona_description: string;
}

interface AbStrategyResult {
  version_a: AbStrategyVariant;
  version_b: AbStrategyVariant;
}

// ---------- A/B fetch hook (inline) ----------

function useAbStrategy() {
  const [data, setData] = useState<AbStrategyResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (projectId: string) => {
    setIsPending(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ab_mode: true }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to generate A/B strategies");
      }

      const result: AbStrategyResult = await res.json();
      setData(result);
      return result;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsPending(false);
  }, []);

  return { data, isPending, error, generate, reset };
}

// ---------- Strategy field labels ----------

const STRATEGY_FIELDS: {
  key: keyof ProjectStrategy;
  label: string;
}[] = [
  { key: "hook", label: "Hook" },
  { key: "narrative_arc", label: "Narrative Arc" },
  { key: "key_messages", label: "Key Messages" },
  { key: "cta", label: "Call to Action" },
  { key: "recommended_duration", label: "Duration (sec)" },
  { key: "recommended_scenes", label: "Scene Count" },
  { key: "music_mood", label: "Music Mood" },
];

// ---------- A/B Comparison Card ----------

function AbVariantCard({
  variant,
  icon: Icon,
  label,
  badgeVariant,
  onSelect,
  isSelecting,
}: {
  variant: AbStrategyVariant;
  icon: typeof Heart;
  label: string;
  badgeVariant: "default" | "secondary";
  onSelect: () => void;
  isSelecting: boolean;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-base">{label}</CardTitle>
          </div>
          <Badge variant={badgeVariant}>{variant.persona_type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {variant.persona_description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {STRATEGY_FIELDS.map(({ key, label: fieldLabel }) => {
          const value = variant[key];
          return (
            <div key={key}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {fieldLabel}
              </p>
              {key === "key_messages" && Array.isArray(value) ? (
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {(value as string[]).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{String(value)}</p>
              )}
            </div>
          );
        })}

        <Button
          className="w-full mt-4"
          onClick={onSelect}
          disabled={isSelecting}
        >
          {isSelecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Selecting...
            </>
          ) : (
            "Select This Version"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- Main Page ----------

export default function StrategyPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading, refetch } = useProject(projectId);
  const generateStrategy = useGenerateStrategy();
  const updateProject = useUpdateProject();
  const abStrategy = useAbStrategy();

  const [abMode, setAbMode] = useState(false);
  const [selectingVersion, setSelectingVersion] = useState<"a" | "b" | null>(
    null
  );

  const baseBreadcrumbs = [{ label: "Projects", href: "/projects" }];

  // ----- Loading state -----
  if (isLoading) {
    return (
      <>
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Loading..." }]} />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  // ----- Not found -----
  if (!project) {
    return (
      <>
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Not Found" }]} />
        <div className="p-6">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </>
    );
  }

  const strategy = project.strategy as unknown as ProjectStrategy | null;

  // ----- Standard (non-AB) generate -----
  const handleGenerate = async () => {
    if (abMode) {
      return handleAbGenerate();
    }

    try {
      await generateStrategy.mutateAsync(projectId);
      toast.success("Strategy generated successfully!");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate strategy"
      );
    }
  };

  // ----- A/B generate -----
  const handleAbGenerate = async () => {
    try {
      await abStrategy.generate(projectId);
      toast.success("A/B strategies generated! Compare and pick your favourite.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate A/B strategies"
      );
    }
  };

  // ----- Select A/B variant -----
  const handleSelectVariant = async (version: "a" | "b") => {
    if (!abStrategy.data) return;

    setSelectingVersion(version);

    const selected =
      version === "a" ? abStrategy.data.version_a : abStrategy.data.version_b;
    const archived =
      version === "a" ? abStrategy.data.version_b : abStrategy.data.version_a;

    // Strip persona fields to store as standard ProjectStrategy
    const { persona_type: _pt, persona_description: _pd, ...strategyData } =
      selected;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          strategy: strategyData as ProjectStrategy,
          strategy_approved: false,
        },
      });

      toast.success(
        `Version ${version.toUpperCase()} selected! (${selected.persona_type} approach). The other version has been archived.`
      );

      // Reset A/B state so the normal strategy flow takes over
      abStrategy.reset();
      setAbMode(false);
      refetch();
    } catch {
      toast.error("Failed to select strategy version");
    } finally {
      setSelectingVersion(null);
    }
  };

  // ----- Approve -----
  const handleApprove = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          strategy_approved: true,
          status: "scenes_pending",
          current_step: 3,
        },
      });
      toast.success("Strategy approved! Moving to scenes...");
      router.push(`/projects/${projectId}/scenes`);
    } catch {
      toast.error("Failed to approve strategy");
    }
  };

  // ----- Inline edit -----
  const handleEdit = async (field: keyof ProjectStrategy, value: unknown) => {
    if (!strategy) return;
    const updated = { ...strategy, [field]: value };
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { strategy: updated },
      });
      toast.success("Strategy updated");
      refetch();
    } catch {
      toast.error("Failed to update strategy");
    }
  };

  // ----- Refinement -----
  const handleRefined = async (
    updatedContent: unknown,
    explanation: string
  ) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          strategy: updatedContent as ProjectStrategy,
        },
      });
      toast.success(`Refined: ${explanation}`);
      refetch();
    } catch {
      toast.error("Failed to apply refinement");
    }
  };

  // ----- Restore version -----
  const handleRestore = async (snapshot: unknown) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          strategy: snapshot as ProjectStrategy,
          strategy_approved: false,
        },
      });
      toast.success("Version restored");
      refetch();
    } catch {
      toast.error("Failed to restore version");
    }
  };

  const isGenerating = abMode ? abStrategy.isPending : generateStrategy.isPending;

  // ===================== RENDER =====================

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: project.title, href: `/projects/${projectId}` }, { label: "Strategy" }]} />
      <div className="p-6 space-y-6">
        <WorkflowStepper
          projectId={projectId}
          currentStep={project.current_step}
        />

        {/* ---------- A/B comparison view ---------- */}
        {abStrategy.data && !strategy ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  A/B Strategy Comparison
                </h2>
              </div>
              <Badge variant="outline">Select one to continue</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <AbVariantCard
                variant={abStrategy.data.version_a}
                icon={Heart}
                label="Version A - Emotional / Story-driven"
                badgeVariant="default"
                onSelect={() => handleSelectVariant("a")}
                isSelecting={selectingVersion === "a"}
              />
              <AbVariantCard
                variant={abStrategy.data.version_b}
                icon={Cpu}
                label="Version B - Technical / Benefit-driven"
                badgeVariant="secondary"
                onSelect={() => handleSelectVariant("b")}
                isSelecting={selectingVersion === "b"}
              />
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  abStrategy.reset();
                }}
              >
                Discard & Start Over
              </Button>
            </div>
          </div>
        ) : !strategy ? (
          /* ---------- Initial generate screen ---------- */
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <Sparkles className="h-12 w-12 text-muted-foreground" />

            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Generate Strategy</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                AI will analyze your brief and create a marketing video strategy
                including hook, narrative arc, key messages, and CTA.
              </p>
            </div>

            {/* A/B Mode Toggle */}
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">A/B Mode</p>
                <p className="text-xs text-muted-foreground">
                  Generate two strategy variants (emotional vs. technical) and
                  pick the best one
                </p>
              </div>
              <Switch
                checked={abMode}
                onCheckedChange={setAbMode}
                disabled={isGenerating}
              />
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {abMode ? "Generating A/B Variants..." : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {abMode
                    ? "Generate A/B Strategies"
                    : "Generate Strategy with AI"}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* ---------- Existing strategy view (unchanged) ---------- */
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StrategyPanel
                strategy={strategy}
                approved={project.strategy_approved}
                onApprove={handleApprove}
                onEdit={handleEdit}
              />
            </div>

            <div className="space-y-4">
              {!project.strategy_approved && (
                <RefinementChat
                  projectId={projectId}
                  currentContent={strategy}
                  contentType="strategy"
                  onRefined={handleRefined}
                />
              )}

              <VersionHistory
                projectId={projectId}
                step="strategy"
                onRestore={handleRestore}
              />

              {!project.strategy_approved && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generateStrategy.isPending}
                >
                  {generateStrategy.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Regenerate Strategy
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
