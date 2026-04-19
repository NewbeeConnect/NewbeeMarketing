"use client";

import {
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { COPY } from "@/lib/i18n/copy";

/**
 * 6 alanlı şema (Blueprint) editörü — 2-sütunlu grid. Her alan küçük bir
 * panel: label + sağ üstte "sadece bunu yeniden yaz" ⟳ butonu + içeri inline
 * input.
 *
 * Üst başlık satırı ("Gemini ile taslak yaz") isteğe bağlı; BriefStage zaten
 * kendi başlık satırını renderliyor (hideHeader=true).
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
  fieldList: readonly { key: keyof T & string; label: string; hint: string }[];
  values: T;
  onChange: (key: keyof T & string, value: string) => void;
  onFillAI?: () => void;
  aiLoading: boolean;
  ready: boolean;
  onRegenerateField?: (key: keyof T & string) => void;
  regeneratingField?: (keyof T & string) | null;
  hideHeader?: boolean;
}) {
  const fe = COPY.generate.fieldsEditor;
  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[14.5px] font-semibold ink">
              {icon}
              {title}
            </div>
            {ready && (
              <span
                className="inline-flex items-center gap-1 px-2 h-6 text-[13px] rounded-md border"
                style={{
                  background: "var(--nb-success-soft)",
                  borderColor: "transparent",
                  color: "var(--nb-success-ink)",
                }}
              >
                <Check className="h-2.5 w-2.5" />
                {fe.ready}
              </span>
            )}
          </div>
          {onFillAI && (
            <button
              type="button"
              onClick={onFillAI}
              disabled={aiLoading}
              title="Brief'ini alıp tüm şema alanlarını Gemini ile otomatik doldur"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-panel text-[14.5px] ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 nb-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {aiLoading ? fe.draftingAll : fe.draftAll}
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
                <label
                  className="text-[13.5px] font-medium ink-2"
                  title={f.hint}
                >
                  {f.label}
                </label>
                {canRegen && (
                  <button
                    type="button"
                    onClick={() => onRegenerateField?.(f.key)}
                    disabled={aiLoading || isRegen}
                    className="text-[12px] ink-3 hover:text-brand-ink flex items-center gap-1 disabled:opacity-40"
                    title={fe.regenerateTitle}
                  >
                    {isRegen ? (
                      <Loader2 className="h-2.5 w-2.5 nb-spin" />
                    ) : (
                      <RefreshCw className="h-2.5 w-2.5" />
                    )}
                  </button>
                )}
              </div>
              {/*
                Textarea (not input) with auto-resize — Gemini writes long,
                specific sentences ("slow dolly-in from locked tripod,
                12mm focal length") that single-line inputs crop silently.
                rows={2} keeps the collapsed state tight, and `field-sizing:
                content` lets it grow to fit on input. Safari still crops
                to rows — acceptable fallback.
              */}
              <textarea
                value={values[f.key] as string}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.hint}
                disabled={isRegen}
                title={f.hint}
                rows={2}
                style={{ fieldSizing: "content" } as React.CSSProperties}
                className="w-full mt-1 text-[14.5px] ink bg-transparent outline-none placeholder:ink-3 resize-y min-h-[2.25rem] leading-snug"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
