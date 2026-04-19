"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ImageIcon, Video as VideoIcon } from "lucide-react";
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
import {
  AssembledPromptEditor,
} from "@/components/generate/AssembledPromptEditor";
import {
  AssetLockEditor,
  type LockedAsset,
} from "@/components/generate/AssetLockEditor";

import { PROJECTS, type AnyRatio, type ProjectSlug } from "@/lib/projects";
import {
  type Intent,
  asImageRatio,
  asVideoRatio,
  defaultRatioFor,
  intentLabel,
  ratiosFor,
} from "@/lib/generate/machine";
import {
  type StepId,
  type StepVisual,
  stepsFor,
} from "@/lib/generate/timeline";
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

/**
 * Read a File as base64 using native FileReader. ~10–20× faster than manually
 * walking the byte array and avoids the chunked `btoa` stack-overflow trap
 * on multi-MB images.
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
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const qc = useQueryClient();

  // Timeline: a sequence of steps that all stay on the page. Completed steps
  // collapse to a summary; the active step is expanded. Edit on a completed
  // step jumps the active pointer back. maxReachedIdx keeps downstream steps
  // visible (as completed summaries) even after we jump back — so "scroll
  // down to see what you did" always works.
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
  const [project, setProject] = useState<ProjectSlug>("newbee");
  const [ratio, setRatio] = useState<AnyRatio>("9:16");

  // Brief state
  const [brief, setBrief] = useState("");
  const [imageFields, setImageFields] = useState<ImagePromptFields>(EMPTY_IMAGE_FIELDS);
  const [videoFields, setVideoFields] = useState<VideoPromptFields>(EMPTY_VIDEO_FIELDS);
  const [pipelineTab, setPipelineTab] = useState<"image" | "video">("image");
  const [regeneratingImageField, setRegeneratingImageField] =
    useState<(keyof ImagePromptFields & string) | null>(null);
  const [regeneratingVideoField, setRegeneratingVideoField] =
    useState<(keyof VideoPromptFields & string) | null>(null);

  // Assets the user wants preserved pixel-faithfully (UI screenshots, logos,
  // product photos). Lives in the brief step but used by image + video.
  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>([]);

  // Assembled prompts — seeded from blueprint helpers, user-editable in the
  // prompt step. Kept as separate strings so the pipeline intent can edit
  // both in one step.
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

  // Extension state (Veo continues from the last frame of this video)
  const [extendFromId, setExtendFromId] = useState<string | null>(null);
  const [extendFromBriefText, setExtendFromBriefText] = useState<string | null>(
    null
  );

  // "Roll the dice" — track last highlight for variety on repeat rolls
  const [lastHighlight, setLastHighlight] = useState<string | null>(null);

  // Unmount cleanup: revoke any live ObjectURLs we created for previews.
  // In-flow remove/reset/switch/variant handlers already revoke the URLs they
  // drop — this catches the navigate-away-mid-edit case where the component
  // unmounts without hitting those paths.
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

  // ─── Mutations ────────────────────────────────────────────────────
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

  // When video completes, auto-advance activeStep to "done". Derived from
  // polling status in useEffect so we don't setState during render.
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

  // Auto-advance pipeline tab once image blueprint is ready
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
      setRatio((r) => ((options as readonly string[]).includes(r) ? r : defaultRatioFor(i)));
      advanceTo("brief");
    },
    [advanceTo]
  );

  const switchIntent = useCallback(
    (next: Intent) => {
      if (intent === next) return;
      // Soft switch: keep brief + blueprint + locked assets, clear downstream.
      if (activeVideoId) {
        qc.removeQueries({ queryKey: ["video-status", activeVideoId] });
      }
      setIntent(next);
      const options = ratiosFor(next);
      setRatio((r) => ((options as readonly string[]).includes(r) ? r : defaultRatioFor(next)));
      setImageUrl(null);
      setActiveVideoId(null);
      setExtendFromId(null);
      setExtendFromBriefText(null);
      refFiles.forEach((r) => URL.revokeObjectURL(r.preview));
      setRefFiles([]);
      // Preserve the prompt edits that are still meaningful for the new intent.
      // - next="video"  → image prompt unused; clear it (drop stale edit)
      // - next="image"  → video prompt unused; clear it
      // - next="pipeline" → keep both (image prompt still applies to the image
      //                    stage, video prompt still applies to the video stage)
      if (next === "video") setAssembledImagePrompt("");
      if (next === "image") setAssembledVideoPrompt("");
      // Jump back to brief; downstream steps re-open as the user advances.
      const newSteps = stepsFor(next);
      setActiveStep("brief");
      setMaxReachedIdx(newSteps.indexOf("brief"));
      toast.success(COPY.toasts.intentSwitched(intentLabel(next)));
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
    // Drop back to the first "making" step for this intent so user can re-run.
    const target: StepId =
      intent === "pipeline" ? "image" : intent === "image" ? "image" : "video";
    setActiveStep(target);
    setMaxReachedIdx(steps.indexOf(target));
  }, [intent, activeVideoId, qc, steps]);

  /**
   * Extension: start a new video that continues from the current video's
   * last frame. We keep the same intent="video" flow but pre-feed brief
   * context so Gemini writes the next beat in the same story.
   */
  const extendVideo = useCallback(() => {
    if (!activeVideoId) return;
    setExtendFromId(activeVideoId);
    setExtendFromBriefText(brief); // so next roll/draft continues the story
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
    toast.success("Continuing from your last video — write the next beat.");
  }, [activeVideoId, brief, qc]);

  /**
   * Animate-later: user is in "done" with only an image, decides to animate it
   * now. Switch to pipeline intent, image stage is already "reached", user
   * writes a fresh video brief in the brief step.
   */
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
    toast.info("Write the animation brief — your image is the first frame.");
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
        res.pickedHighlight
          ? `Brief drafted around: ${res.pickedHighlight}. Roll again for a different angle.`
          : "New brief drafted."
      );
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

  // Per-field regenerate — asks Gemini to rewrite only one field
  async function regenerateImageField(key: keyof ImagePromptFields & string) {
    if (!brief.trim()) {
      toast.error(COPY.toasts.briefNeeded);
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
        toast.success(`Regenerated ${key}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Field regeneration failed");
    } finally {
      setRegeneratingImageField(null);
    }
  }
  async function regenerateVideoField(key: keyof VideoPromptFields & string) {
    if (!brief.trim()) {
      toast.error(COPY.toasts.briefNeeded);
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
        toast.success(`Regenerated ${key}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Field regeneration failed");
    } finally {
      setRegeneratingVideoField(null);
    }
  }

  // ─── Asset lock handlers ─────────────────────────────────────────
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

  // ─── Continue from brief ─────────────────────────────────────────
  function continueFromBrief() {
    if (!intent) return;
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
    // Seed assembled prompts from the blueprint helpers. User edits win.
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
    toast.success("Image prompt rebuilt from blueprint.");
  }
  function rebuildVideoPromptFromBlueprint() {
    setAssembledVideoPrompt(assembleVideoPrompt(videoFields));
    toast.success("Video prompt rebuilt from blueprint.");
  }

  function continueFromPrompt() {
    if (!intent) return;
    if (intent === "video") advanceTo("video");
    else advanceTo("image");
  }

  // ─── Image handlers ──────────────────────────────────────────────
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
          ? assembledImagePrompt || assembleImagePrompt(imageFields)
          : "User-uploaded image",
      });
      setImageUrl(res.outputUrl);
      advanceTo(intent === "pipeline" ? "postImage" : "done");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed");
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

  /**
   * When the user Edits back to the image step (imageUrl already set) they
   * need an explicit forward action — the auto-advance on generate/upload
   * only fires for fresh runs. This moves them to the next logical step
   * without re-running Gemini.
   */
  function continueFromImage() {
    if (!intent) return;
    advanceTo(intent === "pipeline" ? "postImage" : "done");
  }

  // ─── postImage gate ──────────────────────────────────────────────
  function continueToVideo() {
    advanceTo("video");
  }
  function stopAtImage() {
    advanceTo("done");
  }

  // ─── Video handlers ──────────────────────────────────────────────
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
        // Pipeline path: the first-frame image already baked the locked
        // assets in. Tell Veo to keep them still.
        lockedAssetKinds:
          usingPipelineFirstFrame && lockedAssets.length
            ? lockedAssets.map((a) => a.kind)
            : undefined,
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
          ? assembledVideoPrompt || assembleVideoPrompt(videoFields)
          : "User-uploaded video",
      });
      setActiveVideoId(res.generationId);
      advanceTo("done");
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

  // ─── Summaries for completed steps ────────────────────────────────
  const briefSummary =
    brief.length > 90 ? `${brief.slice(0, 90)}…` : brief || "(empty)";
  const projectMeta = PROJECTS.find((p) => p.slug === project)!;

  // Prompt summary: show truncated prompt, or a placeholder if empty. The
  // older implementation always appended "…" which looked wrong next to the
  // placeholder string.
  const promptForSummary =
    intent === "video" ? assembledVideoPrompt : assembledImagePrompt;
  const promptSummary = promptForSummary
    ? promptForSummary.length > 90
      ? `${promptForSummary.slice(0, 90)}…`
      : promptForSummary
    : "(auto-drafted from blueprint)";

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl w-full mx-auto">
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

      {/* Extend banner — sticks at top once set */}
      {extendFromId && intent && activeStep !== "done" && (
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
            onClick={() => {
              setExtendFromId(null);
              setExtendFromBriefText(null);
            }}
            className="shrink-0"
          >
            Cancel extend
          </Button>
        </Card>
      )}

      {/* Step 1: Goal — IntentPicker + Project/Ratio */}
      <TimelineStep
        stepNumber={steps.indexOf("goal") + 1}
        title="Goal"
        visual={visualFor("goal")}
        summary={
          intent ? (
            <span>
              <span className="font-medium">{intentLabel(intent)}</span>{" "}
              <span className="text-muted-foreground">
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
          <div className="space-y-4">
            <IntentPill
              intent={intent}
              onSwitch={switchIntent}
              onChange={resetAll}
            />
            <Card className="p-4">
              <ProjectRatioBar
                project={project}
                onProjectChange={setProject}
                ratio={ratio}
                onRatioChange={setRatio}
                intent={intent}
              />
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => advanceTo("brief")}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </TimelineStep>

      {/* Step 2: Brief + blueprint(s) + asset lock */}
      {intent && (
        <TimelineStep
          stepNumber={steps.indexOf("brief") + 1}
          title="Brief & blueprint"
          visual={visualFor("brief")}
          summary={
            <span className="text-muted-foreground truncate">{briefSummary}</span>
          }
          onEdit={() => editStep("brief")}
        >
          <div className="space-y-4">
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
              onRegenerateImageField={regenerateImageField}
              onRegenerateVideoField={regenerateVideoField}
              regeneratingImageField={regeneratingImageField}
              regeneratingVideoField={regeneratingVideoField}
            />

            {/* Asset lock editor — only for intents that actually produce pixels
                to which assets would attach (image + pipeline). Standalone video
                uses reference-image slots in the video stage instead. */}
            {(intent === "image" || intent === "pipeline") && (
              <Card className="p-4">
                <AssetLockEditor
                  assets={lockedAssets}
                  onAdd={addLockedAsset}
                  onRemove={removeLockedAsset}
                  onKindChange={changeLockedKind}
                />
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={continueFromBrief}>
                Continue to prompt
              </Button>
            </div>
          </div>
        </TimelineStep>
      )}

      {/* Step 3: Assembled prompt — editable */}
      {intent && (
        <TimelineStep
          stepNumber={steps.indexOf("prompt") + 1}
          title="Prompt"
          visual={visualFor("prompt")}
          summary={
            <span className="text-muted-foreground truncate">
              {promptSummary}
            </span>
          }
          onEdit={() => editStep("prompt")}
        >
          <div className="space-y-4">
            {intent === "pipeline" ? (
              <Tabs defaultValue="image">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="image">
                    <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                    Image prompt
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <VideoIcon className="h-3.5 w-3.5 mr-1.5" />
                    Video prompt
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="image" className="pt-3">
                  <AssembledPromptEditor
                    value={assembledImagePrompt}
                    onChange={setAssembledImagePrompt}
                    onResetFromBlueprint={rebuildImagePromptFromBlueprint}
                    hint="Nano Banana 2 sees this exactly as written."
                  />
                </TabsContent>
                <TabsContent value="video" className="pt-3">
                  <AssembledPromptEditor
                    value={assembledVideoPrompt}
                    onChange={setAssembledVideoPrompt}
                    onResetFromBlueprint={rebuildVideoPromptFromBlueprint}
                    hint="Veo 3.1 sees this exactly as written."
                  />
                </TabsContent>
              </Tabs>
            ) : intent === "image" ? (
              <AssembledPromptEditor
                value={assembledImagePrompt}
                onChange={setAssembledImagePrompt}
                onResetFromBlueprint={rebuildImagePromptFromBlueprint}
                hint="Nano Banana 2 sees this exactly as written."
              />
            ) : (
              <AssembledPromptEditor
                value={assembledVideoPrompt}
                onChange={setAssembledVideoPrompt}
                onResetFromBlueprint={rebuildVideoPromptFromBlueprint}
                hint="Veo 3.1 sees this exactly as written."
              />
            )}

            <div className="flex justify-end">
              <Button onClick={continueFromPrompt}>
                {intent === "video" ? "Continue to video" : "Continue to image"}
              </Button>
            </div>
          </div>
        </TimelineStep>
      )}

      {/* Step 4: Image (or step 4-of-N for pipeline) */}
      {intent && steps.includes("image") && (
        <TimelineStep
          stepNumber={steps.indexOf("image") + 1}
          title="Image"
          visual={visualFor("image")}
          summary={
            imageUrl ? (
              <span className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Image summary"
                  className="h-8 w-8 rounded object-cover"
                />
                <span className="text-muted-foreground">Ready</span>
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

      {/* Step 5 (pipeline): postImage gate */}
      {intent === "pipeline" && (
        <TimelineStep
          stepNumber={steps.indexOf("postImage") + 1}
          title="Continue?"
          visual={visualFor("postImage")}
          summary={
            activeStep === "done" && !videoUrl ? (
              <span className="text-muted-foreground">Stopped at image</span>
            ) : (
              <span className="text-muted-foreground">Continuing to video</span>
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
          title="Video"
          visual={visualFor("video")}
          summary={
            videoUrl ? (
              <span className="text-muted-foreground">Ready</span>
            ) : videoProcessing ? (
              <span className="text-muted-foreground">Rendering…</span>
            ) : videoFailed ? (
              <span className="text-destructive">Failed — tap Edit to retry</span>
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
          title="Done"
          visual="active"
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
  );
}
