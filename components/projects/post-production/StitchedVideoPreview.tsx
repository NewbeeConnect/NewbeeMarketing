"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Film, Loader2 } from "lucide-react";
import type { Generation } from "@/types/database";

interface StitchedVideoPreviewProps {
  generations: Generation[];
  stitchedVideo: Generation | null;
  onStitch: () => void;
  isStitching: boolean;
}

export function StitchedVideoPreview({
  generations,
  stitchedVideo,
  onStitch,
  isStitching,
}: StitchedVideoPreviewProps) {
  const sceneVideos = generations.filter(
    (g) => g.type === "video" && g.status === "completed"
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Film className="h-4 w-4" />
            Video Preview
          </CardTitle>
          <Badge variant="outline">{sceneVideos.length} scenes</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={stitchedVideo ? "full" : "scenes"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full">Full Video</TabsTrigger>
            <TabsTrigger value="scenes">Per Scene</TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="space-y-3">
            {stitchedVideo?.output_url ? (
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  src={stitchedVideo.output_url}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-muted flex flex-col items-center justify-center aspect-video gap-3">
                <Play className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Stitch scenes to preview the full video
                </p>
                <Button
                  onClick={onStitch}
                  disabled={isStitching || sceneVideos.length === 0}
                >
                  {isStitching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Stitching...
                    </>
                  ) : (
                    <>
                      <Film className="h-4 w-4 mr-2" />
                      Stitch {sceneVideos.length} Scenes
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scenes">
            <div className="grid gap-3">
              {sceneVideos.map((gen, index) => (
                <div
                  key={gen.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  {gen.output_url ? (
                    <video
                      src={gen.output_url}
                      controls
                      className="w-32 h-18 rounded object-cover bg-black"
                    />
                  ) : (
                    <div className="w-32 h-18 rounded bg-muted flex items-center justify-center">
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {gen.prompt.substring(0, 60)}...
                    </p>
                    <div className="flex gap-2 mt-1">
                      {gen.language && (
                        <Badge variant="outline" className="text-xs">
                          {gen.language.toUpperCase()}
                        </Badge>
                      )}
                      {gen.platform && (
                        <Badge variant="outline" className="text-xs">
                          {gen.platform}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sceneVideos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed videos yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
