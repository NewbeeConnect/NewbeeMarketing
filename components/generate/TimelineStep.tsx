"use client";

import { useEffect, useRef } from "react";
import { Check, Pencil } from "lucide-react";

/**
 * Timeline step wrapper — rendered once per step on the /generate page.
 *
 * Visual states:
 *   - "pending"    → returns null (future step, not in DOM yet)
 *   - "completed"  → compact strip: green number badge + title + inline summary + Edit
 *   - "active"     → full card with ring-brand highlight, expanded content
 *
 * When a step flips to "active" we smooth-scroll the wrapper ~88px below the
 * top of the viewport — user doesn't have to hunt for the next action.
 */
export function TimelineStep({
  stepNumber,
  title,
  subtitle,
  visual,
  summary,
  onEdit,
  children,
}: {
  stepNumber: number;
  title: string;
  subtitle?: string;
  visual: "pending" | "active" | "completed";
  /** Shown inline next to the title when the step is collapsed. */
  summary?: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visual !== "active" || !ref.current) return;
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const target = window.scrollY + rect.top - 88;
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  }, [visual]);

  if (visual === "pending") return null;

  const active = visual === "active";

  return (
    <div
      ref={ref}
      data-step-active={active || undefined}
      className={`rounded-xl border transition slideFade ${
        active ? "bg-panel border-brand ring-brand" : "bg-panel border-line"
      }`}
    >
      <div
        className={`flex items-start gap-3 px-4 ${
          active ? "pt-4 pb-1" : "py-3"
        }`}
      >
        {/* Number / check badge */}
        <div
          className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
            active ? "bg-brand text-brand-ink" : "text-white"
          }`}
          style={
            !active
              ? { background: "oklch(0.55 0.12 150)" }
              : undefined
          }
        >
          {visual === "completed" ? (
            <Check className="h-3 w-3" />
          ) : (
            stepNumber
          )}
        </div>

        {/* Title + inline summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-[13.5px] font-semibold ink whitespace-nowrap">
              {title}
            </div>
            {!active && summary && (
              <div className="text-[12.5px] ink-3 truncate min-w-0">
                · {summary}
              </div>
            )}
          </div>
          {active && subtitle && (
            <div className="text-[12px] ink-3 mt-0.5">{subtitle}</div>
          )}
        </div>

        {visual === "completed" && onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] ink-2 hover:bg-soft hover:ink transition"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {active && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );
}
