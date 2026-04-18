"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FrameCard } from "@/components/stories/FrameCard";
import { ClipCard } from "@/components/stories/ClipCard";
import {
  useCreateStory,
  useGenerateClip,
  useGenerateFrame,
  useStitchStory,
  useStory,
  useUpdateStory,
  type StoryGeneration,
} from "@/hooks/useStory";

type Aspect = "9:16" | "16:9" | "1:1";
type Duration = 4 | 6 | 8;
type Tier = "fast" | "standard";

export default function GeneratePage() {
  const [storyId, setStoryId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState<Aspect>("9:16");
  const [duration, setDuration] = useState<Duration>(8);
  const [tier, setTier] = useState<Tier>("standard");

  // Local edits layered over server state. Undefined = "not yet edited,
  // follow server". Set by the user to override the server value.
  const [framePromptOverrides, setFramePromptOverrides] =
    useState<Record<string, string>>({});
  const [scriptOverrides, setScriptOverrides] =
    useState<Record<string, string>>({});

  const { data: bundle } = useStory(storyId);
  const createStory = useCreateStory();
  const updateStory = useUpdateStory(storyId ?? "");
  const frameMut = useGenerateFrame(storyId ?? "");
  const clipMut = useGenerateClip(storyId ?? "");
  const stitchMut = useStitchStory(storyId ?? "");

  const localFramePrompts = {
    ...((bundle?.story.frame_prompts ?? {}) as Record<string, string>),
    ...framePromptOverrides,
  };
  const localScripts = {
    ...((bundle?.story.scene_scripts ?? {}) as Record<string, string>),
    ...scriptOverrides,
  };

  const framesByIndex = useMemo(() => {
    const map: Record<number, StoryGeneration> = {};
    (bundle?.frames ?? []).forEach((g) => {
      if (g.sequence_index) map[g.sequence_index] = g;
    });
    return map;
  }, [bundle]);

  const clipsByIndex = useMemo(() => {
    const map: Record<number, StoryGeneration> = {};
    (bundle?.clips ?? []).forEach((g) => {
      if (g.sequence_index) map[g.sequence_index] = g;
    });
    return map;
  }, [bundle]);

  async function handleCreate() {
    if (!topic.trim()) {
      toast.error("Story topic boş olamaz");
      return;
    }
    try {
      const res = await createStory.mutateAsync({
        topic: topic.trim(),
        aspect_ratio: aspectRatio,
        duration_per_clip_seconds: duration,
        model_tier: tier,
      });
      setStoryId(res.story.id);
      toast.success("Story senaryosu hazır — frame'leri üretmeye başlayabilirsin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Story oluşturulamadı");
    }
  }

  async function handleGenerateFrame(index: number) {
    if (!storyId) return;
    // Persist prompt first
    await updateStory.mutateAsync({ frame_prompts: localFramePrompts }).catch(() => {});
    try {
      await frameMut.mutateAsync(index);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Frame ${index} başarısız`);
    }
  }

  async function handleGenerateClip(index: number) {
    if (!storyId) return;
    await updateStory.mutateAsync({ scene_scripts: localScripts }).catch(() => {});
    try {
      await clipMut.mutateAsync(index);
      toast.success(`Clip ${index} Veo'ya gönderildi (2-3 dk sürer)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Clip ${index} başarısız`);
    }
  }

  async function handleGenerateAllFrames() {
    for (const index of [1, 2, 3, 4, 5]) {
      try {
        await frameMut.mutateAsync(index);
      } catch {
        toast.error(`Frame ${index} başarısız — devam ediliyor`);
      }
    }
  }

  async function handleGenerateAllClips() {
    for (const index of [1, 2, 3, 4]) {
      try {
        await clipMut.mutateAsync(index);
      } catch {
        toast.error(`Clip ${index} başlatılamadı — devam ediliyor`);
      }
    }
  }

  async function handleStitch() {
    try {
      await stitchMut.mutateAsync();
      toast.success("Videolar birleştirildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Birleştirme başarısız");
    }
  }

  const allFramesReady = [1, 2, 3, 4, 5].every(
    (i) => framesByIndex[i]?.status === "completed"
  );
  const allClipsReady = [1, 2, 3, 4].every(
    (i) => clipsByIndex[i]?.status === "completed"
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Continuous Story Video</h1>
          <p className="text-sm text-muted-foreground">
            4 sahneli, 5 paylaşımlı keyframe ile dikişsiz geçişli video üretici.
          </p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_auto_auto_auto_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="topic">Story topic</Label>
            <Textarea
              id="topic"
              rows={2}
              placeholder="Örn: Newbee uygulamasının AI destekli kampanya akışını anlatan kısa reklam"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Aspect</Label>
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as Aspect)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">9:16</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v) as Duration)}
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
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createStory.isPending || !topic.trim()}
            size="lg"
            className="md:self-end"
          >
            {createStory.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Yazıyor
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-1.5" />
                {storyId ? "New story" : "Generate story"}
              </>
            )}
          </Button>
        </div>

        {bundle?.story.style_anchor && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
            <span className="font-medium text-foreground">Style anchor:</span>{" "}
            {bundle.story.style_anchor}
          </div>
        )}
      </Card>

      {storyId && (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Keyframes (5)</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAllFrames}
                disabled={frameMut.isPending}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Hepsini üret
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((idx) => {
                const boundary =
                  idx === 1
                    ? "clip 1 başlangıcı"
                    : idx === 5
                    ? "clip 4 sonu"
                    : `clip ${idx - 1} sonu / clip ${idx} başı`;
                return (
                  <FrameCard
                    key={idx}
                    index={idx as 1 | 2 | 3 | 4 | 5}
                    prompt={localFramePrompts[String(idx)] ?? ""}
                    generation={framesByIndex[idx]}
                    aspectRatio={aspectRatio}
                    boundaryLabel={boundary}
                    onPromptChange={(v) =>
                      setFramePromptOverrides((prev) => ({ ...prev, [String(idx)]: v }))
                    }
                    onGenerate={() => handleGenerateFrame(idx)}
                    generating={frameMut.isPending}
                  />
                );
              })}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Clips (4)</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAllClips}
                disabled={!allFramesReady || clipMut.isPending}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Hepsini üret
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((idx) => (
                <ClipCard
                  key={idx}
                  index={idx as 1 | 2 | 3 | 4}
                  script={localScripts[String(idx)] ?? ""}
                  generation={clipsByIndex[idx]}
                  aspectRatio={aspectRatio}
                  framesReady={
                    framesByIndex[idx]?.status === "completed" &&
                    framesByIndex[idx + 1]?.status === "completed"
                  }
                  onScriptChange={(v) =>
                    setScriptOverrides((prev) => ({ ...prev, [String(idx)]: v }))
                  }
                  onGenerate={() => handleGenerateClip(idx)}
                  generating={clipMut.isPending}
                />
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Final</h2>
                <p className="text-xs text-muted-foreground">
                  4 clip&apos;i tek bir mp4 olarak birleştir (FFmpeg concat).
                </p>
              </div>
              <Button
                onClick={handleStitch}
                disabled={!allClipsReady || stitchMut.isPending}
              >
                {stitchMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Birleştiriliyor
                  </>
                ) : (
                  <>Videoları birleştir</>
                )}
              </Button>
            </div>
            {bundle?.stitched?.output_url && (
              <div className="space-y-2">
                <video
                  src={bundle.stitched.output_url}
                  controls
                  className="w-full rounded-md bg-black"
                />
                <a
                  href={bundle.stitched.output_url}
                  download
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  İndir
                </a>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
