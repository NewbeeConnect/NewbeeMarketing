"use client";

import { RefreshCw } from "lucide-react";
import { COPY } from "@/lib/i18n/copy";

/**
 * Modele gidecek son mesajı (prompt) gösteren + düzenlemeye izin veren
 * editor. Textarea mono font'ta — user bunun bir "teknik mesaj" olduğunu
 * görsel olarak anlasın. "Şemadan yeniden yaz" linki Blueprint alanlarını
 * yeniden birleştirir; user edit'lerini siler.
 */
export function AssembledPromptEditor({
  value,
  onChange,
  onResetFromBlueprint,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onResetFromBlueprint: () => void;
  hint?: string;
}) {
  const s = COPY.generate.steps.prompt;
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="text-[13.5px] ink-3">{hint ?? s.hint}</div>
        <button
          type="button"
          onClick={onResetFromBlueprint}
          title="Şema alanlarını tek bir prompt metnine dönüştür (elle yaptığın değişiklikleri siler)"
          className="text-[13.5px] ink-3 hover:text-brand-ink flex items-center gap-1 transition rotate-on-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 rounded"
        >
          <RefreshCw className="h-2.5 w-2.5" /> {s.rebuildFromBlueprint}
        </button>
      </div>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={s.summaryEmpty}
        className="w-full px-3 py-2.5 rounded-md border border-line bg-panel text-[15px] ink outline-none resize-none focus:border-brand mono"
      />
    </div>
  );
}
