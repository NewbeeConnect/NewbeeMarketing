"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors } from "lucide-react";

export default function PostProductionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Post-Production" />
        <div className="p-6">
          <Skeleton className="h-12 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Post-Production" />
      <div className="p-6 space-y-6">
        {project && (
          <WorkflowStepper
            projectId={projectId}
            currentStep={project.current_step}
          />
        )}

        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Scissors className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Post-Production</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Video stitching, captions, voiceover overlay, watermark, and export.
              Coming in Faz 4.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
