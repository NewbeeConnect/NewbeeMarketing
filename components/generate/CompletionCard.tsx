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
import { COPY } from "@/lib/i18n/copy";

/**
 * Her /generate koşusunun terminal ekranı. Başarı hero'su + asset preview(ler)
 * + aksiyon grid'i (canlandır / uzat / varyant / kütüphane / sıfırla).
 * Primary aksiyon intent'e göre değişir.
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
  const s = COPY.generate.steps.done;
  const goal = COPY.generate.steps.goal;
  const [resetOpen, setResetOpen] = useState(false);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;

  const heading =
    intent === "image"
      ? s.headingImage
      : intent === "video"
      ? s.headingVideo
      : s.headingPipeline;

  const kind = videoUrl ? s.kindVideo : s.kindImage;

  return (
    <>
      <div className="rounded-xl border border-line bg-panel p-5 slideFade">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "var(--nb-success-soft)",
              color: "var(--nb-success)",
            }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="serif text-[26px] ink">{heading}</div>
            <div className="text-[14.5px] ink-2 mt-0.5">
              {s.savedTo(projectMeta.name, kind, ratio)}
            </div>
          </div>
        </div>

        {/* Asset previews */}
        <div className="mt-5 flex flex-wrap gap-4 items-start justify-center">
          {imageUrl && (
            <div className="flex flex-col items-center gap-1.5">
              <PreviewImage
                src={imageUrl}
                ratio={ratio}
                alt="Üretilen görsel"
              />
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
              title={s.animateImageHint}
              className="btn btn-lg btn-primary col-span-1 sm:col-span-2"
            >
              <VideoIcon className="h-3.5 w-3.5" />
              {s.animateImage}
            </button>
          )}
          {onExtendVideo && videoUrl && (
            <button
              type="button"
              onClick={onExtendVideo}
              title={
                extendStale
                  ? s.extendVideoStaleHint
                  : s.extendVideoHint
              }
              className={`btn btn-lg ${
                extendStale ? "btn-secondary" : "btn-primary"
              }`}
            >
              <FastForward className="h-3.5 w-3.5" />
              {extendStale ? s.extendVideoStale : s.extendVideo}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onCreateVariant}
            title={s.createVariantHint}
            className="btn btn-lg btn-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {s.createVariant}
          </button>
          <Link
            href="/library"
            title="Kütüphane sayfasına git"
            className="btn btn-lg btn-secondary"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {s.openLibrary}
          </Link>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            title="Her şeyi temizle ve hedef seçim ekranına dön"
            className="btn btn-lg btn-ghost col-span-1 sm:col-span-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {s.startOver}
          </button>
        </div>

        {videoUrl && onExtendVideo && (
          <div className="mt-4 text-[13.5px] ink-3 text-center">
            {extendStale ? s.extendFootnoteStale : s.extendFootnoteFresh}
          </div>
        )}
        {onAnimateImage && imageUrl && !videoUrl && (
          <div className="mt-4 text-[13.5px] ink-3 text-center">
            {s.animateFootnote}
          </div>
        )}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{goal.changeConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {goal.changeConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{goal.changeConfirmCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setResetOpen(false);
                onStartOver();
              }}
            >
              {goal.changeConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
