"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/useProject";
import { useScenes } from "@/hooks/useScenes";
import {
  useGenerations,
  useStartVideoGeneration,
  useActiveGenerations,
} from "@/hooks/useVideoGeneration";
import { useGenerateImage } from "@/hooks/useImageGeneration";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { BatchMatrix } from "@/components/projects/generate/BatchMatrix";
import { GenerationQueue } from "@/components/projects/generate/GenerationQueue";
import { GenerationProgress } from "@/components/projects/generate/GenerationProgress";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants";
import {
  Play,
  Loader2,
  ArrowRight,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";

interface BatchItem {
  language: string;
  platform: string;
  aspectRatio: string;
  selected: boolean;
}

export default function GeneratePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: scenes, isLoading: scenesLoading } = useScenes(projectId);
  const { data: generations } = useGenerations(projectId);
  const { data: activeGens } = useActiveGenerations(projectId);
  const startVideo = useStartVideoGeneration();
  const generateImage = useGenerateImage();
  const updateProject = useUpdateProject();

  const [useFastModel, setUseFastModel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Build batch matrix from project languages x platforms
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Initialize batch items when project loads
  useMemo(() => {
    if (!project) return;
    const items: BatchItem[] = [];
    for (const lang of project.languages) {
      for (const platform of project.target_platforms) {
        const platformDef = PLATFORMS.find((p) => p.value === platform);
        items.push({
          language: lang,
          platform,
          aspectRatio: platformDef?.aspectRatio || "9:16",
          selected: true,
        });
      }
    }
    setBatchItems(items);
  }, [project]);

  const isLoading = projectLoading || scenesLoading;

  const handleToggle = useCallback((language: string, platform: string) => {
    setBatchItems((prev) =>
      prev.map((item) =>
        item.language === language && item.platform === platform
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  }, []);

  const handleToggleAll = useCallback(
    (selected: boolean) => {
      setBatchItems((prev) => prev.map((item) => ({ ...item, selected })));
    },
    []
  );

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

  const approvedScenes = scenes.filter((s) => s.prompt_approved);
  const unapprovedScenes = scenes.filter((s) => !s.prompt_approved);
  const selectedBatch = batchItems.filter((b) => b.selected);
  const totalVideos = selectedBatch.length * approvedScenes.length;

  const estimateTotalCost = () => {
    const costPerSecond = useFastModel ? 0.15 : 0.4;
    const totalDuration = approvedScenes.reduce(
      (sum, s) => sum + s.duration_seconds,
      0
    );
    return totalDuration * costPerSecond * selectedBatch.length;
  };

  const handleStartGeneration = async () => {
    if (approvedScenes.length === 0) {
      toast.error("No approved scenes. Go back to Prompts step.");
      return;
    }
    if (selectedBatch.length === 0) {
      toast.error("Select at least one language/platform combination.");
      return;
    }

    setIsGenerating(true);
    let started = 0;
    let failed = 0;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { status: "generating" },
      });

      for (const batch of selectedBatch) {
        for (const scene of approvedScenes) {
          try {
            await startVideo.mutateAsync({
              projectId,
              sceneId: scene.id,
              language: batch.language,
              platform: batch.platform,
              aspectRatio: batch.aspectRatio,
              useFastModel,
            });
            started++;
          } catch {
            failed++;
          }
        }
      }

      if (started > 0) {
        toast.success(
          `Started ${started} video generation${started > 1 ? "s" : ""}${
            failed > 0 ? ` (${failed} failed to start)` : ""
          }`
        );
      }
      if (failed > 0 && started === 0) {
        toast.error("All generations failed to start");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start generation"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateThumbnails = async () => {
    if (!project.strategy) return;
    const strategy = project.strategy as { hook?: string };
    const prompt = `Marketing thumbnail for: ${strategy.hook || project.title}. Style: ${project.style}, Tone: ${project.tone}. Professional, eye-catching thumbnail for ${project.target_platforms.join(", ")}`;

    try {
      await generateImage.mutateAsync({
        projectId,
        prompt,
        aspectRatio: "16:9",
        useFastModel,
        purpose: "thumbnail",
      });
      toast.success("Thumbnail generation started!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate thumbnail"
      );
    }
  };

  const handleContinue = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          status: "post_production",
          current_step: 6,
        },
      });
      toast.success("Moving to post-production...");
      router.push(`/projects/${projectId}/post-production`);
    } catch {
      toast.error("Failed to continue");
    }
  };

  const completedGens = (generations ?? []).filter(
    (g) => g.status === "completed"
  );
  const allDone =
    (generations ?? []).length > 0 &&
    (generations ?? []).every(
      (g) => g.status === "completed" || g.status === "failed"
    );

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: project.title, href: `/projects/${projectId}` }, { label: "Generate" }]} />
      <div className="p-6 space-y-6">
        <WorkflowStepper
          projectId={projectId}
          currentStep={project.current_step}
        />

        {unapprovedScenes.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <p className="text-sm">
                {unapprovedScenes.length} scene
                {unapprovedScenes.length > 1 ? "s have" : " has"} unapproved
                prompts and will be skipped. Go back to{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() =>
                    router.push(`/projects/${projectId}/prompts`)
                  }
                >
                  Prompts
                </Button>{" "}
                to approve them.
              </p>
            </CardContent>
          </Card>
        )}

        {activeGens && activeGens.length > 0 && (
          <GenerationProgress
            activeGenerations={activeGens}
            projectId={projectId}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <BatchMatrix
              projectLanguages={project.languages}
              projectPlatforms={project.target_platforms}
              batchItems={batchItems}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              scenesCount={approvedScenes.length}
            />

            <GenerationQueue
              generations={generations ?? []}
              totalExpected={totalVideos}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fast-model" className="text-sm">
                    Fast Model (Lower cost, lower quality)
                  </Label>
                  <Switch
                    id="fast-model"
                    checked={useFastModel}
                    onCheckedChange={setUseFastModel}
                  />
                </div>

                <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono">
                      {useFastModel ? "Veo 3.1 Fast" : "Veo 3.1"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scenes</span>
                    <span>{approvedScenes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Combinations</span>
                    <span>{selectedBatch.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Videos</span>
                    <span className="font-medium">{totalVideos}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Estimated Cost</span>
                    <span>${estimateTotalCost().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartGeneration}
                  disabled={
                    isGenerating ||
                    approvedScenes.length === 0 ||
                    selectedBatch.length === 0
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Generation ({totalVideos} videos)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thumbnails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Generate marketing thumbnails with Imagen 4.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateThumbnails}
                  disabled={generateImage.isPending}
                >
                  {generateImage.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Generate Thumbnail
                </Button>
              </CardContent>
            </Card>

            {completedGens.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Completed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      {completedGens.length} videos ready
                    </Badge>
                  </div>
                  {allDone && (
                    <Button
                      className="w-full mt-3"
                      onClick={handleContinue}
                    >
                      Continue to Post-Production
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
