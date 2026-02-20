"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2 } from "lucide-react";

export default function PromptsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Prompts" />
        <div className="p-6">
          <Skeleton className="h-12 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Prompt Optimization" />
      <div className="p-6 space-y-6">
        {project && (
          <WorkflowStepper
            projectId={projectId}
            currentStep={project.current_step}
          />
        )}

        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Wand2 className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Prompt Optimization</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              AI will optimize each scene description into Veo-ready prompts.
              Coming in Faz 3.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
