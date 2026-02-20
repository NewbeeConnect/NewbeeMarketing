"use client";

import { FileStack, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  return (
    <>
      <AppHeader title="Templates" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Template Library</h2>
            <p className="text-sm text-muted-foreground">
              Save and reuse successful project configurations
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No templates yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create templates from successful projects or build new ones from
              scratch
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
