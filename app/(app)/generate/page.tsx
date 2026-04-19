"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  Video,
  X,
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
  IMAGE_RATIOS,
  VIDEO_RATIOS,
  type ProjectSlug,
  type ImageRatio,
  type VideoRatio,
} from "@/lib/projects";
import {
  useGenerateImage,
  useGenerateVideo,
  useVideoStatus,
  type ReferenceImageInput,
} from "@/hooks/useGeneration";

type MediaType = "image" | "video";

/**
 * Client-side helper: read a File from <input type="file"> into base64 (no
 * data: prefix) + its MIME type. Skips the ~30% overhead of FileReader by
 * using Blob.arrayBuffer() → Buffer → base64 directly in the browser.
 */
async function fileToReferenceImage(file: File): Promise<ReferenceImageInput> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return {
    imageBytes: btoa(binary),
    mimeType: file.type || "image/png",
  };
}

export default function GeneratePage() {
  const [project, setProject] = useState<ProjectSlug>("newbee");
  const [type, setType] = useState<MediaType>("image");
  const [imageRatio, setImageRatio] = useState<ImageRatio>("9:16");
  const [videoRatio, setVideoRatio] = useState<VideoRatio>("9:16");
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(8);
  const [prompt, setPrompt] = useState("");

  const [refFiles, setRefFiles] = useState<
    Array<{ file: File; preview: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the in-flight video so we can poll its status.
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [lastImageMeta, setLastImageMeta] = useState<{
    project: ProjectSlug;
    ratio: ImageRatio;
  } | null>(null);

  const imageMut = useGenerateImage();
  const videoMut = useGenerateVideo();
  const videoStatus = useVideoStatus(activeVideoId);

  const activeProject = useMemo(
    () => PROJECTS.find((p) => p.slug === project)!,
    [project]
  );

  const ratio: ImageRatio | VideoRatio = type === "image" ? imageRatio : videoRatio;

  function handleFilesPicked(files: FileList | null) {
    if (!files) return;
    const next = [...refFiles];
    for (const f of Array.from(files)) {
      if (next.length >= 3) break;
      if (!f.type.startsWith("image/")) continue;
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setRefFiles(next);
  }

  function removeRef(i: number) {
    setRefFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[i].preview);
      next.splice(i, 1);
      return next;
    });
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Write a prompt first");
      return;
    }

    const referenceImages: ReferenceImageInput[] = [];
    for (const { file } of refFiles) {
      referenceImages.push(await fileToReferenceImage(file));
    }

    if (type === "image") {
      try {
        const res = await imageMut.mutateAsync({
          project,
          ratio: imageRatio,
          prompt: prompt.trim(),
          referenceImages: referenceImages.length ? referenceImages : undefined,
        });
        setLastImageUrl(res.outputUrl);
        setLastImageMeta({ project: res.project, ratio: res.ratio });
        toast.success(
          `Saved to ${activeProject.name} / Image / ${res.ratio}`
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Image generation failed");
      }
    } else {
      try {
        const res = await videoMut.mutateAsync({
          project,
          ratio: videoRatio,
          prompt: prompt.trim(),
          durationSeconds,
          referenceImages: referenceImages.length ? referenceImages : undefined,
        });
        setActiveVideoId(res.generationId);
        toast.success(
          `Rendering video in ${activeProject.name} / Video / ${res.ratio} (~2-3 min)`
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Video generation failed");
      }
    }
  }

  const videoState = videoStatus.data;
  const videoDone = videoState?.status === "completed" && videoState.outputUrl;
  const videoProcessing =
    activeVideoId != null &&
    (videoState?.status === "processing" ||
      videoState?.status === "pending" ||
      !videoState);
  const videoFailed = videoState?.status === "failed";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl w-full mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Generate</h1>
          <p className="text-sm text-muted-foreground">
            One asset at a time. Auto-filed under {" "}
            <span className="font-medium text-foreground">
              {activeProject.name} / {type === "image" ? "Image" : "Video"} / {ratio}
            </span>
            .
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/library">Open Library</Link>
        </Button>
      </div>

      <Card className="p-5 space-y-6">
        {/* Project picker */}
        <div className="space-y-2">
          <Label>Project</Label>
          <div className="flex gap-2">
            {PROJECTS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setProject(p.slug)}
                className={`flex-1 rounded-md border-2 p-3 text-left transition-colors ${
                  project === p.slug
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-medium">{p.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Type + ratio + duration */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setType("image")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
                  type === "image"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted/50"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </button>
              <button
                type="button"
                onClick={() => setType("video")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l ${
                  type === "video"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted/50"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                Video
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            {type === "image" ? (
              <Select
                value={imageRatio}
                onValueChange={(v) => setImageRatio(v as ImageRatio)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_RATIOS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={videoRatio}
                onValueChange={(v) => setVideoRatio(v as VideoRatio)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_RATIOS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {type === "video" && (
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(durationSeconds)}
                onValueChange={(v) =>
                  setDurationSeconds(Number(v) as 4 | 6 | 8)
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4s</SelectItem>
                  <SelectItem value="6">6s</SelectItem>
                  <SelectItem value="8">8s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            rows={4}
            placeholder={
              type === "image"
                ? "E.g. Hero shot of a gold necklace on velvet, soft rim light, macro lens"
                : "E.g. Slow dolly-in on a smartphone unlocking a honeycomb UI, golden-hour lighting"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Reference images */}
        <div className="space-y-2">
          <Label>Reference images (optional, max 3)</Label>
          <div className="flex flex-wrap items-center gap-3">
            {refFiles.map((r, i) => (
              <div
                key={i}
                className="relative h-20 w-20 rounded-md overflow-hidden border"
              >
                {/* using unoptimized blob URL */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.preview}
                  alt={`reference ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeRef(i)}
                  className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
                  aria-label="Remove reference"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {refFiles.length < 3 && (
              <>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesPicked(e.target.files);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-md border border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-muted/40"
                >
                  <Upload className="h-4 w-4 mb-1" />
                  Add
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Product photos, brand logos, or style references. Up to 3 images —
            the model uses them for subject/brand consistency.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            imageMut.isPending ||
            videoMut.isPending ||
            videoProcessing ||
            !prompt.trim()
          }
          size="lg"
          className="w-full"
        >
          {imageMut.isPending || videoMut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Starting…
            </>
          ) : videoProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Rendering video…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </Card>

      {/* Result preview */}
      {type === "image" && lastImageUrl && lastImageMeta && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Latest image</h2>
              <p className="text-xs text-muted-foreground">
                {PROJECTS.find((p) => p.slug === lastImageMeta.project)?.name} /
                Image / {lastImageMeta.ratio}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={lastImageUrl} download>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </a>
            </Button>
          </div>
          <div
            className={`relative w-full overflow-hidden rounded-md bg-muted/40 ${
              lastImageMeta.ratio === "1:1"
                ? "aspect-square"
                : lastImageMeta.ratio === "4:5"
                ? "aspect-[4/5]"
                : "aspect-[9/16]"
            } max-w-md`}
          >
            <Image
              src={lastImageUrl}
              alt={prompt.slice(0, 120)}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </Card>
      )}

      {type === "video" && activeVideoId && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Latest video</h2>
              <p className="text-xs text-muted-foreground">
                {activeProject.name} / Video / {videoRatio}
              </p>
            </div>
            {videoDone && videoState?.outputUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={videoState.outputUrl} download>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </a>
              </Button>
            )}
          </div>

          {videoDone && videoState?.outputUrl ? (
            <video
              src={videoState.outputUrl}
              controls
              className={`w-full rounded-md bg-black max-w-md ${
                videoRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
              }`}
            />
          ) : videoFailed ? (
            <p className="text-sm text-destructive">
              Failed: {videoState?.errorMessage ?? "unknown error"}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Veo is rendering… this takes ~2-3 minutes. Safe to stay on this
              page or check the <Link href="/library" className="underline">
                Library
              </Link>
              .
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
