"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  Film,
  Image as ImageIcon,
  Library as LibraryIcon,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { IntentPicker, IntentPill } from "@/components/generate/IntentPicker";
import { ProjectRatioBar } from "@/components/generate/ProjectRatioBar";
import { BriefStage } from "@/components/generate/BriefStage";
import { ImageStage } from "@/components/generate/ImageStage";
import { VideoStage } from "@/components/generate/VideoStage";
import { PostImageGate } from "@/components/generate/PostImageGate";
import { CompletionCard } from "@/components/generate/CompletionCard";
import { TimelineStep } from "@/components/generate/TimelineStep";
import { AssembledPromptEditor } from "@/components/generate/AssembledPromptEditor";
import {
  AssetLockEditor,
  type LockedAsset,
} from "@/components/generate/AssetLockEditor";
import { WhatIsThis } from "@/components/ui/WhatIsThis";

import { PROJECTS, type AnyRatio, type ProjectSlug } from "@/lib/projects";
import {
  type Intent,
  asImageRatio,
  asVideoRatio,
  defaultRatioFor,
  ratiosFor,
} from "@/lib/generate/machine";
import {
  type StepId,
  type StepVisual,
  stepsFor,
} from "@/lib/generate/timeline";
import { COPY, type WhatIsThis as WhatIsThisCopy } from "@/lib/i18n/copy";
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
  type LockedAssetInput,
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

// Step subtitles shown next to the active step title. Centralized Turkish
// copy — pulled from COPY.generate.steps.<step>.subtitle where present.
const STEP_SUBTITLES: Record<StepId, string> = {
  goal: COPY.generate.steps.goal.subtitle,
  brief: COPY.generate.steps.brief.subtitle,
  prompt: COPY.generate.steps.prompt.subtitle,
  image: COPY.generate.steps.image.subtitle,
  postImage: COPY.generate.steps.postImage.subtitle,
  video: COPY.generate.steps.video.subtitle,
  done: "",
};

// Helper — each TimelineStep gets a WhatIsThis info card as its `help`
// prop. We inline the JSX once per step from COPY so every consumer
// sees the same wording.
function stepHelp(step: StepId): React.ReactNode | null {
  const raw =
    step === "goal"
      ? COPY.generate.steps.goal.whatIsThis
      : step === "brief"
      ? COPY.generate.steps.brief.whatIsThis
      : step === "prompt"
      ? COPY.generate.steps.prompt.whatIsThis
      : step === "image"
      ? COPY.generate.steps.image.whatIsThis
      : step === "postImage"
      ? COPY.generate.steps.postImage.whatIsThis
      : step === "video"
      ? COPY.generate.steps.video.whatIsThis
      : step === "done"
      ? COPY.generate.steps.done.whatIsThis
      : null;
  if (!raw) return null;
  // Normalize into the WhatIsThis shape — some entries don't declare `note`.
  const w = raw as WhatIsThisCopy;
  return (
    <WhatIsThis
      title={w.title}
      body={w.body}
      bullets={w.bullets}
      note={w.note}
    />
  );
}

/**
 * Read a File as base64 using native FileReader. Fast + no stack-overflow
 * trap that a chunked btoa would hit on multi-MB images.
 */
