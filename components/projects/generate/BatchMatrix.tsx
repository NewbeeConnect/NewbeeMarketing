"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PLATFORMS, LANGUAGES, ASPECT_RATIOS } from "@/lib/constants";

interface BatchItem {
  language: string;
  platform: string;
  aspectRatio: string;
  selected: boolean;
}

interface BatchMatrixProps {
  projectLanguages: string[];
  projectPlatforms: string[];
  batchItems: BatchItem[];
  onToggle: (language: string, platform: string) => void;
  onToggleAll: (selected: boolean) => void;
  scenesCount: number;
}

export function BatchMatrix({
  projectLanguages,
  projectPlatforms,
  batchItems,
  onToggle,
  onToggleAll,
  scenesCount,
}: BatchMatrixProps) {
  const selectedCount = batchItems.filter((b) => b.selected).length;
  const totalVideos = selectedCount * scenesCount;

  const getLangLabel = (val: string) =>
    LANGUAGES.find((l) => l.value === val)?.label ?? val;
  const getPlatformLabel = (val: string) =>
    PLATFORMS.find((p) => p.value === val)?.label ?? val;
  const getPlatformAspect = (val: string) =>
    PLATFORMS.find((p) => p.value === val)?.aspectRatio ?? "9:16";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Batch Generation Matrix</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedCount} combinations
            </Badge>
            <Badge>{totalVideos} total videos</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Select which language + platform combinations to generate. Each
          combination creates one video per scene ({scenesCount} scenes).
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  <Checkbox
                    checked={selectedCount === batchItems.length}
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                  />
                </th>
                <th className="text-left p-2 font-medium">Language</th>
                <th className="text-left p-2 font-medium">Platform</th>
                <th className="text-left p-2 font-medium">Aspect Ratio</th>
                <th className="text-left p-2 font-medium">Resolution</th>
                <th className="text-right p-2 font-medium">Videos</th>
              </tr>
            </thead>
            <tbody>
              {projectLanguages.flatMap((lang) =>
                projectPlatforms.map((platform) => {
                  const item = batchItems.find(
                    (b) => b.language === lang && b.platform === platform
                  );
                  const aspectRatio = getPlatformAspect(platform);
                  const resolution =
                    ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS];

                  return (
                    <tr
                      key={`${lang}-${platform}`}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={item?.selected ?? false}
                          onCheckedChange={() => onToggle(lang, platform)}
                        />
                      </td>
                      <td className="p-2">{getLangLabel(lang)}</td>
                      <td className="p-2">{getPlatformLabel(platform)}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {aspectRatio}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {resolution
                          ? `${resolution.width}x${resolution.height}`
                          : "1080x1920"}
                      </td>
                      <td className="p-2 text-right">{scenesCount}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
