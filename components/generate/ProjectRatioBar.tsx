"use client";

import { PROJECTS, type AnyRatio } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { ratiosFor } from "@/lib/generate/machine";

/**
 * Aspect ratio switcher. The hub used to also carry a project pill row;
 * with the hub running single-tenant (Newbee only) we drop the project
 * switcher entirely. Ratio options still filter by intent (image supports
 * 4:5 / 1:1; video and pipeline only 9:16 / 16:9).
 */
export function ProjectRatioBar({
  ratio,
  onRatioChange,
  intent,
}: {
  ratio: AnyRatio;
  onRatioChange: (r: AnyRatio) => void;
  intent: Intent | null;
}) {
  const options = intent ? ratiosFor(intent) : [];
  const disabled = intent === null;
  // Showing the brand as a read-only label keeps the "we are making for
  // Newbee" context visible without a useless one-option switcher.
  const brand = PROJECTS[0];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] ink-3">For</span>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-soft border border-line-2 text-[12px] font-medium ink"
        title={brand.description}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: brand.color }}
          aria-hidden
        />
        {brand.name}
      </span>

      <span className="text-[11px] ink-3 ml-2">Aspect</span>
      <select
        value={disabled ? "" : ratio}
        onChange={(e) => onRatioChange(e.target.value as AnyRatio)}
        disabled={disabled}
        title={disabled ? "Pick what you want to make first." : undefined}
        className="h-9 px-2.5 pr-8 rounded-md border border-line bg-panel text-[12.5px] ink outline-none focus:border-brand appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
          backgroundPosition: "right 8px center",
          backgroundRepeat: "no-repeat",
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
