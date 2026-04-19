"use client";

import { ArrowRight, Check, Film } from "lucide-react";
import { PreviewImage } from "./PreviewImage";
import type { AnyRatio } from "@/lib/projects";

/**
 * Pipeline-only intermission between the image and video stages. Shows the
 * just-generated image and a binary question: animate it into a clip, or
 * stop and save just the still?
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
    <div className="space-y-3">
      <PreviewImage src={imageUrl} ratio={ratio} alt="Stage 2 image" />
      <div className="text-center text-[12.5px] ink-2">
        Animate this image into a clip, or save just the still?
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
        >
          <Check className="h-3 w-3" />
          Save just the image
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[13px] font-semibold hover:brightness-95 transition"
        >
          <Film className="h-3 w-3" />
          Continue and animate it
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
