"use client";

import { Images } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function GalleryPage() {
  return (
    <>
      <AppHeader title="Gallery" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Content Library</h2>
          <p className="text-sm text-muted-foreground">
            Browse all generated videos and images across your projects
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Images className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">Gallery is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generated videos and images from your projects will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
