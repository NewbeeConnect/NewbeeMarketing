"use client";

import { useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCheckVideoStatus } from "@/hooks/useVideoGeneration";
import { Video, Image, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import type { Generation } from "@/types/database";

interface GenerationProgressProps {
  activeGenerations: Generation[];
  projectId: string;
}

export function GenerationProgress({
  activeGenerations,
  projectId,
}: GenerationProgressProps) {
  const checkStatus = useCheckVideoStatus();

  const pollActiveGenerations = useCallback(async () => {
    for (const gen of activeGenerations) {
      if (gen.type === "video" && gen.status === "processing") {
        try {
          await checkStatus.mutateAsync({
            generationId: gen.id,
            projectId,
          });
        } catch {
          // Silently handle polling errors
        }
      }
    }
  }, [activeGenerations, projectId, checkStatus]);

  useEffect(() => {
    if (activeGenerations.length === 0) return;

    const interval = setInterval(pollActiveGenerations, 10000);
    return () => clearInterval(interval);
  }, [activeGenerations.length, pollActiveGenerations]);

  if (activeGenerations.length === 0) return null;

  return (
    <Card className="border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <CardTitle className="text-base">Active Generations</CardTitle>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            {activeGenerations.length} in progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeGenerations.map((gen) => (
            <div
              key={gen.id}
              className="flex items-center gap-3 rounded-md bg-muted/50 p-3 text-sm"
            >
              {gen.type === "video" ? (
                <Video className="h-4 w-4 text-blue-500" />
              ) : gen.type === "image" ? (
                <Image className="h-4 w-4 text-purple-500" />
              ) : gen.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : gen.status === "failed" ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium capitalize">{gen.type}</span>
                <span className="text-muted-foreground mx-2">-</span>
                <span className="text-muted-foreground truncate">
                  {gen.prompt.substring(0, 60)}...
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  checkStatus.mutate({
                    generationId: gen.id,
                    projectId,
                  })
                }
                disabled={checkStatus.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
