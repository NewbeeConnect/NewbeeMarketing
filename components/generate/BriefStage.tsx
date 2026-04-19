"use client";

import {
  Check,
  Dices,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Video as VideoIcon,
} from "lucide-react";
import { FieldsEditor } from "./FieldsEditor";
import { COPY } from "@/lib/generate/copy";
import type { Intent } from "@/lib/generate/machine";
import type { ProjectSlug } from "@/lib/projects";
import type {
  ImagePromptFields,
  VideoPromptFields,
} from "@/hooks/useGeneration";

const IMAGE_FIELD_LABELS: {
  key: keyof ImagePromptFields & string;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject", hint: "Who or what, doing what" },
  { key: "style", label: "Style", hint: "Editorial, minimal, analog…" },
  { key: "composition", label: "Composition", hint: "Shot type, framing, angle" },
  { key: "lighting", label: "Lighting", hint: "Direction, color, quality" },
  { key: "mood", label: "Mood & palette", hint: "Tone + dominant colors" },
  { key: "technical", label: "Technical", hint: "Lens, DOF, focus cues" },
];

const VIDEO_FIELD_LABELS: {
  key: keyof VideoPromptFields & string;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject + opening", hint: "Who/what in the first frame" },
  { key: "camera", label: "Camera", hint: "Dolly-in, handheld, orbit…" },
  { key: "action", label: "Action", hint: "What changes during the clip" },
  { key: "lighting", label: "Lighting", hint: "Direction, color, evolution" },
  { key: "mood", label: "Mood & palette", hint: "Emotional tone" },
  { key: "audio", label: "Audio", hint: "Silent, piano, room tone…" },
];

/**
 * Step 2 — Brief + blueprint(s). For pipeline intent shows both blueprints
 * under an underline-style tab strip. Asset lock editor sits below (rendered
 * by the page orchestrator — this component only owns brief + blueprint).
 */
