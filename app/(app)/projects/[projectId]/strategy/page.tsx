"use client";

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
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import type { ProjectStrategy } from "@/types/database";

export default function StrategyPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading, refetch } = useProject(projectId);
  const generateStrategy = useGenerateStrategy();
  const updateProject = useUpdateProject();

  if (isLoading) {
    return (
      <>
        <AppHeader title="Strategy" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppHeader title="Strategy" />
        <div className="p-6">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </>
    );
  }

  const strategy = project.strategy as unknown as ProjectStrategy | null;

  const handleGenerate = async () => {
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
    } catch (error) {
      toast.error("Failed to approve strategy");
    }
  };

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

  const handleRefined = async (updatedContent: unknown, explanation: string) => {
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

  return (
    <>
      <AppHeader title="Strategy" />
      <div className="p-6 space-y-6">
        <WorkflowStepper projectId={projectId} currentStep={project.current_step} />

        {!strategy ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Generate Strategy</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                AI will analyze your brief and create a marketing video strategy
                including hook, narrative arc, key messages, and CTA.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={generateStrategy.isPending}
            >
              {generateStrategy.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Strategy with AI
                </>
              )}
            </Button>
          </div>
        ) : (
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
