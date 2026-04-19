"use client";

import { ImageIcon, Video as VideoIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FieldsEditor } from "./FieldsEditor";
import { COPY } from "@/lib/generate/copy";
import type { Intent } from "@/lib/generate/machine";
import type {
  ImagePromptFields,
  VideoPromptFields,
} from "@/hooks/useGeneration";

const IMAGE_FIELD_LABELS: {
  key: keyof ImagePromptFields & string;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject", hint: "Who / what and what they're doing." },
  { key: "style", label: "Style", hint: "Visual genre — editorial, minimal catalogue…" },
  { key: "composition", label: "Composition", hint: "Shot type, framing, angle, focal length." },
  { key: "lighting", label: "Lighting", hint: "Direction, color, quality of light." },
  { key: "mood", label: "Mood & palette", hint: "Tone + dominant colors." },
  { key: "technical", label: "Technical", hint: "Focus, depth of field, sharpness cues." },
];

const VIDEO_FIELD_LABELS: {
  key: keyof VideoPromptFields & string;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject + opening", hint: "Who / what appears in the first frame." },
  { key: "camera", label: "Camera", hint: "Dolly-in, handheld, locked-off, orbit…" },
  { key: "action", label: "Action", hint: "What changes during the clip." },
  { key: "lighting", label: "Lighting", hint: "Direction, color, quality — and how it evolves." },
  { key: "mood", label: "Mood & palette", hint: "Emotional tone + cinematic reference." },
  { key: "audio", label: "Audio", hint: "Silent, piano, room tone…" },
];

/**
 * Stage 1 of every intent. Shows the brief textarea and the blueprint(s)
 * the current intent needs:
 *   - image intent    → image blueprint only
 *   - video intent    → video blueprint only
 *   - pipeline intent → both in a Tabs component (Image first, auto-advances
 *     to Video once the image blueprint is ready)
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
}) {
  const placeholder =
    intent === "image"
      ? COPY.brief.placeholderImage
      : intent === "video"
      ? COPY.brief.placeholderVideo
      : COPY.brief.placeholderPipeline;

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">{COPY.brief.heading}</h2>
        <p className="text-xs text-muted-foreground mt-1">{COPY.brief.sub}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief">{COPY.brief.label}</Label>
        <Textarea
          id="brief"
          rows={3}
          placeholder={placeholder}
          value={brief}
          onChange={(e) => onBriefChange(e.target.value)}
        />
      </div>

      {intent === "image" && (
        <FieldsEditor<ImagePromptFields>
          title={COPY.blueprint.imageTitle}
          icon={<ImageIcon className="h-4 w-4" />}
          fieldList={IMAGE_FIELD_LABELS}
          values={imageFields}
          onChange={onImageFieldsChange}
          onFillAI={onFillImage}
          aiLoading={aiLoading}
          ready={imageReady}
        />
      )}

      {intent === "video" && (
        <FieldsEditor<VideoPromptFields>
          title={COPY.blueprint.videoTitle}
          icon={<VideoIcon className="h-4 w-4" />}
          fieldList={VIDEO_FIELD_LABELS}
          values={videoFields}
          onChange={onVideoFieldsChange}
          onFillAI={onFillVideo}
          aiLoading={aiLoading}
          ready={videoReady}
        />
      )}

      {intent === "pipeline" && (
        <Tabs
          value={pipelineTab}
          onValueChange={(v) => onPipelineTabChange(v as "image" | "video")}
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="image">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              {COPY.blueprint.imageTitle}
              {imageReady && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
            <TabsTrigger value="video" disabled={!imageReady}>
              <VideoIcon className="h-3.5 w-3.5 mr-1.5" />
              {COPY.blueprint.videoTitle}
              {videoReady && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="pt-2">
            <FieldsEditor<ImagePromptFields>
              title={COPY.blueprint.imageTitle}
              icon={<ImageIcon className="h-4 w-4" />}
              fieldList={IMAGE_FIELD_LABELS}
              values={imageFields}
              onChange={onImageFieldsChange}
              onFillAI={onFillImage}
              aiLoading={aiLoading}
              ready={imageReady}
            />
          </TabsContent>
          <TabsContent value="video" className="pt-2">
            <FieldsEditor<VideoPromptFields>
              title={COPY.blueprint.videoTitle}
              icon={<VideoIcon className="h-4 w-4" />}
              fieldList={VIDEO_FIELD_LABELS}
              values={videoFields}
              onChange={onVideoFieldsChange}
              onFillAI={onFillVideo}
              aiLoading={aiLoading}
              ready={videoReady}
            />
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
