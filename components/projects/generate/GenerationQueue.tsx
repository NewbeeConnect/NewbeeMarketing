"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw, FastForward } from "lucide-react";
import { useRetryVideoGeneration, useExtendVideo } from "@/hooks/useVideoGeneration";
import { toast } from "sonner";
import type { Generation } from "@/types/database";

interface GenerationQueueProps {
  generations: Generation[];
  totalExpected: number;
  projectId: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  queued: { icon: Clock, label: "Queued", color: "text-yellow-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500" },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500" },
} as const;

export function GenerationQueue({
  generations,
  totalExpected,
  projectId,
}: GenerationQueueProps) {
  const retryGeneration = useRetryVideoGeneration();
  const extendVideo = useExtendVideo();
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Generation | null>(null);
  const [extendPrompt, setExtendPrompt] = useState("");

  const completed = generations.filter((g) => g.status === "completed").length;
  const failed = generations.filter((g) => g.status === "failed").length;
  const processing = generations.filter(
    (g) => g.status === "processing" || g.status === "queued"
  ).length;
  const pending = generations.filter((g) => g.status === "pending").length;
  const progress =
    totalExpected > 0
      ? Math.round(((completed + failed) / totalExpected) * 100)
      : 0;

  const handleRetry = async (generationId: string) => {
    try {
      await retryGeneration.mutateAsync({ generationId, projectId });
      toast.success("Retrying generation...");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retry");
    }
  };

  const openExtendDialog = (gen: Generation) => {
    setExtendTarget(gen);
    setExtendPrompt(gen.prompt);
    setExtendDialogOpen(true);
  };

  const handleExtend = async () => {
    if (!extendTarget || !extendPrompt.trim()) return;
    try {
      await extendVideo.mutateAsync({
        sourceGenerationId: extendTarget.id,
        prompt: extendPrompt.trim(),
        projectId,
      });
      toast.success("Extending video...");
      setExtendDialogOpen(false);
      setExtendTarget(null);
      setExtendPrompt("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extend video");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Generation Queue</CardTitle>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <Badge variant="outline">{pending} pending</Badge>
            )}
            {processing > 0 && (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                {processing} processing
              </Badge>
            )}
            {completed > 0 && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                {completed} done
              </Badge>
            )}
            {failed > 0 && (
              <Badge variant="destructive">{failed} failed</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {completed + failed}/{totalExpected} ({progress}%)
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Individual Generations */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {generations.map((gen) => {
            const config = STATUS_CONFIG[gen.status];
            const Icon = config.icon;
            const genConfig = gen.config as {
              aspect_ratio?: string;
              duration_seconds?: number;
            } | null;

            return (
              <div
                key={gen.id}
                className="flex items-center gap-3 rounded-md border p-3 text-sm"
              >
                <Icon
                  className={`h-4 w-4 ${config.color} ${
                    gen.status === "processing" ? "animate-spin" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{gen.type}</span>
                    {gen.platform && (
                      <Badge variant="outline" className="text-xs">
                        {gen.platform}
                      </Badge>
                    )}
                    {gen.language && (
                      <Badge variant="outline" className="text-xs">
                        {gen.language.toUpperCase()}
                      </Badge>
                    )}
                    {genConfig?.aspect_ratio && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {genConfig.aspect_ratio}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {gen.prompt.substring(0, 80)}
                    {gen.prompt.length > 80 ? "..." : ""}
                  </p>
                  {gen.status === "failed" && gen.error_message && (
                    <p className="text-xs text-red-500 truncate mt-0.5">
                      {gen.error_message}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  {gen.status === "failed" && gen.type === "video" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetry(gen.id)}
                      disabled={retryGeneration.isPending}
                      title="Retry generation"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${retryGeneration.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                  {gen.status === "completed" && gen.type === "video" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openExtendDialog(gen)}
                      disabled={extendVideo.isPending}
                      title="Extend video"
                    >
                      <FastForward className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {gen.actual_cost_usd != null ? (
                  <p className="text-xs text-muted-foreground shrink-0">
                    ${gen.actual_cost_usd.toFixed(2)}
                  </p>
                ) : gen.estimated_cost_usd != null ? (
                  <p className="text-xs text-muted-foreground shrink-0">
                    ~${gen.estimated_cost_usd.toFixed(2)}
                  </p>
                ) : null}
              </div>
            );
          })}

          {generations.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No generations started yet. Configure the batch matrix and click
              &quot;Start Generation&quot;.
            </div>
          )}
        </div>
      </CardContent>

      {/* Extend Video Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Video</DialogTitle>
            <DialogDescription>
              Continue this video with a new or modified prompt. The extension will pick up where the original video ended.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={extendPrompt}
            onChange={(e) => setExtendPrompt(e.target.value)}
            placeholder="Enter the prompt for the extended video..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtend}
              disabled={extendVideo.isPending || !extendPrompt.trim()}
            >
              {extendVideo.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <FastForward className="mr-2 h-4 w-4" />
                  Extend
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