export function BriefStage({
  intent,
  project,
  brief,
  onBriefChange,
  imageFields,
  onImageFieldsChange,
  videoFields,
  onVideoFieldsChange,
  onFillImage,
  onFillVideo,
  aiLoading,
  imageReady,
  videoReady,
  pipelineTab,
  onPipelineTabChange,
  onRollDice,
  diceLoading,
  onRegenerateImageField,
  onRegenerateVideoField,
  regeneratingImageField,
  regeneratingVideoField,
}: {
  intent: Intent;
  project: ProjectSlug;
  brief: string;
  onBriefChange: (v: string) => void;
  imageFields: ImagePromptFields;
  onImageFieldsChange: (k: keyof ImagePromptFields & string, v: string) => void;
  videoFields: VideoPromptFields;
  onVideoFieldsChange: (k: keyof VideoPromptFields & string, v: string) => void;
  onFillImage: () => void;
  onFillVideo: () => void;
  aiLoading: boolean;
  imageReady: boolean;
  videoReady: boolean;
  pipelineTab: "image" | "video";
  onPipelineTabChange: (t: "image" | "video") => void;
  onRollDice: () => void;
  diceLoading: boolean;
  onRegenerateImageField?: (k: keyof ImagePromptFields & string) => void;
  onRegenerateVideoField?: (k: keyof VideoPromptFields & string) => void;
  regeneratingImageField?: (keyof ImagePromptFields & string) | null;
  regeneratingVideoField?: (keyof VideoPromptFields & string) | null;
}) {
  const placeholder = COPY.briefPlaceholders[project][intent];
  const showImageBP = intent === "image" || intent === "pipeline";
  const showVideoBP = intent === "video" || intent === "pipeline";

  return (
    <div className="space-y-4">
      {/* Brief panel */}
      <div className="rounded-lg border border-line bg-panel p-3">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="brief-textarea"
            className="text-[12px] font-medium ink-2"
          >
            {COPY.brief.label}
          </label>
          <button
            type="button"
            onClick={onRollDice}
            disabled={diceLoading}
            className="text-[11.5px] ink-3 hover:text-brand-ink flex items-center gap-1 whitespace-nowrap disabled:opacity-40"
          >
            {diceLoading ? (
              <Loader2 className="h-3 w-3 nb-spin" />
            ) : (
              <Dices className="h-3 w-3" />
            )}
            {diceLoading ? COPY.brief.rollingDice : COPY.brief.rollDiceButton}
          </button>
        </div>
        <textarea
          id="brief-textarea"
          rows={5}
          placeholder={placeholder}
          value={brief}
          onChange={(e) => onBriefChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md border border-line bg-panel text-[13.5px] ink outline-none resize-none focus:border-brand"
        />
      </div>

      {/* Blueprint */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-[12.5px] font-semibold ink">Blueprint</div>
            {(imageReady || videoReady) && (
              <span
                className="inline-flex items-center gap-1 px-2 h-6 text-[11px] rounded-md border"
                style={{
                  background: "var(--nb-success-soft)",
                  borderColor: "transparent",
                  color: "var(--nb-success-ink)",
                }}
              >
                <Check className="h-2.5 w-2.5" /> Ready
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={
              intent === "video"
                ? onFillVideo
                : intent === "pipeline" && pipelineTab === "video"
                ? onFillVideo
                : onFillImage
            }
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-panel text-[12.5px] ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {aiLoading ? (
              <Loader2 className="h-3 w-3 nb-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {aiLoading ? COPY.brief.drafting : COPY.brief.draftButton}
          </button>
        </div>

        {intent === "pipeline" ? (
          <>
            <div className="flex items-center gap-1 mb-2 border-b border-line-2">
              {(
                [
                  { k: "image" as const, l: "Image blueprint", ready: imageReady },
                  { k: "video" as const, l: "Video blueprint", ready: videoReady },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  onClick={() => onPipelineTabChange(t.k)}
                  className={`px-3 h-8 text-[12.5px] relative inline-flex items-center gap-1.5 ${
                    pipelineTab === t.k
                      ? "ink font-medium"
                      : "ink-3 hover:ink"
                  }`}
                >
                  {t.l}
                  {t.ready && (
                    <Check
                      className="h-3 w-3"
                      style={{ color: "var(--nb-success)" }}
                    />
                  )}
                  {pipelineTab === t.k && (
                    <div className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />
                  )}
                </button>
              ))}
            </div>
            {pipelineTab === "image" ? (
              <FieldsEditor<ImagePromptFields>
                title="Image blueprint"
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                fieldList={IMAGE_FIELD_LABELS}
                values={imageFields}
                onChange={onImageFieldsChange}
                onFillAI={onFillImage}
                aiLoading={aiLoading}
                ready={imageReady}
                onRegenerateField={onRegenerateImageField}
                regeneratingField={regeneratingImageField}
                hideHeader
              />
            ) : (
              <FieldsEditor<VideoPromptFields>
                title="Video blueprint"
                icon={<VideoIcon className="h-3.5 w-3.5" />}
                fieldList={VIDEO_FIELD_LABELS}
                values={videoFields}
                onChange={onVideoFieldsChange}
                onFillAI={onFillVideo}
                aiLoading={aiLoading}
                ready={videoReady}
                onRegenerateField={onRegenerateVideoField}
                regeneratingField={regeneratingVideoField}
                hideHeader
              />
            )}
          </>
        ) : showImageBP ? (
          <FieldsEditor<ImagePromptFields>
            title="Image blueprint"
            icon={<ImageIcon className="h-3.5 w-3.5" />}
            fieldList={IMAGE_FIELD_LABELS}
            values={imageFields}
            onChange={onImageFieldsChange}
            onFillAI={onFillImage}
            aiLoading={aiLoading}
            ready={imageReady}
            onRegenerateField={onRegenerateImageField}
            regeneratingField={regeneratingImageField}
            hideHeader
          />
        ) : showVideoBP ? (
          <FieldsEditor<VideoPromptFields>
            title="Video blueprint"
            icon={<VideoIcon className="h-3.5 w-3.5" />}
            fieldList={VIDEO_FIELD_LABELS}
            values={videoFields}
            onChange={onVideoFieldsChange}
            onFillAI={onFillVideo}
            aiLoading={aiLoading}
            ready={videoReady}
            onRegenerateField={onRegenerateVideoField}
            regeneratingField={regeneratingVideoField}
            hideHeader
          />
        ) : null}
      </div>
    </div>
  );
}
