"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/useProject";
import { useScenes, useUpdateScene } from "@/hooks/useScenes";
import { useOptimizePrompts } from "@/hooks/useAiPromptOptimize";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { PromptList } from "@/components/projects/prompts/PromptList";
import { RefinementChat } from "@/components/projects/strategy/RefinementChat";
import { VersionHistory } from "@/components/projects/strategy/VersionHistory";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function PromptsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(projectId);
  const { data: scenes, isLoading: scenesLoading, refetch: refetchScenes } = useScenes(projectId);
  const optimizePrompts = useOptimizePrompts();
  const updateScene = useUpdateScene();
  const updateProject = useUpdateProject();

  const isLoading = projectLoading || scenesLoading;
  const baseBreadcrumbs = [{ label: "Projects", href: "/projects" }];

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

  if (!project || !scenes) {
    return (
      <>
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Not Found" }]} />
        <div className="p-6">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </>
    );
  }

  const hasOptimizedPrompts = scenes.some((s) => s.optimized_prompt);
  const allApproved = scenes.length > 0 && scenes.every((s) => s.prompt_approved);

  const handleOptimizeAll = async () => {
    try {
      await optimizePrompts.mutateAsync({ projectId });
      toast.success(`Optimized prompts for ${scenes.length} scenes!`);
      refetchScenes();
      refetchProject();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to optimize prompts"
      );
    }
  };

  const handleOptimizeSingle = async (sceneId: string) => {
    try {
      await optimizePrompts.mutateAsync({ projectId, sceneId });
      toast.success("Prompt re-optimized!");
      refetchScenes();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to optimize prompt"
      );
    }
  };

  const handleApprove = async (sceneId: string) => {
    try {
      await updateScene.mutateAsync({
        id: sceneId,
        data: { prompt_approved: true },
      });
      toast.success("Prompt approved");
    } catch {
      toast.error("Failed to approve prompt");
    }
  };

  const handleReject = async (sceneId: string) => {
    try {
      await updateScene.mutateAsync({
        id: sceneId,
        data: { prompt_approved: false },
      });
      toast.success("Approval revoked");
    } catch {
      toast.error("Failed to revoke approval");
    }
  };

  const handleEdit = async (
    sceneId: string,
    prompt: string,
    negativePrompt: string
  ) => {
    try {
      await updateScene.mutateAsync({
        id: sceneId,
        data: {
          optimized_prompt: prompt,
          negative_prompt: negativePrompt,
          prompt_approved: false,
        },
      });
      toast.success("Prompt updated");
    } catch {
      toast.error("Failed to update prompt");
    }
  };

  const handleApproveAll = async () => {
    try {
      await Promise.all(
        scenes
          .filter((s) => !s.prompt_approved && s.optimized_prompt)
          .map((s) =>
            updateScene.mutateAsync({
              id: s.id,
              data: { prompt_approved: true },
            })
          )
      );
      toast.success("All prompts approved!");
    } catch {
      toast.error("Failed to approve all prompts");
    }
  };

  const handleContinue = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          status: "generating",
          current_step: 5,
        },
      });
      toast.success("Moving to video generation...");
      router.push(`/projects/${projectId}/generate`);
    } catch {
      toast.error("Failed to continue");
    }
  };

  const handleRefined = async (updatedContent: unknown) => {
    const content = updatedContent as Record<string, unknown>;
    if (content.prompts && Array.isArray(content.prompts)) {
      for (const item of content.prompts) {
        const p = item as {
          sceneId?: string;
          optimized_prompt?: string;
          negative_prompt?: string;
        };
        if (p.sceneId && p.optimized_prompt) {
          await updateScene.mutateAsync({
            id: p.sceneId,
            data: {
              optimized_prompt: p.optimized_prompt,
              negative_prompt: p.negative_prompt || null,
              prompt_approved: false,
            },
          });
        }
      }
      toast.success("Prompts refined");
      refetchScenes();
    }
  };

  const handleRestore = async (snapshot: unknown) => {
    const data = snapshot as {
      prompts?: Array<{
        sceneId: string;
        optimized_prompt: string;
        negative_prompt: string;
      }>;
    };
    if (data.prompts) {
      for (const p of data.prompts) {
        await updateScene.mutateAsync({
          id: p.sceneId,
          data: {
            optimized_prompt: p.optimized_prompt,
            negative_prompt: p.negative_prompt,
            prompt_approved: false,
          },
        });
      }
      toast.success("Version restored");
      refetchScenes();
    }
  };

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: project.title, href: `/projects/${projectId}` }, { label: "Prompts" }]} />
      <div className="p-6 space-y-6">
        <WorkflowStepper projectId={projectId} currentStep={project.current_step} />

        {!hasOptimizedPrompts ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Optimize Prompts</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                AI will transform your scene descriptions into optimized Veo
                video generation prompts for the best possible output quality.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleOptimizeAll}
              disabled={optimizePrompts.isPending}
            >
              {optimizePrompts.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing {scenes.length} scenes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize All Prompts ({scenes.length} scenes)
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <PromptList
                scenes={scenes}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onRegenerate={handleOptimizeSingle}
                onApproveAll={handleApproveAll}
                isOptimizing={optimizePrompts.isPending}
              />

              <div className="flex items-center justify-between pt-2">
                {!allApproved && (
                  <p className="text-sm text-muted-foreground">
                    {scenes.filter(s => s.prompt_approved).length}/{scenes.length} prompts approved — approve all to continue
                  </p>
                )}
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={!allApproved}
                  className="ml-auto"
                >
                  Continue to Generation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <RefinementChat
                projectId={projectId}
                currentContent={{ prompts: scenes.map((s) => ({
                  sceneId: s.id,
                  sceneNumber: s.scene_number,
                  title: s.title,
                  description: s.description,
                  optimized_prompt: s.optimized_prompt,
                  negative_prompt: s.negative_prompt,
                })) }}
                contentType="prompts"
                onRefined={handleRefined}
              />

              <VersionHistory
                projectId={projectId}
                step="prompts"
                onRestore={handleRestore}
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={handleOptimizeAll}
                disabled={optimizePrompts.isPending}
              >
                {optimizePrompts.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Re-optimize All Prompts
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
