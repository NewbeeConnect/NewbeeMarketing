"use client";

import {
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { COPY } from "@/lib/generate/copy";

/**
 * 2-column grid of blueprint fields. Each field is a small panel on bg-soft
 * with a label + per-field regenerate button in the top-right corner, then
 * an inline input with placeholder text equal to the field's hint.
 *
 * Top row of the editor has a "Draft with Gemini" button that refills all
 * fields from the brief at once; a "Ready" chip appears when every field
 * has content.
 */
export function FieldsEditor<T extends Record<string, string>>({
  title,
  icon,
  fieldList,
  values,
  onChange,
  onFillAI,
  aiLoading,
  ready,
  onRegenerateField,
  regeneratingField,
  hideHeader = false,
}: {
  title: string;
  icon: React.ReactNode;
  fieldList: { key: keyof T & string; label: string; hint: string }[];
  values: T;
  onChange: (key: keyof T & string, value: string) => void;
  /**
   * "Draft with Gemini" handler. Optional — only needed when the inner
   * header is rendered (`hideHeader={false}`). When the parent renders its
   * own Draft button (e.g. BriefStage), this can be omitted.
   */
  onFillAI?: () => void;
  aiLoading: boolean;
  ready: boolean;
  onRegenerateField?: (key: keyof T & string) => void;
  regeneratingField?: (keyof T & string) | null;
  /**
   * Hide the title row — used inside pipeline Tabs where each tab already
   * has its own "Image blueprint / Video blueprint" label.
   */
  hideHeader?: boolean;
}) {
  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold ink">
              {icon}
              {title}
            </div>
            {ready && (
              <span
                className="inline-flex items-center gap-1 px-2 h-6 text-[11px] rounded-md border"
                style={{
                  background: "var(--nb-success-soft)",
                  borderColor: "transparent",
                  color: "var(--nb-success-ink)",
                }}
              >
                <Check className="h-2.5 w-2.5" />
                {COPY.blueprint.ready}
              </span>
            )}
          </div>
          {onFillAI && (
            <button
              type="button"
              onClick={onFillAI}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-panel text-[12.5px] ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 nb-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {aiLoading ? COPY.brief.drafting : COPY.brief.draftButton}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fieldList.map((f) => {
          const isRegen = regeneratingField === f.key;
          const canRegen =
            !!onRegenerateField &&
            (values[f.key] as string).trim().length > 0;
          return (
            <div
              key={f.key}
              className="rounded-lg border border-line-2 bg-soft p-2.5"
            >
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-medium ink-2">
                  {f.label}
                </label>
                {canRegen && (
                  <button
                    type="button"
                    onClick={() => onRegenerateField?.(f.key)}
                    disabled={aiLoading || isRegen}
                    className="text-[10.5px] ink-3 hover:text-brand-ink flex items-center gap-1 disabled:opacity-40"
                    title="Regenerate just this field"
                  >
                    {isRegen ? (
                      <Loader2 className="h-2.5 w-2.5 nb-spin" />
                    ) : (
                      <RefreshCw className="h-2.5 w-2.5" />
                    )}
                  </button>
                )}
              </div>
              <input
                value={values[f.key] as string}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.hint}
                disabled={isRegen}
                className="w-full mt-1 text-[12.5px] ink bg-transparent outline-none placeholder:ink-3"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
