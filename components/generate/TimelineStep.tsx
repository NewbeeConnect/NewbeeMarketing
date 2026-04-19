"use client";

import { useEffect, useRef } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Wrapper for a single step in the /generate timeline. Renders one of three
 * layouts based on `visual`:
 *   - "pending"   — returns null (future step, not in DOM yet)
 *   - "active"    — full content, expanded, highlighted ring
 *   - "completed" — compact summary strip with [Edit] button
 *
 * The `onEdit` callback fires when the user clicks Edit on a completed step.
 * When `visual` becomes "active", the component smooth-scrolls itself into
 * view so the user never has to hunt for the next thing to do.
 */
export function TimelineStep({
  stepNumber,
  title,
  visual,
  summary,
  onEdit,
  children,
}: {
  stepNumber: number;
  title: string;
  visual: "pending" | "active" | "completed";
  /** Short text or element shown when the step is collapsed (completed). */
  summary?: React.ReactNode;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visual === "active" && ref.current) {
      // Delay one frame so DOM has settled after state change
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [visual]);

  if (visual === "pending") return null;

  if (visual === "completed") {
    return (
      <div
        ref={ref}
        className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white shrink-0">
          <Check className="h-3 w-3" />
        </div>
        <div className="text-xs font-medium text-muted-foreground shrink-0">
          Step {stepNumber}
        </div>
        <div className="text-sm flex-1 min-w-0 truncate text-foreground">
          {summary ?? title}
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 text-xs shrink-0"
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            Edit
          </Button>
        )}
      </div>
    );
  }

  // active
  return (
    <Card ref={ref} className="p-5 space-y-4 ring-2 ring-primary/30">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
          {stepNumber}
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div>{children}</div>
    </Card>
  );
}