function fileToBase64(
  file: File
): Promise<{ imageBytes: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      if (comma < 0) {
        reject(new Error("Malformed data URL from FileReader"));
        return;
      }
      resolve({
        imageBytes: dataUrl.slice(comma + 1),
        mimeType: file.type || "image/png",
      });
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const qc = useQueryClient();

  // Timeline
  const [intent, setIntent] = useState<Intent | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("goal");
  const [maxReachedIdx, setMaxReachedIdx] = useState(0);

  const steps = useMemo(() => stepsFor(intent), [intent]);
  const activeIdx = steps.indexOf(activeStep);

  const visualFor = useCallback(
    (step: StepId): StepVisual => {
      const idx = steps.indexOf(step);
      if (idx === -1) return "pending";
      if (idx === activeIdx) return "active";
      if (idx <= maxReachedIdx) return "completed";
      return "pending";
    },
    [steps, activeIdx, maxReachedIdx]
  );

  const advanceTo = useCallback(
    (next: StepId) => {
      const idx = steps.indexOf(next);
      if (idx === -1) return;
      setActiveStep(next);
      setMaxReachedIdx((m) => Math.max(m, idx));
    },
    [steps]
  );

  const editStep = useCallback((step: StepId) => {
    setActiveStep(step);
  }, []);

  // Shared selections
  // Single-tenant hub: project is always Newbee. Kept as a constant because
  // every server route still accepts/validates it and the storage path
  // layout expects it.
  const project: ProjectSlug = "newbee";
  const [ratio, setRatio] = useState<AnyRatio>("9:16");

  // Brief state
  const [brief, setBrief] = useState("");
  const [imageFields, setImageFields] =
    useState<ImagePromptFields>(EMPTY_IMAGE_FIELDS);
  const [videoFields, setVideoFields] =
    useState<VideoPromptFields>(EMPTY_VIDEO_FIELDS);
  const [pipelineTab, setPipelineTab] = useState<"image" | "video">("image");
  const [regeneratingImageField, setRegeneratingImageField] = useState<
    (keyof ImagePromptFields & string) | null
  >(null);
  const [regeneratingVideoField, setRegeneratingVideoField] = useState<
    (keyof VideoPromptFields & string) | null
  >(null);
  const [promptTab, setPromptTab] = useState<"image" | "video">("image");

  // Locked assets (preserved pixel-faithfully by the image model)
  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>([]);

  // Assembled prompts (seeded from blueprint, user-editable)
  const [assembledImagePrompt, setAssembledImagePrompt] = useState("");
  const [assembledVideoPrompt, setAssembledVideoPrompt] = useState("");

  // Image stage
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Video stage
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(8);
  const [refFiles, setRefFiles] = useState<
    { file: File; preview: string }[]
  >([]);

  // Extend
  const [extendFromId, setExtendFromId] = useState<string | null>(null);
  const [extendFromBriefText, setExtendFromBriefText] = useState<string | null>(
    null
  );
  const [lastHighlight, setLastHighlight] = useState<string | null>(null);

  // Unmount cleanup for ObjectURLs
  const refFilesRef = useRef(refFiles);
  const lockedAssetsRef = useRef(lockedAssets);
  refFilesRef.current = refFiles;
  lockedAssetsRef.current = lockedAssets;
  useEffect(() => {
    return () => {
      refFilesRef.current.forEach((r) => URL.revokeObjectURL(r.preview));
      lockedAssetsRef.current.forEach((a) => URL.revokeObjectURL(a.preview));
    };
  }, []);

  // Mutations
  const promptMut = useGeneratePromptBlueprint();
  const suggestMut = useSuggestBrief();
  const imageMut = useGenerateImage();
  const videoMut = useGenerateVideo();
  const uploadMut = useUploadToLibrary();
  const videoStatus = useVideoStatus(activeVideoId);

  const videoDone =
    videoStatus.data?.status === "completed" && !!videoStatus.data.outputUrl;
  const videoProcessing =
    activeVideoId != null &&
    (videoStatus.data?.status === "processing" ||
      videoStatus.data?.status === "pending" ||
      !videoStatus.data);
  const videoFailed = videoStatus.data?.status === "failed";
  const videoUrl = videoDone ? videoStatus.data?.outputUrl ?? null : null;

  useEffect(() => {
    if (videoDone && activeStep === "video") {
      setActiveStep("done");
      setMaxReachedIdx((m) => Math.max(m, steps.indexOf("done")));
    }
  }, [videoDone, activeStep, steps]);

  const imageBlueprintReady = useMemo(
    () => Object.values(imageFields).every((v) => v.trim().length > 2),
    [imageFields]
  );
  const videoBlueprintReady = useMemo(
    () => Object.values(videoFields).every((v) => v.trim().length > 2),
    [videoFields]
  );

  // Pipeline tab auto-advance: once image blueprint is filled, move to video
  const pipelineTabEffective: "image" | "video" = useMemo(() => {
    if (intent !== "pipeline") return pipelineTab;
    if (imageBlueprintReady && pipelineTab === "image" && !videoBlueprintReady) {
      return "video";
    }
    return pipelineTab;
  }, [intent, pipelineTab, imageBlueprintReady, videoBlueprintReady]);

  // ─── Intent handling ──────────────────────────────────────────────
  const pickIntent = useCallback(
    (i: Intent) => {
      setIntent(i);
      const options = ratiosFor(i);
      setRatio((r) =>
        (options as readonly string[]).includes(r) ? r : defaultRatioFor(i)
      );
      advanceTo("brief");
    },
    [advanceTo]
  );

  const switchIntent = useCallback(
    (next: Intent) => {
      if (intent === next) return;
      if (activeVideoId) {
        qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
      }
      setIntent(next);
      const options = ratiosFor(next);
      setRatio((r) =>
        (options as readonly string[]).includes(r) ? r : defaultRatioFor(next)
      );
      setImageUrl(null);
      setActiveVideoId(null);
      setExtendFromId(null);
      setExtendFromBriefText(null);
      refFiles.forEach((r) => URL.revokeObjectURL(r.preview));
      setRefFiles([]);
      if (next === "video") setAssembledImagePrompt("");
      if (next === "image") setAssembledVideoPrompt("");
      const newSteps = stepsFor(next);
      setActiveStep("brief");
      setMaxReachedIdx(newSteps.indexOf("brief"));
      toast.success(
        COPY.generate.toasts.intentSwitched(COPY.generate.intentLabels[next])
      );
    },
    [intent, activeVideoId, qc, refFiles]
  );

  const resetAll = useCallback(() => {
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setIntent(null);
    setActiveStep("goal");
    setMaxReachedIdx(0);
    setBrief("");
    setImageFields(EMPTY_IMAGE_FIELDS);
    setVideoFields(EMPTY_VIDEO_FIELDS);
    setImageUrl(null);
    setActiveVideoId(null);
    setExtendFromId(null);
    setExtendFromBriefText(null);
    setLastHighlight(null);
    setPipelineTab("image");
    setPromptTab("image");
    setAssembledImagePrompt("");
    setAssembledVideoPrompt("");
    lockedAssets.forEach((a) => URL.revokeObjectURL(a.preview));
    setLockedAssets([]);
    refFiles.forEach((r) => URL.revokeObjectURL(r.preview));
    setRefFiles([]);
  }, [activeVideoId, qc, refFiles, lockedAssets]);

  const createVariant = useCallback(() => {
    if (!intent) return;
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setImageUrl(null);
    setActiveVideoId(null);
    setExtendFromId(null);
    setExtendFromBriefText(null);
    const target: StepId =
      intent === "pipeline" ? "image" : intent === "image" ? "image" : "video";
    setActiveStep(target);
    setMaxReachedIdx(steps.indexOf(target));
  }, [intent, activeVideoId, qc, steps]);

  const extendVideo = useCallback(() => {
    if (!activeVideoId) return;
    setExtendFromId(activeVideoId);
    setExtendFromBriefText(brief);
    qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    setImageUrl(null);
    setActiveVideoId(null);
    setBrief("");
    setVideoFields(EMPTY_VIDEO_FIELDS);
    setAssembledVideoPrompt("");
    setIntent("video");
    const next = stepsFor("video");
    setActiveStep("brief");
    setMaxReachedIdx(next.indexOf("brief"));
    toast.success(COPY.generate.toasts.extendStarted);
  }, [activeVideoId, brief, qc]);

  const animateImage = useCallback(() => {
    if (!imageUrl) return;
    setIntent("pipeline");
    setActiveVideoId(null);
    setVideoFields(EMPTY_VIDEO_FIELDS);
    setBrief("");
    setAssembledVideoPrompt("");
    setPipelineTab("video");
    const pipe = stepsFor("pipeline");
    setActiveStep("brief");
    setMaxReachedIdx(pipe.indexOf("brief"));
    toast.info(
      "Animasyon brief'ini yaz — görselin videonun ilk karesi olacak."
    );
  }, [imageUrl]);

  // ─── Brief handlers ──────────────────────────────────────────────
  async function rollDice() {
    if (!intent) return;
    try {
      const res = await suggestMut.mutateAsync({
        project,
        target: intent,
        ratio,
        avoidHighlight: lastHighlight ?? undefined,
        extendFromBrief: extendFromBriefText ?? undefined,
      });
      setBrief(res.suggestion);
      setLastHighlight(res.pickedHighlight);
      toast.success(
        COPY.generate.toasts.briefDrafted(res.pickedHighlight)
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : COPY.generate.toasts.suggestionFailed
      );
    }
  }

  async function fillBlueprintWithAI(target: "image" | "video") {
    if (!brief.trim()) {
      toast.error(COPY.generate.toasts.briefNeeded);
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
      toast.success(COPY.generate.toasts.blueprintDrafted);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : COPY.generate.toasts.blueprintDraftFailed
      );
    }
  }

  async function regenerateImageField(key: keyof ImagePromptFields & string) {
    if (!brief.trim()) {
      toast.error(COPY.generate.toasts.briefNeeded);
      return;
    }
    setRegeneratingImageField(key);
    try {
      const res = await promptMut.mutateAsync({
        project,
        target: "image",
        ratio,
        brief: brief.trim(),
        existingFields: imageFields,
        regenerateFields: [key],
      });
      const fresh = (res.fields as ImagePromptFields)[key];
      if (fresh && fresh.trim().length > 0) {
        setImageFields((prev) => ({ ...prev, [key]: fresh }));
        toast.success(COPY.generate.toasts.fieldRegenerated(key));
      }
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : COPY.generate.toasts.fieldRegenerationFailed
      );
    } finally {
      setRegeneratingImageField(null);
    }
  }
  async function regenerateVideoField(key: keyof VideoPromptFields & string) {
    if (!brief.trim()) {
      toast.error(COPY.generate.toasts.briefNeeded);
      return;
    }
    setRegeneratingVideoField(key);
    try {
      const res = await promptMut.mutateAsync({
        project,
        target: "video",
        ratio,
        brief: brief.trim(),
        existingFields: videoFields,
        regenerateFields: [key],
      });
      const fresh = (res.fields as VideoPromptFields)[key];
      if (fresh && fresh.trim().length > 0) {
        setVideoFields((prev) => ({ ...prev, [key]: fresh }));
        toast.success(COPY.generate.toasts.fieldRegenerated(key));
      }
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : COPY.generate.toasts.fieldRegenerationFailed
      );
    } finally {
      setRegeneratingVideoField(null);
    }
  }

  function addLockedAsset(file: File, kind: LockedAsset["kind"]) {
    if (lockedAssets.length >= 3) return;
    if (!file.type.startsWith("image/")) return;
    setLockedAssets((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file), kind },
    ]);
  }
  function removeLockedAsset(i: number) {
    setLockedAssets((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[i].preview);
      next.splice(i, 1);
      return next;
    });
  }
  function changeLockedKind(i: number, kind: LockedAsset["kind"]) {
    setLockedAssets((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], kind };
      return next;
    });
  }

  function continueFromBrief() {
    if (!intent) return;
    if (intent === "image" && !imageBlueprintReady) {
      toast.error(COPY.generate.toasts.blueprintIncomplete);
      return;
    }
    if (intent === "video" && !videoBlueprintReady) {
      toast.error(COPY.generate.toasts.blueprintIncomplete);
      return;
    }
    if (intent === "pipeline" && (!imageBlueprintReady || !videoBlueprintReady)) {
      toast.error(COPY.generate.toasts.blueprintIncomplete);
      if (!imageBlueprintReady) setPipelineTab("image");
      else setPipelineTab("video");
      return;
    }
    if (intent === "image" || intent === "pipeline") {
      setAssembledImagePrompt(assembleImagePrompt(imageFields));
    }
    if (intent === "video" || intent === "pipeline") {
      setAssembledVideoPrompt(assembleVideoPrompt(videoFields));
    }
    advanceTo("prompt");
  }

  function rebuildImagePromptFromBlueprint() {
    setAssembledImagePrompt(assembleImagePrompt(imageFields));
    toast.success(COPY.generate.toasts.imagePromptRebuilt);
  }
  function rebuildVideoPromptFromBlueprint() {
    setAssembledVideoPrompt(assembleVideoPrompt(videoFields));
    toast.success(COPY.generate.toasts.videoPromptRebuilt);
  }

  function continueFromPrompt() {
    if (!intent) return;
    if (intent === "video") advanceTo("video");
    else advanceTo("image");
  }

  async function handleGenerateImage() {
    if (!intent) return;
    try {
      const lockedPayload: LockedAssetInput[] = [];
      for (const a of lockedAssets) {
        const { imageBytes, mimeType } = await fileToBase64(a.file);
        lockedPayload.push({ imageBytes, mimeType, kind: a.kind });
      }
      const res = await imageMut.mutateAsync({
        project,
        ratio: asImageRatio(ratio),
        prompt: assembledImagePrompt || assembleImagePrompt(imageFields),
        lockedAssets: lockedPayload.length ? lockedPayload : undefined,
      });
      setImageUrl(res.outputUrl);
      advanceTo(intent === "pipeline" ? "postImage" : "done");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : COPY.generate.toasts.imageGenFailed
      );
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
          ? assembledImagePrompt || assembleImagePrompt(imageFields)
          : "User-uploaded image",
      });
      setImageUrl(res.outputUrl);
      advanceTo(intent === "pipeline" ? "postImage" : "done");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : COPY.generate.toasts.imageUploadFailed
      );
    }
  }

  function pickImageFromLibrary(url: string) {
    if (!intent) return;
    setImageUrl(url);
    advanceTo(intent === "pipeline" ? "postImage" : "done");
  }

  function redoImage() {
    setImageUrl(null);
    setActiveStep("image");
  }

  function continueFromImage() {
    if (!intent) return;
    advanceTo(intent === "pipeline" ? "postImage" : "done");
  }

  function continueToVideo() {
    advanceTo("video");
  }
  function stopAtImage() {
    advanceTo("done");
  }

  function handleAddReference(file: File) {
    if (refFiles.length >= 3) return;
    if (!file.type.startsWith("image/")) return;
    setRefFiles((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file) },
    ]);
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
    try {
      const prompt = assembledVideoPrompt || assembleVideoPrompt(videoFields);
      const usingExtend = !!extendFromId;
      const usingPipelineFirstFrame =
        !usingExtend && intent === "pipeline" && !!imageUrl;
      const usingRefs =
        !usingExtend &&
        !usingPipelineFirstFrame &&
        intent === "video" &&
        refFiles.length > 0;

      const refsBase64: ReferenceImageInput[] = [];
      if (usingRefs) {
        for (const r of refFiles) {
          const { imageBytes, mimeType } = await fileToBase64(r.file);
          refsBase64.push({ imageBytes, mimeType });
        }
      }

      const res = await videoMut.mutateAsync({
        project,
        ratio: asVideoRatio(ratio),
        prompt,
        durationSeconds,
        firstFrameUrl: usingPipelineFirstFrame ? imageUrl! : undefined,
        referenceImages: usingRefs ? refsBase64 : undefined,
        sourceGenerationId: usingExtend ? extendFromId! : undefined,
        lockedAssetKinds:
          usingPipelineFirstFrame && lockedAssets.length
            ? lockedAssets.map((a) => a.kind)
            : undefined,
      });
      setActiveVideoId(res.generationId);
      toast.success(
        COPY.generate.toasts.videoStarted(projectMeta.name, ratio)
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : COPY.generate.toasts.videoGenFailed
      );
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
          ? assembledVideoPrompt || assembleVideoPrompt(videoFields)
          : "User-uploaded video",
      });
      setActiveVideoId(res.generationId);
      advanceTo("done");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : COPY.generate.toasts.videoUploadFailed
      );
    }
  }

  function redoVideo() {
    if (activeVideoId) {
      qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
    }
    setActiveVideoId(null);
  }

  // ─── Summaries ───────────────────────────────────────────────────
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;
  const briefSummary =
    brief.length > 60
      ? `${brief.slice(0, 60)}…`
      : brief || COPY.generate.steps.brief.summaryEmpty;
  const promptForSummary =
    intent === "video" ? assembledVideoPrompt : assembledImagePrompt;
  const promptSummary = promptForSummary
    ? promptForSummary.length > 60
      ? `${promptForSummary.slice(0, 60)}…`
      : promptForSummary
    : COPY.generate.steps.prompt.summaryEmpty;

  // "Start over" (reached via the top bar)
  const [startOverOpen, setStartOverOpen] = useState(false);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="max-w-[960px] mx-auto px-6 py-6 pb-24">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="serif text-[34px] ink">
            {COPY.generate.pageTitle}
          </div>
          <div className="text-[14.5px] ink-3 mt-0.5">
            {COPY.generate.pageSubtitle}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            title="Tüm üretimlerini gör"
            className="text-[14.5px] ink-2 hover:ink flex items-center gap-1.5 transition"
          >
            <LibraryIcon className="h-3.5 w-3.5" /> {COPY.generate.topbarLibrary}
          </Link>
          {intent && (
            <button
              type="button"
              onClick={() => setStartOverOpen(true)}
              title="Her şeyi temizle ve hedef seçim ekranına dön"
              className="text-[14.5px] ink-2 hover:ink transition"
            >
              {COPY.generate.startOver}
            </button>
          )}
        </div>
      </div>

      {/* Extend banner */}
      {extendFromId && intent && activeStep !== "done" && (
        <div className="mb-4 rounded-xl border border-brand bg-brand-soft px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand text-brand-ink">
            <Film className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-medium text-brand-ink">
              {COPY.generate.extendBanner.title}
            </div>
            <div className="text-[13.5px] text-brand-ink opacity-80 mt-0.5">
              {COPY.generate.extendBanner.sub}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setExtendFromId(null);
              setExtendFromBriefText(null);
            }}
            className="ink-2 hover:ink transition"
            aria-label={COPY.generate.extendBanner.cancel}
            title={COPY.generate.extendBanner.cancel}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {/* Step 1: Goal */}
        <TimelineStep
          stepNumber={steps.indexOf("goal") + 1}
          title={COPY.generate.steps.goal.title}
          subtitle={STEP_SUBTITLES.goal}
          visual={visualFor("goal")}
          help={stepHelp("goal")}
          summary={
            intent ? (
              <span>
                <span className="ink">
                  {COPY.generate.intentLabels[intent]}
                </span>{" "}
                <span className="ink-3">
                  · {projectMeta.name} · {ratio}
                </span>
              </span>
            ) : null
          }
          onEdit={() => editStep("goal")}
        >
          {!intent ? (
            <IntentPicker onPick={pickIntent} />
          ) : (
            <div className="space-y-3">
              <IntentPill
                intent={intent}
                onSwitch={switchIntent}
                onChange={resetAll}
              />
              <ProjectRatioBar
                ratio={ratio}
                onRatioChange={setRatio}
                intent={intent}
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => advanceTo("brief")}
                  title="Brief ve şema adımına geç"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[15px] font-semibold hover:brightness-95 transition"
                >
                  {COPY.generate.steps.goal.continueButton}{" "}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </TimelineStep>

        {/* Step 2: Brief + Blueprint + Asset lock */}
        {intent && (
          <TimelineStep
            stepNumber={steps.indexOf("brief") + 1}
            title={COPY.generate.steps.brief.title}
            subtitle={STEP_SUBTITLES.brief}
            visual={visualFor("brief")}
            help={stepHelp("brief")}
            summary={
              <span className="ink-3 truncate">{briefSummary}</span>
            }
            onEdit={() => editStep("brief")}
          >
            <div className="space-y-4">
              <BriefStage
                intent={intent}
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
                onRegenerateImageField={regenerateImageField}
                onRegenerateVideoField={regenerateVideoField}
                regeneratingImageField={regeneratingImageField}
                regeneratingVideoField={regeneratingVideoField}
              />

              {(intent === "image" || intent === "pipeline") && (
                <AssetLockEditor
                  assets={lockedAssets}
                  onAdd={addLockedAsset}
                  onRemove={removeLockedAsset}
                  onKindChange={changeLockedKind}
                />
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={continueFromBrief}
                  title={COPY.generate.steps.brief.continueButtonHint}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[15px] font-semibold hover:brightness-95 transition"
                >
                  {COPY.generate.steps.brief.continueButton}{" "}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </TimelineStep>
        )}

        {/* Step 3: Prompt */}
        {intent && (
          <TimelineStep
            stepNumber={steps.indexOf("prompt") + 1}
            title={COPY.generate.steps.prompt.title}
            subtitle={STEP_SUBTITLES.prompt}
            visual={visualFor("prompt")}
            help={stepHelp("prompt")}
            summary={
              <span className="ink-3 truncate">{promptSummary}</span>
            }
            onEdit={() => editStep("prompt")}
          >
            <div className="space-y-3">
              {intent === "pipeline" ? (
                <>
                  <div className="flex items-center gap-1 border-b border-line-2">
                    {(
                      [
                        {
                          k: "image",
                          l: COPY.generate.steps.prompt.tabImage,
                          Icon: ImageIcon,
                        },
                        {
                          k: "video",
                          l: COPY.generate.steps.prompt.tabVideo,
                          Icon: VideoIcon,
                        },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.k}
                        onClick={() => setPromptTab(t.k)}
                        className={`px-3 h-8 text-[14.5px] relative inline-flex items-center gap-1.5 ${
                          promptTab === t.k
                            ? "ink font-medium"
                            : "ink-3 hover:ink"
                        }`}
                      >
                        <t.Icon className="h-3 w-3" />
                        {t.l}
                        {promptTab === t.k && (
                          <div className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />
                        )}
                      </button>
                    ))}
                  </div>
                  {promptTab === "image" ? (
                    <AssembledPromptEditor
                      value={assembledImagePrompt}
                      onChange={setAssembledImagePrompt}
                      onResetFromBlueprint={rebuildImagePromptFromBlueprint}
                    />
                  ) : (
                    <AssembledPromptEditor
                      value={assembledVideoPrompt}
                      onChange={setAssembledVideoPrompt}
                      onResetFromBlueprint={rebuildVideoPromptFromBlueprint}
                    />
                  )}
                </>
              ) : intent === "image" ? (
                <AssembledPromptEditor
                  value={assembledImagePrompt}
                  onChange={setAssembledImagePrompt}
                  onResetFromBlueprint={rebuildImagePromptFromBlueprint}
                />
              ) : (
                <AssembledPromptEditor
                  value={assembledVideoPrompt}
                  onChange={setAssembledVideoPrompt}
                  onResetFromBlueprint={rebuildVideoPromptFromBlueprint}
                />
              )}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={continueFromPrompt}
                  title={
                    intent === "video"
                      ? "Video üretim adımına geç"
                      : "Görsel üretim adımına geç"
                  }
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[15px] font-semibold hover:brightness-95 transition"
                >
                  {intent === "video"
                    ? COPY.generate.steps.prompt.continueButtonVideo
                    : COPY.generate.steps.prompt.continueButtonImage}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </TimelineStep>
        )}

        {/* Step 4: Image */}
        {intent && steps.includes("image") && (
          <TimelineStep
            stepNumber={steps.indexOf("image") + 1}
            title={COPY.generate.steps.image.title}
            subtitle={STEP_SUBTITLES.image}
            visual={visualFor("image")}
            help={stepHelp("image")}
            summary={
              imageUrl ? (
                <span className="inline-flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Görsel özet"
                    className="h-8 w-8 rounded object-cover"
                  />
                  <span className="ink-3">Hazır</span>
                </span>
              ) : null
            }
            onEdit={() => editStep("image")}
          >
            <ImageStage
              intent={intent}
              project={project}
              ratio={ratio}
              imageUrl={imageUrl}
              onGenerate={handleGenerateImage}
              onUploadFile={handleImageFile}
              onPickFromLibrary={pickImageFromLibrary}
              onRedo={redoImage}
              onContinue={continueFromImage}
              aiLoading={imageMut.isPending}
              uploadLoading={uploadMut.isPending}
            />
          </TimelineStep>
        )}

        {/* Step 5 (pipeline): Continue? */}
        {intent === "pipeline" && (
          <TimelineStep
            stepNumber={steps.indexOf("postImage") + 1}
            title={COPY.generate.steps.postImage.title}
            subtitle={STEP_SUBTITLES.postImage}
            visual={visualFor("postImage")}
            help={stepHelp("postImage")}
            summary={
              activeStep === "done" && !videoUrl ? (
                <span className="ink-3">
                  {COPY.generate.steps.postImage.summaryStopped}
                </span>
              ) : (
                <span className="ink-3">
                  {COPY.generate.steps.postImage.summaryContinuing}
                </span>
              )
            }
            onEdit={() => editStep("postImage")}
          >
            {imageUrl && (
              <PostImageGate
                imageUrl={imageUrl}
                ratio={ratio}
                onContinue={continueToVideo}
                onStop={stopAtImage}
              />
            )}
          </TimelineStep>
        )}

        {/* Step N: Video */}
        {intent && steps.includes("video") && (
          <TimelineStep
            stepNumber={steps.indexOf("video") + 1}
            title={COPY.generate.steps.video.title}
            subtitle={STEP_SUBTITLES.video}
            visual={visualFor("video")}
            help={stepHelp("video")}
            summary={
              videoUrl ? (
                <span className="ink-3">Hazır</span>
              ) : videoProcessing ? (
                <span className="ink-3">Render ediliyor…</span>
              ) : videoFailed ? (
                <span style={{ color: "var(--nb-danger)" }}>
                  Başarısız — tekrar denemek için Düzenle
                </span>
              ) : null
            }
            onEdit={() => editStep("video")}
          >
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
          </TimelineStep>
        )}

        {/* Done */}
        {intent && activeStep === "done" && (
          <TimelineStep
            stepNumber={steps.indexOf("done") + 1}
            title={COPY.generate.steps.done.title}
            visual="active"
            help={stepHelp("done")}
          >
            <CompletionCard
              intent={intent}
              project={project}
              ratio={ratio}
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              onCreateVariant={createVariant}
              onStartOver={resetAll}
              onExtendVideo={
                videoUrl && activeVideoId ? extendVideo : undefined
              }
              onAnimateImage={
                imageUrl && !videoUrl ? animateImage : undefined
              }
            />
          </TimelineStep>
        )}
      </div>

      <AlertDialog open={startOverOpen} onOpenChange={setStartOverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {COPY.generate.steps.goal.changeConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {COPY.generate.steps.goal.changeConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {COPY.generate.steps.goal.changeConfirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setStartOverOpen(false);
                resetAll();
              }}
            >
              {COPY.generate.steps.goal.changeConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
