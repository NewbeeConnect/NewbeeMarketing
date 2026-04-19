"use client";

import { useRef } from "react";
import { Check, Download, RefreshCw, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionCard } from "./ActionCard";
import { PreviewImage } from "./PreviewImage";
import type { AnyRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

/**
 * Step 2 — Image. Two paths (AI, Upload) until we have an output; after
 * that, preview + Redo/Download.
 */
export function ImageStage({
  intent,
  project,
  ratio,
  imageUrl,
  onGenerate,
  onUploadFile,
  onRedo,
  aiLoading,
  uploadLoading,
}: {
  intent: Intent;
  project: ProjectSlug;
  ratio: AnyRatio;
  imageUrl: string | null;
  onGenerate: () => void;
  onUploadFile: (file: File) => void;
  onRedo: () => void;
  aiLoading: boolean;
  uploadLoading: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">{COPY.imageStage.heading}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {intent === "pipeline"
            ? COPY.imageStage.subPipeline
            : COPY.imageStage.subStandalone}
        </p>
      </div>

      {!imageUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ActionCard
            icon={<Wand2 className="h-5 w-5" />}
            title={COPY.imageStage.aiCardTitle}
            body={`${COPY.imageStage.aiCardBody} ${ratio}.`}
            onClick={onGenerate}
            loading={aiLoading}
            primary
          />
          <ActionCard
            icon={<Upload className="h-5 w-5" />}
            title={COPY.imageStage.uploadCardTitle}
            body={COPY.imageStage.uploadCardBody}
            onClick={() => fileInput.current?.click()}
            loading={uploadLoading}
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
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-600" />
            {COPY.imageStage.savedTo(projectMeta.name, ratio)}
          </div>
          <PreviewImage src={imageUrl} ratio={ratio} alt="Generated image" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRedo}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {COPY.imageStage.redo}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={imageUrl} download>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {COPY.imageStage.download}
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
