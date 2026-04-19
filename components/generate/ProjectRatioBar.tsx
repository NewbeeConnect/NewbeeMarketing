"use client";

import { PROJECTS, type AnyRatio, type ProjectSlug } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { ratiosFor } from "@/lib/generate/machine";

/**
 * Project + aspect ratio switcher, matching the hub's segmented-style
 * presentation. Ratio options filter by intent (image supports 4:5 / 1:1,
 * video and pipeline only 9:16 / 16:9). Disabled until an intent is chosen.
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] ink-3">Project</span>
      <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
        {PROJECTS.map((p) => {
          const active = project === p.slug;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onProjectChange(p.slug)}
              className={`px-2.5 h-7 rounded-md text-[12px] whitespace-nowrap ${
                active
                  ? "bg-panel shadow-card ink font-medium"
                  : "ink-3 hover:ink"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <span className="text-[11px] ink-3 ml-2">Aspect</span>
      <select
        value={disabled ? "" : ratio}
        onChange={(e) => onRatioChange(e.target.value as AnyRatio)}
        disabled={disabled}
        title={disabled ? "Pick what you want to make first." : undefined}
        className="h-9 px-2.5 pr-8 rounded-md border border-line bg-panel text-[12.5px] ink outline-none focus:border-brand appearance-none bg-no-repeat disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
          backgroundPosition: "right 8px center",
        }}
      >
        {disabled && <option value="">—</option>}
        {options.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
