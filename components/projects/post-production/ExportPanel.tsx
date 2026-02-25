"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORMS, RESOLUTIONS } from "@/lib/constants";
import { Download, Package, Loader2, ExternalLink } from "lucide-react";
import type { Generation } from "@/types/database";

interface ExportPanelProps {
  projectPlatforms: string[];
  completedGenerations: Generation[];
  onExport: (config: {
    platforms: string[];
    includeCaption: boolean;
    includeWatermark: boolean;
    resolution: string;
  }) => void;
  isExporting: boolean;
}

export function ExportPanel({
  projectPlatforms,
  completedGenerations,
  onExport,
  isExporting,
}: ExportPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(projectPlatforms);
  const [includeCaption, setIncludeCaption] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [resolution, setResolution] = useState("1080p");

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleExport = () => {
    onExport({
      platforms: selectedPlatforms,
      includeCaption,
      includeWatermark,
      resolution,
    });
  };

  const handleDownloadVideo = (gen: Generation) => {
    if (gen.output_url) {
      const a = document.createElement("a");
      a.href = gen.output_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Export & Download
          </CardTitle>
          <Badge variant="outline">
            {completedGenerations.length} video{completedGenerations.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Export for Platforms
          </p>
          <div className="grid grid-cols-2 gap-2">
            {projectPlatforms.map((platform) => {
              const def = PLATFORMS.find((p) => p.value === platform);
              return (
                <label
                  key={platform}
                  className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <span className="text-sm">{def?.label || platform}</span>
                  <Badge variant="outline" className="ml-auto text-xs font-mono">
                    {def?.aspectRatio || "9:16"}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Options
          </p>

          <div className="flex items-center justify-between">
            <Label htmlFor="caption-export" className="text-sm">
              Include embedded captions
            </Label>
            <Switch
              id="caption-export"
              checked={includeCaption}
              onCheckedChange={setIncludeCaption}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="watermark-export" className="text-sm">
              Include watermark
            </Label>
            <Switch
              id="watermark-export"
              checked={includeWatermark}
              onCheckedChange={setIncludeWatermark}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((res) => (
                  <SelectItem key={res.value} value={res.value}>
                    {res.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Button */}
        <Button
          className="w-full"
          onClick={handleExport}
          disabled={isExporting || selectedPlatforms.length === 0}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Export ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""})
            </>
          )}
        </Button>

        {/* Quick Download */}
        {completedGenerations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quick Download
            </p>
            <div className="space-y-1">
              {completedGenerations.slice(0, 5).map((gen) => (
                <Button
                  key={gen.id}
                  variant="ghost"
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => handleDownloadVideo(gen)}
                >
                  <Download className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span className="truncate flex-1 text-left">
                    {gen.type === "stitched" ? "Full Video" : gen.prompt.substring(0, 40)}
                    {gen.prompt.length > 40 ? "..." : ""}
                  </span>
                  {gen.language && (
                    <Badge variant="outline" className="text-xs ml-2 shrink-0">
                      {gen.language.toUpperCase()}
                    </Badge>
                  )}
                  <ExternalLink className="h-3 w-3 ml-1 shrink-0 text-muted-foreground" />
                </Button>
              ))}
              {completedGenerations.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{completedGenerations.length - 5} more videos
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
