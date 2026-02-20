"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AudioType } from "@/types/database";
import { Volume2, Mic, VolumeX } from "lucide-react";

interface AudioConfigProps {
  audioType: AudioType;
  voiceoverText?: string | null;
  voiceoverLanguage?: string | null;
  onAudioTypeChange: (type: AudioType) => void;
  onVoiceoverTextChange: (text: string) => void;
  onVoiceoverLanguageChange: (lang: string) => void;
}

export function AudioConfig({
  audioType,
  voiceoverText,
  voiceoverLanguage,
  onAudioTypeChange,
  onVoiceoverTextChange,
  onVoiceoverLanguageChange,
}: AudioConfigProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Audio Type</Label>
        <Select value={audioType} onValueChange={(v) => onAudioTypeChange(v as AudioType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="native_veo">
              <span className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5" />
                Native Veo Audio
              </span>
            </SelectItem>
            <SelectItem value="tts_voiceover">
              <span className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                TTS Voiceover
              </span>
            </SelectItem>
            <SelectItem value="silent">
              <span className="flex items-center gap-2">
                <VolumeX className="h-3.5 w-3.5" />
                Silent (Music Only)
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {audioType === "tts_voiceover" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Voiceover Text</Label>
            <Textarea
              value={voiceoverText ?? ""}
              onChange={(e) => onVoiceoverTextChange(e.target.value)}
              placeholder="What should be spoken in this scene..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Voiceover Language</Label>
            <Select
              value={voiceoverLanguage ?? "en"}
              onValueChange={onVoiceoverLanguageChange}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="tr">Turkce</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
