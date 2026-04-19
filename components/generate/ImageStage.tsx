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
import { COPY } from "@/lib/generate/copy";

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
  const fileInput = useRef<HTMLInputElement>(null);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isImageRatio = (IMAGE_RATIOS as readonly string[]).includes(ratio);

  // Progress placeholder while Nano Banana is painting.
  if (aiLoading) {
    return (
      <div className="rounded-lg border border-line bg-soft p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-5 w-5 ink-3 nb-spin" />
        <div className="text-[13px] ink mt-3 font-medium">
          Nano Banana 2 is painting…
        </div>
        <div className="text-[11.5px] ink-3 mt-1">
          Usually around 30 seconds.
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-[12px] ink-2">
          <Check
            className="h-3 w-3"
            style={{ color: "oklch(0.55 0.14 150)" }}
          />
          {COPY.imageStage.savedTo(projectMeta.name, ratio)}
        </div>
        <PreviewImage src={imageUrl} ratio={ratio} alt="Generated image" />
        <div className="flex items-center justify-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onRedo}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
          >
            <RefreshCw className="h-3 w-3" />
            {COPY.imageStage.redo}
          </button>
          <a
            href={imageUrl}
            download
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
          >
            <Download className="h-3 w-3" />
            {COPY.imageStage.download}
          </a>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[13px] font-semibold hover:brightness-95 transition"
            >
              {intent === "pipeline" ? "Continue to animate" : "Continue"}
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
          title={COPY.imageStage.aiCardTitle}
          body={`${COPY.imageStage.aiCardBody} ~30s, ${ratio}.`}
          onClick={onGenerate}
          loading={aiLoading}
          primary
        />
        <ActionCard
          icon={<Upload className="h-[18px] w-[18px]" />}
          title={COPY.imageStage.uploadCardTitle}
          body={COPY.imageStage.uploadCardBody}
          onClick={() => fileInput.current?.click()}
          loading={uploadLoading}
        />
        <ActionCard
          icon={<FolderOpen className="h-[18px] w-[18px]" />}
          title="Pick from library"
          body={`Reuse any ${ratio} image from ${projectMeta.name}.`}
          onClick={() => setLibraryOpen(true)}
          disabled={!isImageRatio}
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
