"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ImageOff, Loader2, X } from "lucide-react";
import { useLibraryImages } from "@/hooks/useGeneration";
import type { ImageRatio, ProjectSlug } from "@/lib/projects";
import { PROJECTS } from "@/lib/projects";

/**
 * Modal grid of the user's existing images for the current project+ratio.
 * Picking one hands the URL back — no new Gemini call. Uses a plain overlay
 * (no shadcn Dialog) to match the hub design's shadow-pop + rounded-xl.
 */
export function LibraryPickerDialog({
  open,
  onOpenChange,
  project,
  ratio,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectSlug;
  ratio: ImageRatio;
  onPick: (url: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: items, isLoading } = useLibraryImages({
    project,
    ratio,
    enabled: open,
  });
  const projectLabel =
    PROJECTS.find((p) => p.slug === project)?.name ?? project;

  const close = useCallback(() => {
    onOpenChange(false);
    setSelected(null);
  }, [onOpenChange]);

  // Escape to close — we rolled this modal by hand (no shadcn Dialog) to
  // match the hub visual spec, so we re-implement the keyboard behavior.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick from library"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30,20,10,.5)" }}
      onClick={close}
    >
      <div
        className="bg-panel rounded-xl border border-line shadow-pop w-full max-w-[820px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-line-2 flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold ink">Pick from library</div>
            <div className="text-[12px] ink-3">
              {projectLabel} · {ratio} · reuse an existing image, no new cost.
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-md inline-flex items-center justify-center ink-2 hover:bg-soft hover:ink transition"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-[13px] ink-3">
              <Loader2 className="h-4 w-4 nb-spin mr-2" />
              Loading library…
            </div>
          ) : !items || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[13px] ink-3">
              <ImageOff className="h-6 w-6 mb-2" />
              No {ratio} images for {projectLabel} yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const isSelected = selected === item.output_url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.output_url)}
                    className={`text-left rounded-lg overflow-hidden border-2 transition ${
                      isSelected
                        ? "border-brand ring-brand"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="relative aspect-square bg-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.output_url ?? undefined}
                        alt={item.filename}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand text-brand-ink flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 px-1 text-[10.5px] mono ink-3 truncate">
                      {item.filename}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-line-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onPick(selected);
                close();
              }
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[13px] font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Use this image
          </button>
        </div>
      </div>
    </div>
  );
}
