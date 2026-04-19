"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Video as VideoIcon,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PROJECTS,
  type ProjectSlug,
} from "@/lib/projects";
import {
  useGenerateImage,
  useGenerateVideo,
  useVideoStatus,
  useGeneratePromptBlueprint,
  useUploadToLibrary,
  assembleImagePrompt,
  assembleVideoPrompt,
  type ImagePromptFields,
  type VideoPromptFields,
} from "@/hooks/useGeneration";

/**
 * Progressive 3-stage pipeline:
 *   Stage 1 — Brief → structured prompt blueprint (AI fills, user edits).
 *   Stage 2 — Image (AI generates from assembled prompt OR user uploads).
 *   Stage 3 — Video (AI generates using Stage 2's image as first frame OR user uploads).
 *
 * Each stage unlocks once the previous one produces an output. Every output
 * auto-files into Library under `{Project}/{Type}/{Ratio}/`.
 *
 * Pipeline ratio is fixed to 9:16 or 16:9 — the two Veo 3.1 supports, which
 * keeps Stage 2 image and Stage 3 video aligned.
 */

type Ratio = "9:16" | "16:9";

const RATIO_CHOICES: { value: Ratio; label: string }[] = [
  { value: "9:16", label: "9:16 (vertical)" },
  { value: "16:9", label: "16:9 (landscape)" },
];

const EMPTY_IMAGE_FIELDS: ImagePromptFields = {
  subject: "",
  style: "",
  composition: "",
  lighting: "",
  mood: "",
  technical: "",
};

const EMPTY_VIDEO_FIELDS: VideoPromptFields = {
  subject: "",
  camera: "",
  action: "",
  lighting: "",
  mood: "",
  audio: "",
};

const IMAGE_FIELD_LABELS: {
  key: keyof ImagePromptFields;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject", hint: "Who/what is shown and what they're doing." },
  { key: "style", label: "Style", hint: "Visual genre — editorial, minimal catalogue, dark-academia cinematic…" },
  { key: "composition", label: "Composition", hint: "Shot type, framing, angle, focal length." },
  { key: "lighting", label: "Lighting", hint: "Direction, color, quality of light." },
  { key: "mood", label: "Mood & palette", hint: "Tone + dominant colors." },
  { key: "technical", label: "Technical", hint: "Focus, depth of field, sharpness cues." },
];

const VIDEO_FIELD_LABELS: {
  key: keyof VideoPromptFields;
  label: string;
  hint: string;
}[] = [
  { key: "subject", label: "Subject + opening", hint: "Who/what appears in the first frame." },
  { key: "camera", label: "Camera", hint: "Movement — dolly-in, handheld, locked-off, orbit…" },
  { key: "action", label: "Action", hint: "What changes during the clip." },
  { key: "lighting", label: "Lighting", hint: "Direction, color, quality — and how it evolves." },
  { key: "mood", label: "Mood & palette", hint: "Emotional tone + cinematic reference." },
  { key: "audio", label: "Audio", hint: "What Veo should synthesize (silent, piano, room tone)…" },
];

