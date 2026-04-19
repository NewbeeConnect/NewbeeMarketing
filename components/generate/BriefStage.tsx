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
import { COPY } from "@/lib/i18n/copy";
import type { Intent } from "@/lib/generate/machine";
import type {
  ImagePromptFields,
  VideoPromptFields,
} from "@/hooks/useGeneration";

const IMAGE_FIELD_LABELS = COPY.generate.imageFields;
const VIDEO_FIELD_LABELS = COPY.generate.videoFields;

/**
 * Step 2 — Brief + Şema. Pipeline intent'inde her iki şemayı underline-tab
 * altında gösterir. Sabit tutulacak görseller editörü aşağıda (page
 * orchestrator tarafından renderlenir; bu component yalnız brief + şema).
 */
export function BriefStage({
  intent,
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
  const s = COPY.generate.steps.brief;
  const placeholder = COPY.generate.briefPlaceholder[intent];
  const showImageBP = intent === "image" || intent === "pipeline";
  const showVideoBP = intent === "video" || intent === "pipeline";

  const fillForTab =
    intent === "video"
      ? onFillVideo
      : intent === "pipeline" && pipelineTab === "video"
      ? onFillVideo
      : onFillImage;

  return (
    <div className="space-y-4">
      {/* Brief panel */}
      <div className="rounded-lg border border-line bg-panel p-3">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="brief-textarea"
            className="text-[14px] font-medium ink-2"
            title={COPY.concepts.brief.long}
          >
            {s.briefLabel}
          </label>
          <button
            type="button"
            onClick={onRollDice}
            disabled={diceLoading}
            title="Gemini brand profiline bakıp on-brand bir brief yazar. Tekrar basarsan farklı bir açı dener."
            className="text-[13.5px] ink-3 hover:text-brand-ink flex items-center gap-1 whitespace-nowrap disabled:opacity-40"
          >
            {diceLoading ? (
              <Loader2 className="h-3 w-3 nb-spin" />
            ) : (
              <Dices className="h-3 w-3" />
            )}
            {diceLoading ? s.briefRolling : s.briefRollDice}
          </button>
        </div>
        <textarea
          id="brief-textarea"
          rows={5}
          placeholder={placeholder}
          value={brief}
          onChange={(e) => onBriefChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-md border border-line bg-panel text-[15.5px] ink outline-none resize-none focus:border-brand"
        />
        <p className="text-[13px] ink-3 mt-1.5 leading-relaxed">
          {COPY.concepts.brief.short}
        </p>
      </div>

      {/* Blueprint */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div
              className="text-[14.5px] font-semibold ink whitespace-nowrap"
              title={COPY.concepts.blueprint.long}
            >
              {s.blueprintLabel}
            </div>
            <span className="text-[13.5px] ink-3">· {s.blueprintHint}</span>
            {(imageReady || videoReady) && (
              <span
                className="inline-flex items-center gap-1 px-2 h-6 text-[13px] rounded-md border"
                style={{
                  background: "var(--nb-success-soft)",
                  borderColor: "transparent",
                  color: "var(--nb-success-ink)",
                }}
              >
                <Check className="h-2.5 w-2.5" /> {s.blueprintReady}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={fillForTab}
            disabled={aiLoading}
            title="Brief'ini alıp tüm şema alanlarını Gemini ile otomatik doldur"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-panel text-[14.5px] ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {aiLoading ? (
              <Loader2 className="h-3 w-3 nb-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {aiLoading ? s.drafting : s.draftWithGemini}
          </button>
        </div>

        {/* Post-draft inspection banner — shown the moment Gemini has
             filled at least one field relevant to the active intent, so the
             user doesn't stop at the "Gemini doldurdu" chip and miss that
             the fields below ARE the AI output and ARE editable. */}
        {((intent === "image" && imageReady) ||
          (intent === "video" && videoReady) ||
          (intent === "pipeline" && (imageReady || videoReady))) && (
          <div
            className="rounded-md border-l-2 border-brand bg-brand-soft text-brand-ink px-3 py-2 text-[13px] leading-relaxed mb-2"
          >
            {s.blueprintReadyNote}
          </div>
        )}

        {intent === "pipeline" ? (
          <>
            <div className="flex items-center gap-1 mb-2 border-b border-line-2">
              {(
                [
                  {
                    k: "image" as const,
                    l: s.pipelineTabImage,
                    ready: imageReady,
                  },
                  {
                    k: "video" as const,
                    l: s.pipelineTabVideo,
                    ready: videoReady,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  onClick={() => onPipelineTabChange(t.k)}
                  className={`px-3 h-8 text-[14.5px] relative inline-flex items-center gap-1.5 ${
                    pipelineTab === t.k
                      ? "ink font-medium"
                      : "ink-3 hover:ink"
                  }`}
                  title={
                    t.k === "image"
                      ? "Görsel için 6 alan (still fotoğrafın nasıl görünmesini istediğin)"
                      : "Video için 6 alan (hareket, kamera, ses vs.)"
                  }
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
                title={s.pipelineTabImage}
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
                title={s.pipelineTabVideo}
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
            title={s.pipelineTabImage}
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
            title={s.pipelineTabVideo}
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
