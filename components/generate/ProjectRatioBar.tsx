"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PROJECTS,
  type AnyRatio,
  type ProjectSlug,
} from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { ratiosFor } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

/**
 * Project chips + context-aware ratio select. Ratio options change with
 * intent; when intent is null we disable the select entirely and explain why
 * via tooltip so new users aren't confused.
 */
export function ProjectRatioBar({
  project,
  onProjectChange,
  ratio,
  onRatioChange,
  intent,
}: {
  project: ProjectSlug;
  onProjectChange: (p: ProjectSlug) => void;
  ratio: AnyRatio;
  onRatioChange: (r: AnyRatio) => void;
  intent: Intent | null;
}) {
  const options = intent ? ratiosFor(intent) : [];
  const disabled = intent === null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
      <div className="space-y-2">
        <Label>Project</Label>
        <div className="flex gap-2">
          {PROJECTS.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onProjectChange(p.slug)}
              className={`flex-1 rounded-md border-2 p-2.5 text-sm text-left transition-colors ${
                project === p.slug
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-2">
              <Label>Aspect ratio</Label>
              <Select
                value={disabled ? "" : ratio}
                onValueChange={(v) => onRatioChange(v as AnyRatio)}
                disabled={disabled}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {(disabled || intent === "pipeline") && (
            <TooltipContent>
              {disabled
                ? COPY.ratioPicker.disabledHint
                : COPY.ratioPicker.pipelineHint}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
