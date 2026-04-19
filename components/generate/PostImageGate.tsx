"use client";

import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PreviewImage } from "./PreviewImage";
import type { AnyRatio } from "@/lib/projects";
import { COPY } from "@/lib/generate/copy";

/**
 * Pipeline-only intermission between Stage 2 (image) and Stage 3 (video).
 * User sees the generated/uploaded image and decides whether to animate it
 * or stop with just the image.
 */
export function PostImageGate({
  imageUrl,
  ratio,
  onContinue,
  onStop,
}: {
  imageUrl: string;
  ratio: AnyRatio;
  onContinue: () => void;
  onStop: () => void;
}) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">
          {COPY.postImageGate.heading}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {COPY.postImageGate.sub}
        </p>
      </div>
      <PreviewImage src={imageUrl} ratio={ratio} alt="Stage 2 image" />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onContinue}>
          {COPY.postImageGate.continue}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
        <Button variant="outline" onClick={onStop}>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {COPY.postImageGate.stop}
        </Button>
      </div>
    </Card>
  );
}
