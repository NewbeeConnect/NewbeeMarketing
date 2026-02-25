"use client";

import { useState } from "react";
import type { Scene, AudioType } from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AudioConfig } from "./AudioConfig";
import {
  GripVertical,
  Clock,
  Camera,
  Sun,
  Type,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: Scene;
  onUpdate: (data: Partial<Scene>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function SceneCard({
  scene,
  onUpdate,
  onDelete,
  onDuplicate,
  dragHandleProps,
}: SceneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(scene.title);
  const [description, setDescription] = useState(scene.description);
  const [camera, setCamera] = useState(scene.camera_movement ?? "");
  const [lighting, setLighting] = useState(scene.lighting ?? "");
  const [textOverlay, setTextOverlay] = useState(scene.text_overlay ?? "");
  const [audioType, setAudioType] = useState<AudioType>(scene.audio_type);
  const [voiceoverText, setVoiceoverText] = useState(scene.voiceover_text ?? "");
  const [voiceoverLang, setVoiceoverLang] = useState(scene.voiceover_language ?? "en");

  const startEditing = () => {
    setTitle(scene.title);
    setDescription(scene.description);
    setCamera(scene.camera_movement ?? "");
    setLighting(scene.lighting ?? "");
    setTextOverlay(scene.text_overlay ?? "");
    setAudioType(scene.audio_type);
    setVoiceoverText(scene.voiceover_text ?? "");
    setVoiceoverLang(scene.voiceover_language ?? "en");
    setEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      title,
      description,
      camera_movement: camera || null,
      lighting: lighting || null,
      text_overlay: textOverlay || null,
      audio_type: audioType,
      voiceover_text: audioType === "tts_voiceover" ? voiceoverText || null : null,
      voiceover_language: audioType === "tts_voiceover" ? voiceoverLang : null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <Card className={cn("transition-colors", expanded && "ring-1 ring-primary/20")}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <Badge variant="outline" className="shrink-0">
            {scene.scene_number}
          </Badge>

          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-7 text-sm font-medium"
            />
          ) : (
            <span className="text-sm font-medium truncate flex-1">
              {scene.title}
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {scene.duration_seconds}s
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!expanded && (
        <CardContent className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {scene.description}
          </p>
        </CardContent>
      )}

      {expanded && (
        <CardContent className="px-3 pb-3 pt-0 space-y-3">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Camera
                  </label>
                  <Input
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    placeholder="e.g., slow zoom in"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Sun className="h-3 w-3" /> Lighting
                  </label>
                  <Input
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    placeholder="e.g., warm, golden hour"
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Type className="h-3 w-3" /> Text Overlay
                </label>
                <Input
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Text to show on screen"
                  className="h-7 text-xs"
                />
              </div>

              <AudioConfig
                audioType={audioType}
                voiceoverText={voiceoverText}
                voiceoverLanguage={voiceoverLang}
                onAudioTypeChange={setAudioType}
                onVoiceoverTextChange={setVoiceoverText}
                onVoiceoverLanguageChange={setVoiceoverLang}
              />

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs">{scene.description}</p>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {scene.camera_movement && (
                  <span className="flex items-center gap-1">
                    <Camera className="h-3 w-3" /> {scene.camera_movement}
                  </span>
                )}
                {scene.lighting && (
                  <span className="flex items-center gap-1">
                    <Sun className="h-3 w-3" /> {scene.lighting}
                  </span>
                )}
                {scene.text_overlay && (
                  <span className="flex items-center gap-1">
                    <Type className="h-3 w-3" /> &quot;{scene.text_overlay}&quot;
                  </span>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={onDuplicate}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
