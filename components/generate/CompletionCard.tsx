"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FastForward,
  FolderOpen,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
 * Final state of any pipeline. Shows the asset(s) + three next-actions:
 *   - Create another variant (keeps intent, brief, blueprint; resets outputs)
 *   - Open in Library
 *   - Start over (full reset, confirm dialog)
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
}: {
  intent: Intent;
  project: ProjectSlug;
  ratio: AnyRatio;
  imageUrl: string | null;
  videoUrl: string | null;
  onCreateVariant: () => void;
  onStartOver: () => void;
  /**
   * Only provided when a video exists and is still within Veo's 2-day
   * retention window. Starts a new cycle that extends from this video's
   * last frame.
   */
  onExtendVideo?: () => void;
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
      <Card className="p-5 space-y-4 border-green-600/40 bg-green-50/40 dark:bg-green-950/20">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold">{heading}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filed under <span className="font-medium text-foreground">
                {projectMeta.name}
              </span>{" "}
              at {ratio}.
            </p>
          </div>
        </div>

        {/* Asset previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {imageUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Image</p>
              <PreviewImage src={imageUrl} ratio={ratio} alt="Generated image" />
            </div>
          )}
          {videoUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Video</p>
              <video
                src={videoUrl}
                controls
                className={`w-full rounded-md bg-black max-w-md ${
                  ratio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                }`}
              />
            </div>
          )}
        </div>

        {/* Next actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onExtendVideo && videoUrl && (
            <Button onClick={onExtendVideo}>
              <FastForward className="h-3.5 w-3.5 mr-1.5" />
              Extend this video
            </Button>
          )}
          <Button
            variant={onExtendVideo && videoUrl ? "outline" : "default"}
            onClick={onCreateVariant}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {COPY.completion.variant}
          </Button>
          <Button asChild variant="outline">
            <Link href="/library">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              {COPY.completion.library}
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {COPY.completion.startOver}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {onExtendVideo && videoUrl
            ? "Extend continues from the last frame of this clip (available for ~2 days after render)."
            : COPY.completion.variantHint}
        </p>
      </Card>

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
