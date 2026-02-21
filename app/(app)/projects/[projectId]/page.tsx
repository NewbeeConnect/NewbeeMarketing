"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { useScenes } from "@/hooks/useScenes";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Film,
  Globe,
  Languages,
  Palette,
  MessageSquare,
  ArrowRight,
  Clock,
} from "lucide-react";
import { PLATFORMS, LANGUAGES, STYLES, TONES } from "@/lib/constants";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const { data: scenes } = useScenes(projectId);

  const baseBreadcrumbs = [{ label: "Projects", href: "/projects" }];

  if (isLoading) {
    return (
      <>
        <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: "Loading..." }]} />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
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

  const platforms = project.target_platforms.map(
    (p) => PLATFORMS.find((pl) => pl.value === p)?.label ?? p
  );
  const languages = project.languages.map(
    (l) => LANGUAGES.find((lang) => lang.value === l)?.label ?? l
  );
  const styleName = STYLES.find((s) => s.value === project.style)?.label ?? project.style;
  const toneName = TONES.find((t) => t.value === project.tone)?.label ?? project.tone;

  const totalDuration = scenes?.reduce((sum, s) => sum + s.duration_seconds, 0) ?? 0;

  const nextStepPath = getNextStepPath(project.current_step, projectId);

  return (
    <>
      <AppHeader breadcrumbs={[...baseBreadcrumbs, { label: project.title }]} />
      <div className="p-6 space-y-6">
        <WorkflowStepper projectId={projectId} currentStep={project.current_step} />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Brief Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Film className="h-5 w-5" />
                Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product</p>
                <p className="font-medium">{project.product_name}</p>
                {project.product_description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.product_description}
                  </p>
                )}
              </div>

              {project.target_audience && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Target Audience
                  </p>
                  <p className="text-sm">{project.target_audience}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {languages.map((l) => (
                    <Badge key={l} variant="outline" className="text-xs">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{styleName}</span>
                <span className="text-muted-foreground">-</span>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{toneName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status & Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge>{project.status.replace(/_/g, " ")}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Step</span>
                <span className="font-medium">{project.current_step} / 6</span>
              </div>

              {scenes && scenes.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scenes</span>
                    <span className="font-medium">{scenes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Duration</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-4 w-4" />
                      {totalDuration}s
                    </span>
                  </div>
                </>
              )}

              {project.strategy_approved && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Strategy</span>
                  <Badge variant="default" className="bg-green-600">
                    Approved
                  </Badge>
                </div>
              )}

              {nextStepPath && (
                <Button
                  className="w-full mt-4"
                  onClick={() => router.push(nextStepPath)}
                >
                  Continue to Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strategy Preview */}
        {project.strategy && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hook</p>
                  <p className="text-sm">{(project.strategy as Record<string, unknown>).hook as string}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CTA</p>
                  <p className="text-sm">{(project.strategy as Record<string, unknown>).cta as string}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Narrative Arc
                  </p>
                  <p className="text-sm">
                    {(project.strategy as Record<string, unknown>).narrative_arc as string}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function getNextStepPath(currentStep: number, projectId: string): string | null {
  const paths: Record<number, string> = {
    1: `/projects/${projectId}`,
    2: `/projects/${projectId}/strategy`,
    3: `/projects/${projectId}/scenes`,
    4: `/projects/${projectId}/prompts`,
    5: `/projects/${projectId}/generate`,
    6: `/projects/${projectId}/post-production`,
  };
  return paths[currentStep] ?? null;
}
