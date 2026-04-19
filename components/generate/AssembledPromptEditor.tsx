"use client";

import { RefreshCw } from "lucide-react";

/**
 * The exact prompt string that will go to the model. User-editable — any
 * edits win. The "Rebuild from blueprint" link re-runs the assembly helper
 * from the current blueprint fields and overwrites the textarea.
 *
 * Hint text below explains: "What you see here is exactly what the model
 * receives."
 */
export function AssembledPromptEditor({
  value,
  onChange,
  onResetFromBlueprint,
  hint = "What you see here is exactly what the model receives.",
}: {
  value: string;
  onChange: (v: string) => void;
  onResetFromBlueprint: () => void;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11.5px] ink-3">{hint}</div>
        <button
          type="button"
          onClick={onResetFromBlueprint}
          className="text-[11.5px] ink-3 hover:text-brand-ink flex items-center gap-1 transition"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Rebuild from blueprint
        </button>
      </div>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your edited prompt, sent as-is to the model."
        className="w-full px-3 py-2.5 rounded-md border border-line bg-panel text-[13px] ink outline-none resize-none focus:border-brand mono"
      />
    </div>
  );
}
