"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FastForward,
  FolderOpen,
  RefreshCw,
  RotateCcw,
  Video as VideoIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PreviewImage } from "./PreviewImage";
import type { AnyRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

/**
 * Terminal state of every /generate run. Success hero at top + asset
 * preview(s) + action grid (animate / extend / variant / library / start
 * over). Primary action adapts to intent: image-only → animate; has video →
 * extend; otherwise "create variant".
 */
export function CompletionCard({
  intent,
  project,
  ratio,
  imageUrl,
  videoUrl,
  onCreateVariant,
  onStartOver,
  onExtendVideo,
  onAnimateImage,
  extendStale,
}: {
  intent: Intent;
  project: ProjectSlug;
  ratio: AnyRatio;
  imageUrl: string | null;
  videoUrl: string | null;
  onCreateVariant: () => void;
  onStartOver: () => void;
  onExtendVideo?: () => void;
  onAnimateImage?: () => void;
  extendStale?: boolean;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;

  const heading =
    intent === "image"
      ? COPY.completion.headingImage
      : intent === "video"
      ? COPY.completion.headingVideo
      : COPY.completion.headingPipeline;

  return (
    <>
      <div className="rounded-xl border border-line bg-panel p-5 slideFade">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "var(--nb-success-soft)",
              color: "oklch(0.45 0.15 150)",
            }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="serif text-[22px] ink">{heading}</div>
            <div className="text-[12.5px] ink-2 mt-0.5">
              Saved to Library · {projectMeta.name} /{" "}
              {videoUrl ? "Videos" : "Images"} / {ratio}
            </div>
          </div>
        </div>

        {/* Asset previews */}
        <div className="mt-5 flex flex-wrap gap-4 items-start justify-center">
          {imageUrl && (
            <div className="flex flex-col items-center gap-1.5">
              <PreviewImage src={imageUrl} ratio={ratio} alt="Generated image" />
            </div>
          )}
          {videoUrl && (
            <div className="flex flex-col items-center gap-1.5">
              <video
                src={videoUrl}
                controls
                className={`w-full rounded-lg border border-line bg-black max-w-md shadow-card ${
                  ratio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                }`}
              />
            </div>
          )}
        </div>

        {/* Action grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {onAnimateImage && imageUrl && !videoUrl && (
            <button
              type="button"
              onClick={onAnimateImage}
              className="col-span-1 sm:col-span-2 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-brand text-brand-ink text-[13.5px] font-semibold hover:brightness-95 transition"
            >
              <VideoIcon className="h-3.5 w-3.5" />
              Animate this image
            </button>
          )}
          {onExtendVideo && videoUrl && (
            <button
              type="button"
              onClick={onExtendVideo}
              title={
                extendStale
                  ? "This video may be past Veo's 2-day retention — extension might fail."
                  : undefined
              }
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-[13.5px] font-semibold transition ${
                extendStale
                  ? "border border-line bg-panel ink hover:bg-soft"
                  : "bg-brand text-brand-ink hover:brightness-95"
              }`}
            >
              <FastForward className="h-3.5 w-3.5" />
              {extendStale ? "Try to extend" : "Extend this video"}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onCreateVariant}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-line bg-panel ink text-[13.5px] hover:bg-soft transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {COPY.completion.variant}
          </button>
          <Link
            href="/library"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-line bg-panel ink text-[13.5px] hover:bg-soft transition"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {COPY.completion.library}
          </Link>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="col-span-1 sm:col-span-2 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg ink-2 text-[13.5px] hover:bg-soft transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {COPY.completion.startOver}
          </button>
        </div>

        {videoUrl && onExtendVideo && (
          <div className="mt-4 text-[11.5px] ink-3 text-center">
            {extendStale
              ? "Heads up: extension relies on Veo's 2-day URI retention — this video may be past it."
              : "Extend continues from the last frame of this clip. Available for ~2 days after render."}
          </div>
        )}
        {onAnimateImage && imageUrl && !videoUrl && (
          <div className="mt-4 text-[11.5px] ink-3 text-center">
            Animate turns this image into a 4–8 second clip — no need to
            re-write the brief.
          </div>
        )}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{COPY.change.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {COPY.change.confirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.change.confirmCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setResetOpen(false);
                onStartOver();
              }}
            >
              {COPY.change.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
