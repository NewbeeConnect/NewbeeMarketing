"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { IntentPicker, IntentPill } from "@/components/generate/IntentPicker";
import { Stepper } from "@/components/generate/Stepper";
import { ProjectRatioBar } from "@/components/generate/ProjectRatioBar";
import { BriefStage } from "@/components/generate/BriefStage";
import { ImageStage } from "@/components/generate/ImageStage";
import { VideoStage } from "@/components/generate/VideoStage";
import { PostImageGate } from "@/components/generate/PostImageGate";
import { CompletionCard } from "@/components/generate/CompletionCard";

import { type AnyRatio, type ProjectSlug } from "@/lib/projects";
import {
  type Intent,
  type Phase,
  asImageRatio,
  asVideoRatio,
  defaultRatioFor,
  nextPhaseFor,
  primaryActionFor,
  ratiosFor,
} from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";
import {
  useGenerateImage,
  useGenerateVideo,
  useGeneratePromptBlueprint,
  useSuggestBrief,
  useUploadToLibrary,
  useVideoStatus,
  assembleImagePrompt,
  assembleVideoPrompt,
  type ImagePromptFields,
  type VideoPromptFields,
  type ReferenceImageInput,
} from "@/hooks/useGeneration";

// ─── Constants ────────────────────────────────────────────────────────

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

