"use client";

import { useRef } from "react";
import {
  Check,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Matches backend base64 cap; leave ~1 MB margin for the base64 overhead.
const MAX_REF_BYTES = 4 * 1024 * 1024;
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionCard } from "./ActionCard";
import type { AnyRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

/**
 * Step 3 (pipeline) or Step 2 (video intent). Shows duration picker, optional
 * reference images (non-pipeline only), AI vs Upload cards, polling state,
 * and the final preview.
 */
export function VideoStage({
  intent,
  project,
  ratio,
  durationSeconds,
  onDurationChange,
  refPreviews,
  onAddReference,
  onRemoveReference,
  onGenerate,
  onUploadFile,
  onRedo,
  aiLoading,
  uploadLoading,
  processing,
  failed,
  errorMessage,
  videoUrl,
}: {
  intent: Intent;
  project: ProjectSlug;
  ratio: AnyRatio;
  durationSeconds: 4 | 6 | 8;
  onDurationChange: (d: 4 | 6 | 8) => void;
  refPreviews: { file: File; preview: string }[];
  onAddReference: (file: File) => Promise<void> | void;
  onRemoveReference: (index: number) => void;
  onGenerate: () => void;
  onUploadFile: (file: File) => void;
  onRedo: () => void;
  aiLoading: boolean;
  uploadLoading: boolean;
  processing: boolean;
  failed: boolean;
  errorMessage: string | null | undefined;
  videoUrl: string | null;
}) {
  const videoFileInput = useRef<HTMLInputElement>(null);
  const refFileInput = useRef<HTMLInputElement>(null);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;
  const allowReferences = intent !== "pipeline";

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">{COPY.videoStage.heading}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {COPY.videoStage.sub}
        </p>
      </div>

      {/* Controls: duration + (non-pipeline) reference image upload */}
      {!videoUrl && !processing && !failed && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>{COPY.videoStage.durationLabel}</Label>
              <Select
                value={String(durationSeconds)}
                onValueChange={(v) =>
                  onDurationChange(Number(v) as 4 | 6 | 8)
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4s</SelectItem>
                  <SelectItem value="6">6s</SelectItem>
                  <SelectItem value="8">8s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {allowReferences && (
            <div className="space-y-2">
              <Label>{COPY.videoStage.referenceLabel}</Label>
              <div className="flex flex-wrap items-center gap-3">
                {refPreviews.map((r, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 rounded-md overflow-hidden border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.preview}
                      alt={`reference ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveReference(i)}
                      className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
                      aria-label="Remove reference"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {refPreviews.length < 3 && (
                  <>
                    <Input
                      ref={refFileInput}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        let rejectedOversize = 0;
                        for (const f of files) {
                          if (refPreviews.length + files.indexOf(f) >= 3) break;
                          if (!f.type.startsWith("image/")) continue;
                          if (f.size > MAX_REF_BYTES) {
                            rejectedOversize++;
                            continue;
                          }
                          await onAddReference(f);
                        }
                        if (rejectedOversize > 0) {
                          toast.error(
                            rejectedOversize === 1
                              ? "Reference too large — max 4 MB per image."
                              : `${rejectedOversize} images skipped — max 4 MB each.`
                          );
                        }
                        if (refFileInput.current) refFileInput.current.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => refFileInput.current?.click()}
                      className="h-20 w-20 rounded-md border border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-muted/40"
                    >
                      <Upload className="h-4 w-4 mb-1" />
                      Add
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {COPY.videoStage.referenceHint}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              icon={<Wand2 className="h-5 w-5" />}
              title={COPY.videoStage.aiCardTitle}
              body={
                intent === "pipeline"
                  ? COPY.videoStage.aiCardBodyPipeline
                  : COPY.videoStage.aiCardBodyStandalone
              }
              onClick={onGenerate}
              loading={aiLoading}
              primary
            />
            <ActionCard
              icon={<Upload className="h-5 w-5" />}
              title={COPY.videoStage.uploadCardTitle}
              body={COPY.videoStage.uploadCardBody}
              onClick={() => videoFileInput.current?.click()}
              loading={uploadLoading}
            />
            <input
              ref={videoFileInput}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadFile(f);
                if (videoFileInput.current) videoFileInput.current.value = "";
              }}
            />
          </div>
        </>
      )}

      {/* Polling state */}
      {processing && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin mt-0.5 shrink-0" />
          <span>
            {COPY.videoStage.rendering.replace(
              "Library",
              "__LIBRARY_LINK__"
            ).split("__LIBRARY_LINK__").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <Link href="/library" className="underline">
                    Library
                  </Link>
                )}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Failed */}
      {failed && (
        <div className="space-y-3">
          <p className="text-sm text-destructive">
            {COPY.videoStage.renderingFailed}: {errorMessage ?? "unknown error"}
          </p>
          <Button variant="outline" size="sm" onClick={onRedo}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {COPY.videoStage.renderingTryAgain}
          </Button>
        </div>
      )}

      {/* Done */}
      {videoUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-600" />
            {COPY.videoStage.savedTo(projectMeta.name, ratio)}
          </div>
          <video
            src={videoUrl}
            controls
            className={`w-full rounded-md bg-black max-w-md ${
              ratio === "16:9" ? "aspect-video" : "aspect-[9/16]"
            }`}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRedo}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {COPY.videoStage.redo}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={videoUrl} download>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {COPY.videoStage.download}
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
