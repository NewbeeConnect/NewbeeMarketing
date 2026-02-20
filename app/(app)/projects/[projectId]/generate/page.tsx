"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "lucide-react";

export default function GeneratePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Generate" />
        <div className="p-6">
          <Skeleton className="h-12 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Generate" />
      <div className="p-6 space-y-6">
        {project && (
          <WorkflowStepper
            projectId={projectId}
            currentStep={project.current_step}
          />
        )}

        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Video className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Video Generation</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Batch video generation with Veo across languages and platforms.
              Coming in Faz 3.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