export default function GeneratePage() {
  // ─── Pipeline-wide selections ──────────────────────────────────────
  const [project, setProject] = useState<ProjectSlug>("newbee");
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const activeProject = useMemo(
    () => PROJECTS.find((p) => p.slug === project)!,
    [project]
  );

  // ─── Stage 1 state: prompt blueprint ───────────────────────────────
  const [brief, setBrief] = useState("");
  const [imageFields, setImageFields] = useState<ImagePromptFields>(EMPTY_IMAGE_FIELDS);
  const [videoFields, setVideoFields] = useState<VideoPromptFields>(EMPTY_VIDEO_FIELDS);
  const [stage1Complete, setStage1Complete] = useState(false);

  const promptMut = useGeneratePromptBlueprint();

  async function fillWithAI(target: "image" | "video") {
    if (!brief.trim()) {
      toast.error("Write a brief first");
      return;
    }
    try {
      const res = await promptMut.mutateAsync({
        project,
        target,
        ratio,
        brief: brief.trim(),
      });
      if (target === "image") setImageFields(res.fields as ImagePromptFields);
      else setVideoFields(res.fields as VideoPromptFields);
      toast.success("AI filled the blueprint. Edit anything before continuing.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI blueprint failed");
    }
  }

  const imageBlueprintReady =
    Object.values(imageFields).every((v) => v.trim().length > 2);
  const videoBlueprintReady =
    Object.values(videoFields).every((v) => v.trim().length > 2);

  // ─── Stage 2 state: image ──────────────────────────────────────────
  const [stage2Mode, setStage2Mode] = useState<"ai" | "upload" | null>(null);
  const [stage2Url, setStage2Url] = useState<string | null>(null);
  const stage2FileInput = useRef<HTMLInputElement>(null);

  const imageMut = useGenerateImage();
  const uploadMut = useUploadToLibrary();

  async function handleGenerateImage() {
    if (!imageBlueprintReady) {
      toast.error("Fill every image field first");
      return;
    }
    const prompt = assembleImagePrompt(imageFields);
    try {
      const res = await imageMut.mutateAsync({
        project,
        ratio: ratio as "9:16" | "16:9",
        prompt,
      });
      setStage2Url(res.outputUrl);

      setStage2Mode("ai");
      toast.success(`Saved to ${activeProject.name} / Image / ${ratio}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    }
  }

  async function handleImageFile(file: File) {
    try {
      const res = await uploadMut.mutateAsync({
        file,
        project,
        type: "image",
        ratio,
        prompt: imageBlueprintReady ? assembleImagePrompt(imageFields) : "User-uploaded image",
      });
      setStage2Url(res.outputUrl);

      setStage2Mode("upload");
      toast.success(`Saved to ${activeProject.name} / Image / ${ratio}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed");
    }
  }

  // ─── Stage 3 state: video ──────────────────────────────────────────
  const [stage3Mode, setStage3Mode] = useState<"ai" | "upload" | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(8);
  const stage3FileInput = useRef<HTMLInputElement>(null);

  const videoMut = useGenerateVideo();
  const videoStatus = useVideoStatus(activeVideoId);
  const videoDone =
    videoStatus.data?.status === "completed" && videoStatus.data.outputUrl;
  const videoProcessing =
    activeVideoId != null &&
    (videoStatus.data?.status === "processing" ||
      videoStatus.data?.status === "pending" ||
      !videoStatus.data);
  const videoFailed = videoStatus.data?.status === "failed";

  async function handleGenerateVideo() {
    if (!stage2Url) {
      toast.error("Image must be ready before generating video");
      return;
    }
    if (!videoBlueprintReady) {
      toast.error("Fill every video field first");
      return;
    }
    const prompt = assembleVideoPrompt(videoFields);
    try {
      const res = await videoMut.mutateAsync({
        project,
        ratio: ratio as "9:16" | "16:9",
        prompt,
        durationSeconds,
        firstFrameUrl: stage2Url,
      });
      setActiveVideoId(res.generationId);
      setStage3Mode("ai");
      toast.success(
        `Rendering video in ${activeProject.name} / Video / ${ratio} (~2-3 min)`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video generation failed");
    }
  }

  async function handleVideoFile(file: File) {
    try {
      const res = await uploadMut.mutateAsync({
        file,
        project,
        type: "video",
        ratio,
        prompt: videoBlueprintReady ? assembleVideoPrompt(videoFields) : "User-uploaded video",
      });
      setActiveVideoId(res.generationId);
      setStage3Mode("upload");
      toast.success(`Saved to ${activeProject.name} / Video / ${ratio}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video upload failed");
    }
  }

  // ─── Reset pipeline (new project/ratio) ────────────────────────────
  function resetPipeline() {
    setBrief("");
    setImageFields(EMPTY_IMAGE_FIELDS);
    setVideoFields(EMPTY_VIDEO_FIELDS);
    setStage1Complete(false);
    setStage2Url(null);

    setStage2Mode(null);
    setActiveVideoId(null);
    setStage3Mode(null);
  }

  // ─── Layout ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Generate</h1>
          <p className="text-sm text-muted-foreground">
            Brief → prompt → image → video. Each step auto-files under{" "}
            <span className="font-medium text-foreground">
              {activeProject.name} / …
            </span>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetPipeline}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            New
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/library">Library</Link>
          </Button>
        </div>
      </div>

      {/* Project + ratio */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <div className="flex gap-2">
              {PROJECTS.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setProject(p.slug)}
                  className={`flex-1 rounded-md border-2 p-2.5 text-sm text-left transition-colors ${
                    project === p.slug
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Output aspect ratio</Label>
            <Select value={ratio} onValueChange={(v) => setRatio(v as Ratio)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATIO_CHOICES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for both image and video.
            </p>
          </div>
        </div>
      </Card>

      {/* ─── Stage 1 ───────────────────────────────────────────────── */}
      <Stage
        num={1}
        title="Describe"
        hint="Tell the system what you want. Gemini 3 Pro fills the exact fields each model needs."
        completed={stage1Complete}
        locked={false}
      >
        <div className="space-y-2">
          <Label htmlFor="brief">Brief</Label>
          <Textarea
            id="brief"
            rows={3}
            placeholder="e.g. Mother's Day ad for a gold necklace — warm, intimate, cinematic"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <FieldsEditor
            title="Image blueprint"
            icon={<ImageIcon className="h-4 w-4" />}
            fieldList={IMAGE_FIELD_LABELS}
            values={imageFields}
            onChange={(k, v) => setImageFields((prev) => ({ ...prev, [k]: v }))}
            onFillAI={() => fillWithAI("image")}
            aiLoading={promptMut.isPending}
            ready={imageBlueprintReady}
          />
          <FieldsEditor
            title="Video blueprint"
            icon={<VideoIcon className="h-4 w-4" />}
            fieldList={VIDEO_FIELD_LABELS}
            values={videoFields}
            onChange={(k, v) =>
              setVideoFields((prev) => ({ ...prev, [k]: v }))
            }
            onFillAI={() => fillWithAI("video")}
            aiLoading={promptMut.isPending}
            ready={videoBlueprintReady}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => setStage1Complete(true)}
            disabled={!imageBlueprintReady || !videoBlueprintReady}
          >
            Continue to image
            <Check className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </Stage>

      {/* ─── Stage 2 ───────────────────────────────────────────────── */}
      <Stage
        num={2}
        title="Image"
        hint="Use the image blueprint to generate, or upload your own. This image becomes the first frame of your video."
        completed={!!stage2Url}
        locked={!stage1Complete}
      >
        {!stage2Url ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              icon={<Wand2 className="h-5 w-5" />}
              title="Generate with AI"
              body={`Nano Banana 2 renders from the image blueprint at ${ratio}.`}
              onClick={handleGenerateImage}
              loading={imageMut.isPending}
              primary
            />
            <ActionCard
              icon={<Upload className="h-5 w-5" />}
              title="Upload my own"
              body="PNG/JPG up to 15 MB. Goes straight to the library."
              onClick={() => stage2FileInput.current?.click()}
              loading={uploadMut.isPending}
            />
            <input
              ref={stage2FileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f);
                if (stage2FileInput.current) stage2FileInput.current.value = "";
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-600" />
              {stage2Mode === "upload" ? "Uploaded" : "Generated"} — saved to{" "}
              {activeProject.name} / Image / {ratio}
            </div>
            <PreviewImage src={stage2Url} ratio={ratio} alt="Stage 2 image" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStage2Url(null);
              
                  setStage2Mode(null);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Redo
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={stage2Url} download>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        )}
      </Stage>

      {/* ─── Stage 3 ───────────────────────────────────────────────── */}
      <Stage
        num={3}
        title="Video"
        hint="Veo turns the image into motion using the video blueprint — or upload a finished clip."
        completed={!!videoDone}
        locked={!stage2Url}
      >
        {!activeVideoId ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select
                  value={String(durationSeconds)}
                  onValueChange={(v) =>
                    setDurationSeconds(Number(v) as 4 | 6 | 8)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActionCard
                icon={<Wand2 className="h-5 w-5" />}
                title="Generate with AI"
                body={`Veo 3.1 uses the image as the first frame and follows the video blueprint (${durationSeconds}s).`}
                onClick={handleGenerateVideo}
                loading={videoMut.isPending}
                primary
              />
              <ActionCard
                icon={<Upload className="h-5 w-5" />}
                title="Upload my own"
                body="MP4 up to 200 MB."
                onClick={() => stage3FileInput.current?.click()}
                loading={uploadMut.isPending}
              />
              <input
                ref={stage3FileInput}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoFile(f);
                  if (stage3FileInput.current) stage3FileInput.current.value = "";
                }}
              />
            </div>
          </div>
        ) : videoProcessing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Veo is rendering… ~2-3 minutes. You can leave this page; the video
            will show up in the{" "}
            <Link href="/library" className="underline">
              Library
            </Link>
            .
          </div>
        ) : videoFailed ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Failed: {videoStatus.data?.errorMessage ?? "unknown error"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveVideoId(null);
                setStage3Mode(null);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try again
            </Button>
          </div>
        ) : videoDone && videoStatus.data?.outputUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-600" />
              {stage3Mode === "upload" ? "Uploaded" : "Generated"} — saved to{" "}
              {activeProject.name} / Video / {ratio}
            </div>
            <video
              src={videoStatus.data.outputUrl}
              controls
              className={`w-full rounded-md bg-black max-w-md ${
                ratio === "16:9" ? "aspect-video" : "aspect-[9/16]"
              }`}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveVideoId(null);
                  setStage3Mode(null);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Redo
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={videoStatus.data.outputUrl} download>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </Stage>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────

function Stage({
  num,
  title,
  hint,
  completed,
  locked,
  children,
}: {
  num: number;
  title: string;
  hint: string;
  completed: boolean;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`p-5 space-y-4 transition-opacity ${
        locked ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                completed
                  ? "bg-green-600 text-white"
                  : locked
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {completed ? <Check className="h-3.5 w-3.5" /> : num}
            </div>
            <h2 className="text-base font-semibold">Step {num} — {title}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 ml-8">{hint}</p>
        </div>
      </div>
      <div className={locked ? "" : ""}>{children}</div>
    </Card>
  );
}

function FieldsEditor<T extends Record<string, string>>({
  title,
  icon,
  fieldList,
  values,
  onChange,
  onFillAI,
  aiLoading,
  ready,
}: {
  title: string;
  icon: React.ReactNode;
  fieldList: { key: keyof T & string; label: string; hint: string }[];
  values: T;
  onChange: (key: keyof T & string, value: string) => void;
  onFillAI: () => void;
  aiLoading: boolean;
  ready: boolean;
}) {
  return (
    <Card className="p-3 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {title}
          {ready && <Check className="h-3.5 w-3.5 text-green-600" />}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onFillAI}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1.5" />
          )}
          AI fill
        </Button>
      </div>
      <div className="space-y-2">
        {fieldList.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs font-medium">
              {f.label}
              <span className="text-muted-foreground font-normal ml-1.5">
                {f.hint}
              </span>
            </Label>
            <Input
              value={values[f.key] as string}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="text-xs"
              placeholder="…"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActionCard({
  icon,
  title,
  body,
  onClick,
  loading,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  loading?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col items-start gap-1.5 rounded-md border-2 p-4 text-left transition-colors disabled:opacity-50 ${
        primary
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{body}</p>
    </button>
  );
}

function PreviewImage({
  src,
  ratio,
  alt,
}: {
  src: string;
  ratio: Ratio;
  alt: string;
}) {
  const aspect = ratio === "16:9" ? "aspect-video" : "aspect-[9/16]";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-md bg-muted/40 ${aspect} max-w-md`}
    >
      <Image src={src} alt={alt} fill className="object-contain" unoptimized />
    </div>
  );
}