async function fileToReferenceImage(file: File): Promise<ReferenceImageInput> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return { imageBytes: btoa(binary), mimeType: file.type || "image/png" };
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const qc = useQueryClient();

  // Intent + phase drive everything
  const [intent, setIntent] = useState<Intent | null>(null);
  const [phase, setPhase] = useState<Phase>("intent");

  // Shared selections
  const [project, setProject] = useState<ProjectSlug>("newbee");
  const [ratio, setRatio] = useState<AnyRatio>("9:16");

  // Stage 1 state
  const [brief, setBrief] = useState("");
  const [imageFields, setImageFields] = useState<ImagePromptFields>(EMPTY_IMAGE_FIELDS);
  const [videoFields, setVideoFields] = useState<VideoPromptFields>(EMPTY_VIDEO_FIELDS);
  const [pipelineTab, setPipelineTab] = useState<"image" | "video">("image");

  // Stage 2 state
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Stage 3 state
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(8);

  // Video intent: reference images (up to 3, max 5MB each in the UI — API
  // also rejects > 5.5MB base64).
  const [refFiles, setRefFiles] = useState<
    { file: File; preview: string }[]
  >([]);

  // Extend-from-previous-video state. When set, the next Veo generation
  // passes `sourceGenerationId` and Veo continues from that clip's last frame.
  const [extendFromId, setExtendFromId] = useState<string | null>(null);

  // ─── Mutations ────────────────────────────────────────────────────
  const promptMut = useGeneratePromptBlueprint();
  const suggestMut = useSuggestBrief();
  const imageMut = useGenerateImage();
  const videoMut = useGenerateVideo();
  const uploadMut = useUploadToLibrary();
  const videoStatus = useVideoStatus(activeVideoId);

  const videoDone =
    videoStatus.data?.status === "completed" && videoStatus.data.outputUrl;
  const videoProcessing =
    activeVideoId != null &&
    (videoStatus.data?.status === "processing" ||
      videoStatus.data?.status === "pending" ||
      !videoStatus.data);
  const videoFailed = videoStatus.data?.status === "failed";
  const videoUrl = videoDone ? videoStatus.data?.outputUrl ?? null : null;

  const imageBlueprintReady = useMemo(
    () => Object.values(imageFields).every((v) => v.trim().length > 2),
    [imageFields]
  );
  const videoBlueprintReady = useMemo(
    () => Object.values(videoFields).every((v) => v.trim().length > 2),
    [videoFields]
  );

  // Auto-advance pipeline tab once image blueprint is ready
  const pipelineTabEffective: "image" | "video" = useMemo(() => {
    if (intent !== "pipeline") return pipelineTab;
    if (imageBlueprintReady && pipelineTab === "image" && !videoBlueprintReady) {
      return "video";
    }
    return pipelineTab;
  }, [intent, pipelineTab, imageBlueprintReady, videoBlueprintReady]);

  // ─── Intent handling ──────────────────────────────────────────────
  const pickIntent = useCallback((i: Intent) => {
    setIntent(i);
    setPhase("brief");
    // Snap ratio to a valid default for this intent
    const options = ratiosFor(i);
    setRatio((r) => ((options as readonly string[]).includes(r) ? r : defaultRatioFor(i)));
  }, []);

  const resetAll = useCallback(() => {
    // Clear video polling for the old id so we don't leak a query
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setIntent(null);
    setPhase("intent");
    setBrief("");
    setImageFields(EMPTY_IMAGE_FIELDS);
    setVideoFields(EMPTY_VIDEO_FIELDS);
    setImageUrl(null);
    setActiveVideoId(null);
    setExtendFromId(null);
    setPipelineTab("image");
    // keep project + ratio as a user preference
    refFiles.forEach((r) => URL.revokeObjectURL(r.preview));
    setRefFiles([]);
  }, [activeVideoId, qc, refFiles]);

  const createVariant = useCallback(() => {
    // Keep intent/brief/blueprint/project/ratio; clear outputs. Also clears
    // any extend context so a variant is a fresh take on the same brief.
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setImageUrl(null);
    setActiveVideoId(null);
    setExtendFromId(null);
    if (intent) setPhase(intent === "pipeline" ? "image" : intent === "image" ? "image" : "video");
  }, [intent, activeVideoId, qc]);

  /**
   * Start a new cycle that extends from the current video's last frame.
   * Works for both "video" and "pipeline" intents — they both produced a
   * Veo video in `activeVideoId`. The flow is a "video" intent from here on:
   * the user writes a fresh brief for the next beat, Veo continues the story.
   */
  const extendVideo = useCallback(() => {
    if (!activeVideoId) return;
    // Save the source id BEFORE we clear activeVideoId
    setExtendFromId(activeVideoId);
    // Remove the stale polling query
    qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    // Reset outputs + blueprint + brief, keep project/ratio
    setImageUrl(null);
    setActiveVideoId(null);
    setBrief("");
    setVideoFields(EMPTY_VIDEO_FIELDS);
    // Force into video intent (extension is always a video)
    setIntent("video");
    setPhase("brief");
    toast.success("Continuing from your last video — write the next beat.");
  }, [activeVideoId, qc]);

  // When intent changes and ratio is invalid, snap with toast
  const handleRatioChange = useCallback((r: AnyRatio) => setRatio(r), []);

  // Intent switch from ratio: no-op; ratio validity enforced by ProjectRatioBar options.

  // ─── Stage 1 handlers ─────────────────────────────────────────────
  async function rollDice() {
    if (!intent) return;
    try {
      const res = await suggestMut.mutateAsync({
        project,
        target: intent,
        ratio,
      });
      setBrief(res.suggestion);
      toast.success("New brief suggestion — roll again if you'd like.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suggestion failed");
    }
  }

  async function fillBlueprintWithAI(target: "image" | "video") {
    if (!brief.trim()) {
      toast.error(COPY.toasts.briefNeeded);
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
      toast.success("Blueprint drafted. Tweak anything before continuing.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Blueprint draft failed");
    }
  }

  function continueFromBrief() {
    if (!intent) return;
    // Validate the blueprint(s) needed for this intent
    if (intent === "image" && !imageBlueprintReady) {
      toast.error(COPY.toasts.blueprintIncomplete);
      return;
    }
    if (intent === "video" && !videoBlueprintReady) {
      toast.error(COPY.toasts.blueprintIncomplete);
      return;
    }
    if (intent === "pipeline" && (!imageBlueprintReady || !videoBlueprintReady)) {
      toast.error(COPY.toasts.blueprintIncomplete);
      if (!imageBlueprintReady) setPipelineTab("image");
      else setPipelineTab("video");
      return;
    }
    const next = nextPhaseFor(intent, "brief");
    if (next) setPhase(next);
  }

  // ─── Stage 2 handlers ─────────────────────────────────────────────
  async function handleGenerateImage() {
    if (!intent) return;
    try {
      const prompt = assembleImagePrompt(imageFields);
      const res = await imageMut.mutateAsync({
        project,
        ratio: asImageRatio(ratio),
        prompt,
      });
      setImageUrl(res.outputUrl);
      const next = nextPhaseFor(intent, "image");
      if (next) setPhase(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    }
  }

  async function handleImageFile(file: File) {
    if (!intent) return;
    try {
      const res = await uploadMut.mutateAsync({
        file,
        project,
        type: "image",
        ratio,
        prompt: imageBlueprintReady
          ? assembleImagePrompt(imageFields)
          : "User-uploaded image",
      });
      setImageUrl(res.outputUrl);
      const next = nextPhaseFor(intent, "image");
      if (next) setPhase(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed");
    }
  }

  function redoImage() {
    setImageUrl(null);
    setPhase("image");
  }

  // ─── postImage gate handlers ──────────────────────────────────────
  function continueToVideo() {
    setPhase("video");
  }

  function stopAtImage() {
    setPhase("done");
  }

  // ─── Stage 3 handlers ─────────────────────────────────────────────
  async function handleAddReference(file: File) {
    if (refFiles.length >= 3) return;
    if (!file.type.startsWith("image/")) return;
    setRefFiles((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
  }

  function handleRemoveReference(i: number) {
    setRefFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[i].preview);
      next.splice(i, 1);
      return next;
    });
  }

  async function handleGenerateVideo() {
    if (!intent) return;

    const refsBase64: ReferenceImageInput[] = [];
    // Only standalone video intent passes references — pipeline uses firstFrameUrl
    if (intent === "video") {
      for (const r of refFiles) {
        refsBase64.push(await fileToReferenceImage(r.file));
      }
    }

    try {
      const prompt = assembleVideoPrompt(videoFields);
      // Veo's SDK enforces mutual exclusion between firstFrame / refs /
      // extend. We pick exactly one based on the current page state.
      const usingExtend = !!extendFromId;
      const usingPipelineFirstFrame =
        !usingExtend && intent === "pipeline" && !!imageUrl;
      const usingRefs =
        !usingExtend &&
        !usingPipelineFirstFrame &&
        intent === "video" &&
        refsBase64.length > 0;

      const res = await videoMut.mutateAsync({
        project,
        ratio: asVideoRatio(ratio),
        prompt,
        durationSeconds,
        firstFrameUrl: usingPipelineFirstFrame ? imageUrl! : undefined,
        referenceImages: usingRefs ? refsBase64 : undefined,
        sourceGenerationId: usingExtend ? extendFromId! : undefined,
      });
      setActiveVideoId(res.generationId);
      toast.success(
        COPY.toasts.videoStarted(
          project === "newbee" ? "Newbee" : "Atelier Sayın",
          ratio
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video generation failed");
    }
  }

  async function handleVideoFile(file: File) {
    if (!intent) return;
    try {
      const res = await uploadMut.mutateAsync({
        file,
        project,
        type: "video",
        ratio,
        prompt: videoBlueprintReady
          ? assembleVideoPrompt(videoFields)
          : "User-uploaded video",
      });
      setActiveVideoId(res.generationId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video upload failed");
    }
  }

  function redoVideo() {
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setActiveVideoId(null);
  }

  // When a video completes, auto-move to "done" phase
  if (videoDone && phase === "video") {
    // setPhase during render is legal when derived from props/state unchanged —
    // but to be safe we use a microtask. However React 19 warns on this. Easier:
    // do it in onSuccess of useGenerateVideo — but completion happens via
    // polling, not the mutation. We handle done-state by checking in render.
  }

  // ─── Derived: auto-transition to "done" ───────────────────────────
  // For image intent we hit "done" as soon as an image exists.
  // For video intent we wait for Veo to finish.
  // For pipeline intent: after the video is done, or after "stopAtImage".
  // Explicit `phase === "done"` (from stopAtImage) always wins.
  const activePhase: Phase = useMemo(() => {
    if (phase === "done") return "done";
    if (!intent) return phase;
    if (intent === "image" && phase === "image" && imageUrl) return "done";
    if (intent === "video" && phase === "video" && videoDone) return "done";
    if (intent === "pipeline" && phase === "video" && videoDone) return "done";
    return phase;
  }, [intent, phase, imageUrl, videoDone]);

  const primary = intent ? primaryActionFor(intent, activePhase) : null;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{COPY.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{COPY.pageSubtitle}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/library">Library</Link>
        </Button>
      </div>

      {/* Intent: picker on first visit, compact pill after */}
      {phase === "intent" || !intent ? (
        <IntentPicker onPick={pickIntent} />
      ) : (
        <div className="flex items-center justify-between">
          <IntentPill intent={intent} onChange={resetAll} />
          <Stepper intent={intent} phase={activePhase} />
        </div>
      )}

      {/* Project + context-aware ratio picker (always visible) */}
      <Card className="p-4">
        <ProjectRatioBar
          project={project}
          onProjectChange={setProject}
          ratio={ratio}
          onRatioChange={handleRatioChange}
          intent={intent}
        />
      </Card>

      {/* Extend banner — shows on any phase once extendFromId is set */}
      {extendFromId && (
        <Card className="p-3 border-primary/50 bg-primary/5 flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-medium">Extending from your last video.</span>{" "}
            <span className="text-muted-foreground">
              Veo will continue from its final frame. Write the next beat in the brief below.
            </span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExtendFromId(null)}
            className="shrink-0"
          >
            Cancel extend
          </Button>
        </Card>
      )}

      {/* Phase content */}
      {intent && phase === "brief" && (
        <>
          <BriefStage
            intent={intent}
            project={project}
            brief={brief}
            onBriefChange={setBrief}
            imageFields={imageFields}
            onImageFieldsChange={(k, v) =>
              setImageFields((prev) => ({ ...prev, [k]: v }))
            }
            videoFields={videoFields}
            onVideoFieldsChange={(k, v) =>
              setVideoFields((prev) => ({ ...prev, [k]: v }))
            }
            onFillImage={() => fillBlueprintWithAI("image")}
            onFillVideo={() => fillBlueprintWithAI("video")}
            aiLoading={promptMut.isPending}
            imageReady={imageBlueprintReady}
            videoReady={videoBlueprintReady}
            pipelineTab={pipelineTabEffective}
            onPipelineTabChange={setPipelineTab}
            onRollDice={rollDice}
            diceLoading={suggestMut.isPending}
          />

          <div className="flex justify-end">
            <Button onClick={continueFromBrief} disabled={!primary}>
              {primary?.label}
            </Button>
          </div>
        </>
      )}

      {intent && phase === "image" && activePhase !== "done" && (
        <ImageStage
          intent={intent}
          project={project}
          ratio={ratio}
          imageUrl={imageUrl}
          onGenerate={handleGenerateImage}
          onUploadFile={handleImageFile}
          onRedo={redoImage}
          aiLoading={imageMut.isPending}
          uploadLoading={uploadMut.isPending}
        />
      )}

      {intent === "pipeline" && phase === "postImage" && imageUrl && (
        <PostImageGate
          imageUrl={imageUrl}
          ratio={ratio}
          onContinue={continueToVideo}
          onStop={stopAtImage}
        />
      )}

      {intent && phase === "video" && activePhase !== "done" && (
        <VideoStage
          intent={intent}
          project={project}
          ratio={ratio}
          durationSeconds={durationSeconds}
          onDurationChange={setDurationSeconds}
          refPreviews={refFiles}
          onAddReference={handleAddReference}
          onRemoveReference={handleRemoveReference}
          onGenerate={handleGenerateVideo}
          onUploadFile={handleVideoFile}
          onRedo={redoVideo}
          aiLoading={videoMut.isPending}
          uploadLoading={uploadMut.isPending}
          processing={videoProcessing}
          failed={videoFailed}
          errorMessage={videoStatus.data?.errorMessage}
          videoUrl={videoUrl}
        />
      )}

      {intent && activePhase === "done" && (
        <CompletionCard
          intent={intent}
          project={project}
          ratio={ratio}
          imageUrl={imageUrl}
          videoUrl={videoUrl}
          onCreateVariant={createVariant}
          onStartOver={resetAll}
          onExtendVideo={videoUrl && activeVideoId ? extendVideo : undefined}
        />
      )}
    </div>
  );
}
