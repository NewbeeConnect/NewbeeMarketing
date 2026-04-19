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
import { COPY } from "@/lib/i18n/copy";

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
  const s = COPY.generate.steps.video;
  const videoFileInput = useRef<HTMLInputElement>(null);
  const refFileInput = useRef<HTMLInputElement>(null);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;
  const allowReferences = intent !== "pipeline";

  if (processing) {
    return (
      <div className="rounded-lg border border-line bg-soft p-6 flex flex-col items-center text-center">
        <Loader2 className="h-5 w-5 ink-3 nb-spin mb-2" />
        <div className="text-[16.5px] font-medium ink">{s.processingTitle}</div>
        <div className="text-[14px] ink-2 mt-1 max-w-[380px]">
          {s.processingBody.split("Kütüphane'de").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <Link
                  href="/library"
                  className="underline text-brand-ink"
                >
                  {s.processingLibraryLink}
                </Link>
              )}
              {i < arr.length - 1 && "'de"}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className="rounded-lg border p-4 flex items-start gap-3"
        style={{
          borderColor: "var(--nb-danger)",
          background: "var(--nb-danger-soft)",
        }}
      >
        <div style={{ color: "var(--nb-danger)" }}>
          <AlertTriangle className="h-[18px] w-[18px]" />
        </div>
        <div className="flex-1">
          <div className="text-[15.5px] font-semibold ink">
            {s.failedTitle}
          </div>
          <div className="text-[14.5px] ink-2 mt-0.5">
            {errorMessage ?? s.failedDefault}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onRedo}
              title="Yeni bir deneme başlat"
              className="btn btn-sm btn-secondary"
            >
              <RefreshCw className="h-3 w-3" />
              {s.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-[14px] ink-2">
          <Check
            className="h-3 w-3"
            style={{ color: "var(--nb-success)" }}
          />
          {s.savedTo(projectMeta.name, ratio)}
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
            title="Bu videoyu atıp yenisini üret"
            className="btn btn-md btn-secondary"
          >
            <RefreshCw className="h-3 w-3" />
            {s.redo}
          </button>
          <a
            href={videoUrl}
            download
            title="Bilgisayarına MP4 olarak indir"
            className="btn btn-md btn-secondary"
          >
            <Download className="h-3 w-3" />
            {s.download}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[13px] ink-3 mr-1"
          title={COPY.concepts.duration.long}
        >
          {s.durationLabel}
        </span>
        <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
          {[4, 6, 8].map((d) => {
            const active = d === durationSeconds;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDurationChange(d as 4 | 6 | 8)}
                title={`${d} saniyelik klip (yaklaşık $${(d * 0.4).toFixed(2)})`}
                className={`px-2.5 h-7 rounded-md text-[14px] ${
                  active
                    ? "bg-panel shadow-card ink font-medium"
                    : "ink-3 hover:ink"
                }`}
              >
                {d}sn
              </button>
            );
          })}
        </div>
      </div>

      {allowReferences && (
        <div className="rounded-lg border border-line-2 bg-soft p-3">
          <div className="flex items-center justify-between mb-2">
            <div
              className="text-[14.5px] font-medium ink"
              title={COPY.concepts.referenceImage.long}
            >
              {s.referenceLabel}{" "}
              <span className="text-[13px] ink-3 font-normal">
                · {refPreviews.length}/3 · her biri max 4 MB
              </span>
            </div>
          </div>
          <p className="text-[13px] ink-3 mb-2 leading-relaxed">
            {s.referenceHint}
          </p>
          <div className="flex flex-wrap gap-2">
            {refPreviews.map((r, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.preview}
                  alt={`Referans ${i + 1}`}
                  className="h-20 w-20 rounded-md border border-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveReference(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-panel border border-line shadow-card flex items-center justify-center ink-2"
                  aria-label="Referansı kaldır"
                  title="Referansı kaldır"
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
                          ? s.refsMaxToastOne
                          : s.refsMaxToastMany(rejectedOversize)
                      );
                    }
                    if (refFileInput.current) refFileInput.current.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => refFileInput.current?.click()}
                  title="Bir PNG/JPG yükle — modelin ilhama almak için kullanacağı referans"
                  className="w-20 h-20 rounded-md border border-dashed border-line hover:border-brand hover:bg-brand-soft flex flex-col items-center justify-center ink-3 text-[12px] transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span className="mt-0.5">Ekle</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ActionCard
          icon={<Wand2 className="h-[18px] w-[18px]" />}
          title={s.generateWithAi}
          body={
            intent === "pipeline"
              ? s.generateWithAiBodyPipeline
              : s.generateWithAiBodyStandalone
          }
          onClick={onGenerate}
          loading={aiLoading}
          primary
          titleAttr="Veo 3.1 modeline istek gider. İşlem 2-3 dakika. Saniye başına $0.40."
        />
        <ActionCard
          icon={<Upload className="h-[18px] w-[18px]" />}
          title={s.uploadMine}
          body={s.uploadMineBody}
          onClick={() => videoFileInput.current?.click()}
          loading={uploadLoading}
          titleAttr="Elindeki bir MP4/MOV dosyasını Kütüphane'ye ekle — AI atlanır"
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
