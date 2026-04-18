"use client";

import { Loader2, PlayCircle, RefreshCw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { StoryGeneration } from "@/hooks/useStory";

type Props = {
  index: 1 | 2 | 3 | 4;
  script: string;
  generation: StoryGeneration | undefined;
  aspectRatio: "9:16" | "16:9" | "1:1";
  framesReady: boolean;
  onScriptChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
};

export function ClipCard({
  index,
  script,
  generation,
  aspectRatio,
  framesReady,
  onScriptChange,
  onGenerate,
  generating,
}: Props) {
  const aspectClass =
    aspectRatio === "16:9"
      ? "aspect-video"
      : aspectRatio === "1:1"
      ? "aspect-square"
      : "aspect-[9/16]";

  const status = generation?.status;
  const outputUrl = generation?.output_url ?? null;
  const isProcessing = status === "processing" || status === "pending";

  return (
    <Card className="p-3 flex flex-col gap-3 bg-card border-border">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Video className="h-3.5 w-3.5 text-primary" />
        Clip {index}
      </div>

      <div
        className={`relative ${aspectClass} w-full overflow-hidden rounded-md bg-black border border-border/70`}
      >
        {outputUrl ? (
          <video
            src={outputUrl}
            controls
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Veo rendering…
              </span>
            ) : status === "failed" ? (
              <span className="text-destructive text-center px-2">
                failed — regenerate
              </span>
            ) : (
              <span>uses frames {index} → {index + 1}</span>
            )}
          </div>
        )}
      </div>

      <Textarea
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        rows={3}
        className="text-xs resize-none"
        placeholder="What happens between frame N and N+1..."
      />

      <Button
        size="sm"
        variant={outputUrl ? "outline" : "default"}
        onClick={onGenerate}
        disabled={generating || isProcessing || !framesReady || !script.trim()}
        className="w-full"
      >
        {generating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Starting
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Rendering
          </>
        ) : outputUrl ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </>
        ) : framesReady ? (
          <>
            <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </>
        ) : (
          <>Frames needed</>
        )}
      </Button>
    </Card>
  );
}
