"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FolderOpen,
  Loader2,
  RefreshCw,
  Upload,
  Wand2,
} from "lucide-react";
import { ActionCard } from "./ActionCard";
import { PreviewImage } from "./PreviewImage";
import { LibraryPickerDialog } from "./LibraryPickerDialog";
import type { AnyRatio, ImageRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS, IMAGE_RATIOS } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { COPY } from "@/lib/i18n/copy";

export function ImageStage({
  intent,
  project,
  ratio,
  imageUrl,
  onGenerate,
  onUploadFile,
  onPickFromLibrary,
  onRedo,
  onContinue,
  aiLoading,
  uploadLoading,
}: {
  intent: Intent;
  project: ProjectSlug;
  ratio: AnyRatio;
  imageUrl: string | null;
  onGenerate: () => void;
  onUploadFile: (file: File) => void;
  onPickFromLibrary: (url: string) => void;
  onRedo: () => void;
  onContinue?: () => void;
  aiLoading: boolean;
  uploadLoading: boolean;
}) {
  const s = COPY.generate.steps.image;
  const fileInput = useRef<HTMLInputElement>(null);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isImageRatio = (IMAGE_RATIOS as readonly string[]).includes(ratio);

  if (aiLoading) {
    return (
      <div className="rounded-lg border border-line bg-soft p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-5 w-5 ink-3 nb-spin" />
        <div className="text-[15px] ink mt-3 font-medium">{s.loading}</div>
        <div className="text-[13.5px] ink-3 mt-1">{s.loadingSub}</div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-[14px] ink-2">
          <Check
            className="h-3 w-3"
            style={{ color: "var(--nb-success)" }}
          />
          {s.savedTo(projectMeta.name, ratio)}
        </div>
        <PreviewImage src={imageUrl} ratio={ratio} alt="Üretilen görsel" />
        <div className="flex items-center justify-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onRedo}
            title="Bu görseli atıp yenisini üret"
            className="btn btn-md btn-secondary"
          >
            <RefreshCw className="h-3 w-3" />
            {s.redo}
          </button>
          <a
            href={imageUrl}
            download
            title="Bilgisayarına PNG olarak indir"
            className="btn btn-md btn-secondary"
          >
            <Download className="h-3 w-3" />
            {s.download}
          </a>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              title={
                intent === "pipeline"
                  ? "Videoyu canlandır adımına geç"
                  : "Tamamlama ekranına geç"
              }
              className="btn btn-md btn-primary"
            >
              {intent === "pipeline" ? s.continueButtonPipeline : s.continueButton}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ActionCard
          icon={<Wand2 className="h-[18px] w-[18px]" />}
          title={s.generateWithAi}
          body={`${s.generateWithAiBody} ${ratio}.`}
          onClick={onGenerate}
          loading={aiLoading}
          primary
          titleAttr="Nano Banana 2 prompt'tan yeni bir görsel üretir (~30sn, $0.04)"
        />
        <ActionCard
          icon={<Upload className="h-[18px] w-[18px]" />}
          title={s.uploadMine}
          body={s.uploadMineBody}
          onClick={() => fileInput.current?.click()}
          loading={uploadLoading}
          titleAttr="Elindeki bir PNG/JPG dosyasını Kütüphane'ye ekle — AI atlanır"
        />
        <ActionCard
          icon={<FolderOpen className="h-[18px] w-[18px]" />}
          title={s.pickFromLibrary}
          body={s.pickFromLibraryBody(projectMeta.name, ratio)}
          onClick={() => setLibraryOpen(true)}
          disabled={!isImageRatio}
          titleAttr="Daha önce üretilmiş/yüklenmiş bir görseli tekrar kullan — yeni maliyet yok"
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadFile(f);
            if (fileInput.current) fileInput.current.value = "";
          }}
        />
        {isImageRatio && (
          <LibraryPickerDialog
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            project={project}
            ratio={ratio as ImageRatio}
            onPick={onPickFromLibrary}
          />
        )}
      </div>
    </div>
  );
}
