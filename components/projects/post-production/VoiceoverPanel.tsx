"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/constants";
import { Mic, Loader2, Play } from "lucide-react";
import type { Scene, Generation } from "@/types/database";

const VOICE_OPTIONS: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  en: [
    { value: "en-US-Studio-O", label: "Studio O (Female)" },
    { value: "en-US-Studio-Q", label: "Studio Q (Male)" },
    { value: "en-US-Neural2-C", label: "Neural2 C (Female)" },
    { value: "en-US-Neural2-D", label: "Neural2 D (Male)" },
  ],
  de: [
    { value: "de-DE-Studio-B", label: "Studio B (Male)" },
    { value: "de-DE-Studio-C", label: "Studio C (Female)" },
    { value: "de-DE-Neural2-B", label: "Neural2 B (Male)" },
  ],
  tr: [
    { value: "tr-TR-Standard-E", label: "Standard E (Female)" },
    { value: "tr-TR-Standard-B", label: "Standard B (Male)" },
  ],
};

interface VoiceoverPanelProps {
  scenes: Scene[];
  voiceoverGenerations: Generation[];
  projectLanguages: string[];
  onGenerate: (sceneId: string, text: string, language: string, voiceName?: string) => void;
  isGenerating: boolean;
}

export function VoiceoverPanel({
  scenes,
  voiceoverGenerations,
  projectLanguages,
  onGenerate,
  isGenerating,
}: VoiceoverPanelProps) {
  const [selectedLang, setSelectedLang] = useState(projectLanguages[0] || "en");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [customText, setCustomText] = useState("");
  const [selectedScene, setSelectedScene] = useState<string>("");

  const voiceoverScenes = scenes.filter(
    (s) => s.audio_type === "tts_voiceover" && s.voiceover_text
  );

  const handleGenerateForScene = (scene: Scene) => {
    onGenerate(
      scene.id,
      scene.voiceover_text || scene.description,
      selectedLang,
      selectedVoice || undefined
    );
  };

  const handleGenerateCustom = () => {
    if (!customText.trim()) return;
    onGenerate(
      selectedScene || "",
      customText,
      selectedLang,
      selectedVoice || undefined
    );
    setCustomText("");
  };

  const voices = VOICE_OPTIONS[selectedLang] || VOICE_OPTIONS.en;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voiceover
          </CardTitle>
          <Badge variant="outline">
            {voiceoverScenes.length} scene{voiceoverScenes.length !== 1 ? "s" : ""} with VO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Settings */}
        <div className="flex items-center gap-3">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectLanguages.map((lang) => {
                const langDef = LANGUAGES.find((l) => l.value === lang);
                return (
                  <SelectItem key={lang} value={lang}>
                    {langDef?.label || lang}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scene Voiceovers */}
        {voiceoverScenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scene Voiceovers
            </p>
            {voiceoverScenes.map((scene) => {
              const existing = voiceoverGenerations.find(
                (g) =>
                  g.scene_id === scene.id &&
                  g.language === selectedLang &&
                  g.status === "completed"
              );

              return (
                <div
                  key={scene.id}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      Scene {scene.scene_number}: {scene.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {scene.voiceover_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {existing?.output_url && (
                      <audio
                        src={existing.output_url}
                        controls
                        className="h-8 w-32"
                      />
                    )}
                    <Button
                      size="sm"
                      variant={existing ? "outline" : "default"}
                      onClick={() => handleGenerateForScene(scene)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : existing ? (
                        "Redo"
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Voiceover */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Custom Voiceover
          </p>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom voiceover text..."
            className="min-h-[80px] text-sm"
          />
          <div className="flex items-center gap-2">
            {scenes.length > 0 && (
              <Select value={selectedScene} onValueChange={setSelectedScene}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Link to scene" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No scene</SelectItem>
                  {scenes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Scene {s.scene_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              onClick={handleGenerateCustom}
              disabled={isGenerating || !customText.trim()}
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Mic className="h-3.5 w-3.5 mr-1" />
              )}
              Generate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
