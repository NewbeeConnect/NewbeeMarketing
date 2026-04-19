"use client";

import { useState } from "react";
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
import { ArrowRight, Image as ImageIcon, Repeat, Video } from "lucide-react";
import type { Intent } from "@/lib/generate/machine";
import { intentLabel } from "@/lib/generate/machine";
import { COPY } from "@/lib/generate/copy";

const META: Record<
  Intent,
  { Icon: React.ComponentType<{ className?: string }>; title: string; desc: string; time: string }
> = {
  image: {
    Icon: ImageIcon,
    title: COPY.intentCards.image.title,
    desc: COPY.intentCards.image.tagline,
    time: COPY.intentCards.image.time,
  },
  video: {
    Icon: Video,
    title: COPY.intentCards.video.title,
    desc: COPY.intentCards.video.tagline,
    time: COPY.intentCards.video.time,
  },
  pipeline: {
    Icon: Repeat,
    title: COPY.intentCards.pipeline.title,
    desc: COPY.intentCards.pipeline.tagline,
    time: COPY.intentCards.pipeline.time,
  },
};

/**
 * First-visit hero — three big intent cards. On hover, a "Choose →" label
 * fades in at the bottom-right of the card. Click commits the intent; the
 * parent then collapses this into <IntentPill /> which offers soft-switch.
 */
export function IntentPicker({ onPick }: { onPick: (i: Intent) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(["image", "video", "pipeline"] as const).map((k) => {
        const { Icon, title, desc, time } = META[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className="group text-left rounded-xl border border-line bg-panel hover:border-brand hover:ring-brand transition p-4"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-soft text-brand-ink">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="serif text-[18px] ink mt-3">{title}</div>
            <div className="text-[12.5px] ink-2 mt-1 leading-relaxed">
              {desc}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="mono text-[11px] ink-3">{time}</span>
              <span className="text-[11px] font-medium text-brand-ink inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                Choose <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Once an intent is chosen this replaces the hero. Three pill-buttons inline;
 * clicking a non-active one is a soft switch (brief/blueprint preserved,
 * downstream outputs cleared). "Start over" behind a confirm dialog.
 */
export function IntentPill({
  intent,
  onSwitch,
  onChange,
}: {
  intent: Intent;
  onSwitch: (next: Intent) => void;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] ink-3">Mode</span>
        <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
          {(["image", "video", "pipeline"] as const).map((k) => {
            const active = k === intent;
            const { Icon } = META[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => !active && onSwitch(k)}
                aria-pressed={active}
                className={`px-2.5 h-7 rounded-md text-[12px] whitespace-nowrap inline-flex items-center gap-1 transition ${
                  active
                    ? "bg-panel shadow-card ink font-medium"
                    : "ink-3 hover:ink"
                }`}
              >
                <Icon className="h-3 w-3" />
                {intentLabel(k)}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-1 text-[11.5px] ink-3 hover:ink transition"
        >
          {COPY.change.pillButton}
        </button>
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
