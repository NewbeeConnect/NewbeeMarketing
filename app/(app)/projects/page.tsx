"use client";

import Link from "next/link";
import { Plus, Film } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
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
      </div>
    </>
  );
}
