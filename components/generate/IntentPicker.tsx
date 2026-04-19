"use client";

import { useState } from "react";
import { ArrowRight, ImageIcon, Repeat, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Intent } from "@/lib/generate/machine";
import { intentLabel } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

const INTENT_META: Record<
  Intent,
  { icon: React.ReactNode; title: string; tagline: string; time: string }
> = {
  image: {
    icon: <ImageIcon className="h-5 w-5" />,
    title: COPY.intentCards.image.title,
    tagline: COPY.intentCards.image.tagline,
    time: COPY.intentCards.image.time,
  },
  video: {
    icon: <Video className="h-5 w-5" />,
    title: COPY.intentCards.video.title,
    tagline: COPY.intentCards.video.tagline,
    time: COPY.intentCards.video.time,
  },
  pipeline: {
    icon: <Repeat className="h-5 w-5" />,
    title: COPY.intentCards.pipeline.title,
    tagline: COPY.intentCards.pipeline.tagline,
    time: COPY.intentCards.pipeline.time,
  },
};

/**
 * On first visit (intent === null) this is a full-width hero of 3 big cards.
 * After the user commits, the parent swaps in <IntentPill /> which shows the
 * chosen intent + "Change" button.
 */
export function IntentPicker({
  onPick,
}: {
  onPick: (intent: Intent) => void;
}) {
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{COPY.intentPicker.heading}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {COPY.intentPicker.sub}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["image", "video", "pipeline"] as const).map((intent) => {
          const meta = INTENT_META[intent];
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onPick(intent)}
              className="group flex flex-col items-start gap-2 rounded-md border-2 border-border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {meta.icon}
                  {meta.title}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {meta.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{meta.tagline}</p>
              <span className="text-xs text-primary flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Start <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Compact pill once the user has an intent. Shows a row of 3 small intent
 * buttons — clicking a *different* one is a "soft switch": brief + blueprints
 * kept, only downstream outputs cleared (no confirm dialog, lossless). The
 * "Start over" button hard-resets everything (with confirm).
 */
export function IntentPill({
  intent,
  onSwitch,
  onChange,
}: {
  intent: Intent;
  /** Soft switch — preserves brief + blueprints, clears outputs. */
  onSwitch: (next: Intent) => void;
  /** Hard reset — clears everything including brief. */
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 rounded-full border p-0.5 bg-muted/40">
          {(["image", "video", "pipeline"] as const).map((i) => {
            const meta = INTENT_META[i];
            const isActive = i === intent;
            return (
              <button
                key={i}
                type="button"
                onClick={() => !isActive && onSwitch(i)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={isActive}
              >
                <span className={isActive ? "text-primary" : ""}>
                  {meta.icon}
                </span>
                <span>{intentLabel(i)}</span>
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => setOpen(true)}
        >
          {COPY.change.pillButton}
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{COPY.change.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {COPY.change.confirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.change.confirmCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onChange();
              }}
            >
              {COPY.change.confirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
