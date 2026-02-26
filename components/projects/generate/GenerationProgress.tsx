"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCheckVideoStatus } from "@/hooks/useVideoGeneration";
import { Video, Image, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Generation } from "@/types/database";

interface GenerationProgressProps {
  activeGenerations: Generation[];
  projectId: string;
}

const BASE_POLL_INTERVAL = 10000; // 10s
const MAX_POLL_INTERVAL = 60000; // 60s

export function GenerationProgress({
  activeGenerations,
  projectId,
}: GenerationProgressProps) {
  const checkStatus = useCheckVideoStatus();
  const [pollingErrors, setPollingErrors] = useState<Record<string, number>>({});
  const pollIntervalRef = useRef(BASE_POLL_INTERVAL);

  const pollActiveGenerations = useCallback(async () => {
    let hadError = false;

    for (const gen of activeGenerations) {
      if (gen.type === "video" && gen.status === "processing") {
        try {
          await checkStatus.mutateAsync({
            generationId: gen.id,
            projectId,
          });
          // Success - clear error count for this generation
          setPollingErrors((prev) => {
            if (!prev[gen.id]) return prev;
            const updated = { ...prev };
            delete updated[gen.id];
            return updated;
          });
        } catch (error) {
          hadError = true;
          const errorMsg = error instanceof Error ? error.message : "Connection lost";

          setPollingErrors((prev) => {
            const count = (prev[gen.id] || 0) + 1;
            // Show toast after 3 consecutive failures
            if (count === 3) {
              toast.error(`Video polling failed: ${errorMsg}`, {
                id: `poll-error-${gen.id}`,
                description: "Will keep retrying automatically.",
              });
            }
            return { ...prev, [gen.id]: count };
          });
        }
      }
    }

    // Adjust polling interval based on errors
    if (hadError) {
      pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, MAX_POLL_INTERVAL);
    } else {
      pollIntervalRef.current = BASE_POLL_INTERVAL;
    }
  }, [activeGenerations, projectId, checkStatus]);

  useEffect(() => {
    if (activeGenerations.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const schedulePoll = () => {
      timeoutId = setTimeout(async () => {
        await pollActiveGenerations();
        schedulePoll();
      }, pollIntervalRef.current);
    };

    schedulePoll();
    return () => clearTimeout(timeoutId);
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
          {activeGenerations.map((gen) => {
            const errorCount = pollingErrors[gen.id] || 0;

            return (
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
                {errorCount >= 3 && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Connection Issue
                  </Badge>
                )}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
