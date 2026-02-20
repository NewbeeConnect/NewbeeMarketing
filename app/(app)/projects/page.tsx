"use client";

import Link from "next/link";
import { Plus, Film, Clock, Globe } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { PLATFORMS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <>
      <AppHeader title="Projects" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Video Projects</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage marketing video projects
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Film className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Start by creating a video project. Define what you want to promote,
                and let AI help you craft the perfect marketing video.
              </p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const platforms = project.target_platforms.map(
                (p) => PLATFORMS.find((pl) => pl.value === p)?.label ?? p
              );

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-1">
                          {project.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                          Step {project.current_step}/6
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {project.product_name}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>{platforms.slice(0, 2).join(", ")}</span>
                        {platforms.length > 2 && (
                          <span>+{platforms.length - 2}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            project.status === "completed" ? "default" : "outline"
                          }
                          className="text-xs"
                        >
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.updated_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
