"use client";

import { PROJECTS, type AnyRatio } from "@/lib/projects";
import type { Intent } from "@/lib/generate/machine";
import { ratiosFor } from "@/lib/generate/machine";
import { COPY } from "@/lib/i18n/copy";

/**
 * En-boy (aspect ratio) seçici. Hub eskiden burada proje pill'lerini de
 * göstererek çoklu tenant'a destek veriyordu — single-tenant (Newbee) yapıya
 * geçilince pill switcher düştü. Brand'i read-only bir label olarak
 * gösteriyoruz ki "bu Newbee için üretiyoruz" context'i ekrandan kaybolmasın.
 *
 * Ratio seçenekleri intent'e göre filtrelenir (görsel 4 seçenek, video 2).
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
  const brand = PROJECTS[0];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] ink-3">Kimin için</span>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-soft border border-line-2 text-[14px] font-medium ink"
        title={brand.description}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: brand.color }}
          aria-hidden
        />
        {brand.name}
      </span>

      <span className="text-[13px] ink-3 ml-2">En-boy</span>
      <select
        value={disabled ? "" : ratio}
        onChange={(e) => onRatioChange(e.target.value as AnyRatio)}
        disabled={disabled}
        title={
          disabled
            ? "Önce ne üretmek istediğini seç"
            : COPY.concepts.ratio.long
        }
        className="h-9 px-2.5 pr-8 rounded-md border border-line bg-panel text-[14.5px] ink outline-none focus:border-brand appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
          backgroundPosition: "right 8px center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {disabled && <option value="">—</option>}
        {options.map((r) => {
          const label = (
            COPY.concepts.ratio.examples as Record<string, string | undefined>
          )[r];
          return (
            <option key={r} value={r} title={label}>
              {label ?? r}
            </option>
          );
        })}
      </select>
    </div>
  );
}
