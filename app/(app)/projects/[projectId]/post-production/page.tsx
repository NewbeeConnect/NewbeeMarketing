"use client";

import { useParams } from "next/navigation";
import { useProject, useUpdateProject } from "@/hooks/useProject";
import { useScenes } from "@/hooks/useScenes";
import { useGenerations } from "@/hooks/useVideoGeneration";
import { useGenerateVoiceover } from "@/hooks/useVoiceover";
import { useCaptions, useGenerateCaptions, useUpdateCaption } from "@/hooks/useAiCaptions";
import { useStitchVideos, useEmbedCaption, useExportVideos } from "@/hooks/useVideoProcessing";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { StitchedVideoPreview } from "@/components/projects/post-production/StitchedVideoPreview";
import { CaptionEditor } from "@/components/projects/post-production/CaptionEditor";
import { VoiceoverPanel } from "@/components/projects/post-production/VoiceoverPanel";
import { ExportPanel } from "@/components/projects/post-production/ExportPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function PostProductionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: scenes } = useScenes(projectId);
  const { data: generations, refetch: refetchGenerations } = useGenerations(projectId);
  const { data: captions, refetch: refetchCaptions } = useCaptions(projectId);
  const generateVoiceover = useGenerateVoiceover();
  const generateCaptions = useGenerateCaptions();
  const updateCaption = useUpdateCaption();
  const stitchVideos = useStitchVideos();
  const embedCaption = useEmbedCaption();
  const exportVideos = useExportVideos();
  const updateProject = useUpdateProject();

  const baseBreadcrumbs = [{ label: "Projects", href: "/projects" }];

  if (projectLoading) {
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

  const allGenerations = generations ?? [];
  const completedVideos = allGenerations.filter(
    (g) => (g.type === "video" || g.type === "stitched") && g.status === "completed"
  );
  const stitchedVideo = allGenerations.find(
    (g) => g.type === "stitched" && g.status === "completed"
  ) || null;
  const voiceoverGenerations = allGenerations.filter(
    (g) => g.type === "voiceover"
  );

  const handleStitch = async () => {
    try {
      await stitchVideos.mutateAsync({ projectId });
      toast.success("Videos stitched successfully!");
      refetchGenerations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to stitch videos"
      );
    }
  };

  const handleGenerateVoiceover = async (
    sceneId: string,
    text: string,
    language: string,
    voiceName?: string
  ) => {
    try {
      await generateVoiceover.mutateAsync({
        projectId,
        sceneId: sceneId || undefined,
        text,
        language,
        voiceName,
      });
      toast.success("Voiceover generated!");
      refetchGenerations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate voiceover"
      );
    }
  };

  const handleGenerateCaptions = async (language: string) => {
    try {
      await generateCaptions.mutateAsync({
        projectId,
        language,
        generationId: completedVideos[0]?.id,
      });
      toast.success("Captions generated!");
      refetchCaptions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate captions"
      );
    }
  };

  const handleUpdateCaption = async (captionId: string, srtContent: string) => {
    try {
      await updateCaption.mutateAsync({
        captionId,
        srtContent,
        projectId,
      });
      toast.success("Caption updated!");
    } catch {
      toast.error("Failed to update caption");
    }
  };

  const handleEmbedCaption = async (captionId: string) => {
    try {
      await embedCaption.mutateAsync({
        captionId,
        generationId: stitchedVideo?.id,
      });
      toast.success("Caption embed toggled!");
      refetchCaptions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to embed caption"
      );
    }
  };

  const handleExport = async (config: {
    platforms: string[];
    includeCaption: boolean;
    includeWatermark: boolean;
    resolution: string;
  }) => {
    try {
      await exportVideos.mutateAsync({
        projectId,
        ...config,
      });
      toast.success("Export prepared!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export"
      );
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { status: "completed" },
      });
      toast.success("Project marked as completed!");
    } catch {
      toast.error("Failed to update project");
    }
  };

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: project.title, href: `/projects/${projectId}` }, { label: "Post-Production" }]} />
      <div className="p-6 space-y-6">
        <WorkflowStepper
          projectId={projectId}
          currentStep={project.current_step}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <StitchedVideoPreview
              generations={allGenerations}
              stitchedVideo={stitchedVideo}
              onStitch={handleStitch}
              isStitching={stitchVideos.isPending}
            />

            <CaptionEditor
              captions={captions ?? []}
              projectLanguages={project.languages}
              onGenerate={handleGenerateCaptions}
              onUpdate={handleUpdateCaption}
              onEmbed={handleEmbedCaption}
              isGenerating={generateCaptions.isPending}
              isEmbedding={embedCaption.isPending}
            />
          </div>

          <div className="space-y-4">
            <VoiceoverPanel
              scenes={scenes ?? []}
              voiceoverGenerations={voiceoverGenerations}
              projectLanguages={project.languages}
              onGenerate={handleGenerateVoiceover}
              isGenerating={generateVoiceover.isPending}
            />

            <ExportPanel
              projectPlatforms={project.target_platforms}
              completedGenerations={completedVideos}
              onExport={handleExport}
              isExporting={exportVideos.isPending}
            />

            {completedVideos.length > 0 && (
              <Button
                className="w-full"
                size="lg"
                variant={project.status === "completed" ? "outline" : "default"}
                onClick={handleMarkComplete}
                disabled={project.status === "completed"}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {project.status === "completed"
                  ? "Project Completed"
                  : "Mark Project as Complete"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
