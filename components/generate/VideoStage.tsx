"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ActionCard } from "./ActionCard";
import type { AnyRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

const MAX_REF_BYTES = 4 * 1024 * 1024;

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

  // Processing
  if (processing) {
    return (
      <div className="rounded-lg border border-line bg-soft p-6 flex flex-col items-center text-center">
        <Loader2 className="h-5 w-5 ink-3 nb-spin mb-2" />
        <div className="text-[14px] font-medium ink">
          Veo 3.1 is rendering…
        </div>
        <div className="text-[12px] ink-2 mt-1 max-w-[380px]">
          Usually 2–3 minutes. You can leave this page — the video shows up
          in your{" "}
          <Link href="/library" className="underline text-brand-ink">
            Library
          </Link>{" "}
          when it&apos;s ready.
        </div>
      </div>
    );
  }

  // Failed
  if (failed) {
    return (
      <div
        className="rounded-lg border p-4 flex items-start gap-3"
        style={{
          borderColor: "var(--nb-danger)",
          background: "oklch(0.97 0.02 25)",
        }}
      >
        <div style={{ color: "var(--nb-danger)" }}>
          <AlertTriangle className="h-[18px] w-[18px]" />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold ink">
            Veo couldn&apos;t finish this render
          </div>
          <div className="text-[12.5px] ink-2 mt-0.5">
            {errorMessage ?? "Try adjusting the blueprint and regenerate."}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onRedo}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-panel ink text-[12.5px] hover:bg-soft transition"
            >
              <RefreshCw className="h-3 w-3" />
              {COPY.videoStage.renderingTryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready
  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-[12px] ink-2">
          <Check
            className="h-3 w-3"
            style={{ color: "oklch(0.55 0.14 150)" }}
          />
          {COPY.videoStage.savedTo(projectMeta.name, ratio)}
        </div>
        <div className="flex justify-center">
          <video
            src={videoUrl}
            controls
            className={`w-full rounded-lg border border-line bg-black max-w-md shadow-card ${
              ratio === "16:9" ? "aspect-video" : "aspect-[9/16]"
            }`}
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onRedo}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
          >
            <RefreshCw className="h-3 w-3" />
            {COPY.videoStage.redo}
          </button>
          <a
            href={videoUrl}
            download
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
          >
            <Download className="h-3 w-3" />
            {COPY.videoStage.download}
          </a>
        </div>
      </div>
    );
  }

  // Input state
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] ink-3 mr-1">
          {COPY.videoStage.durationLabel}
        </span>
        <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
          {[4, 6, 8].map((d) => {
            const active = d === durationSeconds;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDurationChange(d as 4 | 6 | 8)}
                className={`px-2.5 h-7 rounded-md text-[12px] ${
                  active
                    ? "bg-panel shadow-card ink font-medium"
                    : "ink-3 hover:ink"
                }`}
              >
                {d}s
              </button>
            );
          })}
        </div>
      </div>

      {allowReferences && (
        <div className="rounded-lg border border-line-2 bg-soft p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12.5px] font-medium ink">
              {COPY.videoStage.referenceLabel}{" "}
              <span className="text-[11px] ink-3 font-normal">
                · {refPreviews.length}/3 · max 4 MB each
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {refPreviews.map((r, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.preview}
                  alt={`Reference ${i + 1}`}
                  className="h-20 w-20 rounded-md border border-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveReference(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-panel border border-line shadow-card flex items-center justify-center ink-2"
                  aria-label="Remove reference"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {refPreviews.length < 3 && (
              <>
                <input
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
                  className="w-20 h-20 rounded-md border border-dashed border-line hover:border-brand hover:bg-brand-soft flex flex-col items-center justify-center ink-3 text-[10.5px] transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span className="mt-0.5">Add</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ActionCard
          icon={<Wand2 className="h-[18px] w-[18px]" />}
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
          icon={<Upload className="h-[18px] w-[18px]" />}
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
    </div>
  );
}
