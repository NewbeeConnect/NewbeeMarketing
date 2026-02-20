"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/useProject";
import { useScenes, useUpdateScene, useReorderScenes, useDeleteScene } from "@/hooks/useScenes";
import { useGenerateScenes } from "@/hooks/useAiScenes";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { SceneList } from "@/components/projects/scenes/SceneList";
import { RefinementChat } from "@/components/projects/strategy/RefinementChat";
import { VersionHistory } from "@/components/projects/strategy/VersionHistory";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, Loader2, Check } from "lucide-react";
import type { Scene, ProjectStrategy } from "@/types/database";

export default function ScenesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(projectId);
  const { data: scenes, isLoading: scenesLoading, refetch: refetchScenes } = useScenes(projectId);
  const generateScenes = useGenerateScenes();
  const updateScene = useUpdateScene();
  const reorderScenes = useReorderScenes();
  const deleteScene = useDeleteScene();
  const updateProject = useUpdateProject();

  const isLoading = projectLoading || scenesLoading;

  if (isLoading) {
    return (
      <>
        <AppHeader title="Scenes" />
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
        <AppHeader title="Scenes" />
        <div className="p-6">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </>
    );
  }

  const strategy = project.strategy as unknown as ProjectStrategy | null;
  const targetDuration = strategy?.recommended_duration ?? 30;
  const hasScenes = scenes && scenes.length > 0;

  const handleGenerate = async () => {
    try {
      await generateScenes.mutateAsync(projectId);
      toast.success("Scenes generated successfully!");
      refetchScenes();
      refetchProject();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate scenes"
      );
    }
  };

  const handleUpdateScene = async (sceneId: string, data: Partial<Scene>) => {
    try {
      await updateScene.mutateAsync({ id: sceneId, data });
      toast.success("Scene updated");
    } catch {
      toast.error("Failed to update scene");
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    try {
      await deleteScene.mutateAsync({ sceneId, projectId });
      toast.success("Scene deleted");
    } catch {
      toast.error("Failed to delete scene");
    }
  };

  const handleReorder = async (sceneIds: string[]) => {
    try {
      await reorderScenes.mutateAsync({ projectId, sceneIds });
    } catch {
      toast.error("Failed to reorder scenes");
    }
  };

  const handleApprove = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          status: "prompts_pending",
          current_step: 4,
        },
      });
      toast.success("Scenes approved! Moving to prompts...");
      router.push(`/projects/${projectId}/prompts`);
    } catch {
      toast.error("Failed to approve scenes");
    }
  };

  const handleRefined = async (_updatedContent: unknown, explanation: string) => {
    toast.success(`Scenes refined: ${explanation}`);
    refetchScenes();
    refetchProject();
  };

  return (
    <>
      <AppHeader title="Scenes" />
      <div className="p-6 space-y-6">
        <WorkflowStepper projectId={projectId} currentStep={project.current_step} />

        {!hasScenes ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Generate Scene Breakdown</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                AI will break down your approved strategy into individual scenes,
                each with visual descriptions, camera movements, and audio settings.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={generateScenes.isPending}
            >
              {generateScenes.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Scenes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Scenes with AI
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <SceneList
                scenes={scenes}
                targetDuration={targetDuration}
                onUpdateScene={handleUpdateScene}
                onDeleteScene={handleDeleteScene}
                onReorder={handleReorder}
              />

              <Button onClick={handleApprove} size="lg" className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Approve Scenes & Continue to Prompts
              </Button>
            </div>

            <div className="space-y-4">
              <RefinementChat
                projectId={projectId}
                currentContent={scenes}
                contentType="scenes"
                onRefined={handleRefined}
              />

              <VersionHistory projectId={projectId} step="scenes" />

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerate}
                disabled={generateScenes.isPending}
              >
                {generateScenes.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Regenerate All Scenes
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
