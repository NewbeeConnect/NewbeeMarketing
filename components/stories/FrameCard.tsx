"use client";

import Image from "next/image";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { StoryGeneration } from "@/hooks/useStory";

type Props = {
  index: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  generation: StoryGeneration | undefined;
  aspectRatio: "9:16" | "16:9" | "1:1";
  boundaryLabel: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
};

export function FrameCard({
  index,
  prompt,
  generation,
  aspectRatio,
  boundaryLabel,
  onPromptChange,
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

  return (
    <Card className="p-3 flex flex-col gap-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground">
          Frame {index}
        </div>
        <div className="text-[10px] text-muted-foreground/70" title={boundaryLabel}>
          {boundaryLabel}
        </div>
      </div>

      <div
        className={`relative ${aspectClass} w-full overflow-hidden rounded-md bg-muted/40 border border-border/70`}
      >
        {outputUrl ? (
          <Image
            src={outputUrl}
            alt={`Frame ${index}: ${prompt.slice(0, 80)}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {status === "processing" || status === "pending" ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> generating
              </span>
            ) : status === "failed" ? (
              <span className="text-destructive">failed</span>
            ) : (
              <span>no image yet</span>
            )}
          </div>
        )}
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={3}
        className="text-xs resize-none"
        placeholder="Frame prompt..."
      />

      <Button
        size="sm"
        variant={outputUrl ? "outline" : "default"}
        onClick={onGenerate}
        disabled={generating || !prompt.trim()}
        className="w-full"
      >
        {generating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Rendering
          </>
        ) : outputUrl ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </>
        )}
      </Button>
    </Card>
  );
}
