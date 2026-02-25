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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LANGUAGES } from "@/lib/constants";
import { Subtitles, Loader2, Pencil, Save, Download } from "lucide-react";
import type { Caption } from "@/types/database";

interface CaptionEditorProps {
  captions: Caption[];
  projectLanguages: string[];
  onGenerate: (language: string) => void;
  onUpdate: (captionId: string, srtContent: string) => void;
  onEmbed: (captionId: string) => void;
  isGenerating: boolean;
  isEmbedding: boolean;
}

export function CaptionEditor({
  captions,
  projectLanguages,
  onGenerate,
  onUpdate,
  onEmbed,
  isGenerating,
  isEmbedding,
}: CaptionEditorProps) {
  const [selectedLang, setSelectedLang] = useState(projectLanguages[0] || "en");
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const currentCaption = captions.find((c) => c.language === selectedLang);

  const handleStartEdit = (caption: Caption) => {
    setEditingCaption(caption.id);
    setEditedContent(caption.srt_content);
  };

  const handleSaveEdit = () => {
    if (editingCaption) {
      onUpdate(editingCaption, editedContent);
      setEditingCaption(null);
    }
  };

  const handleDownloadSrt = (caption: Caption) => {
    const blob = new Blob([caption.srt_content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `captions_${caption.language}.srt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Subtitles className="h-4 w-4" />
            Captions / Subtitles
          </CardTitle>
          <Badge variant="outline">
            {captions.length} language{captions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector + Generate */}
        <div className="flex items-center gap-3">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-40">
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

          <Button
            size="sm"
            onClick={() => onGenerate(selectedLang)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Subtitles className="h-3.5 w-3.5 mr-1" />
            )}
            {currentCaption ? "Regenerate" : "Generate"} Captions
          </Button>
        </div>

        {/* Caption Content */}
        {currentCaption ? (
          <div className="space-y-3">
            {editingCaption === currentCaption.id ? (
              <>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCaption(null)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-[200px] whitespace-pre-wrap">
                {currentCaption.srt_content}
              </pre>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`embed-${currentCaption.id}`}
                    checked={currentCaption.is_embedded}
                    onCheckedChange={() => onEmbed(currentCaption.id)}
                    disabled={isEmbedding}
                  />
                  <Label
                    htmlFor={`embed-${currentCaption.id}`}
                    className="text-sm"
                  >
                    Embed in video
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStartEdit(currentCaption)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadSrt(currentCaption)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download SRT
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">
              No captions generated for {LANGUAGES.find((l) => l.value === selectedLang)?.label || selectedLang} yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
