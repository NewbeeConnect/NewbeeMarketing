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
import { COPY } from "@/lib/i18n/copy";

const ICONS: Record<Intent, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  pipeline: Repeat,
};

/**
 * İlk-ziyaret hero'su — üç büyük intent kartı. Hover'da sağ altta "Seç →"
 * etiketi belirir. Kart tıklanınca intent commit olur; ana component bunu
 * <IntentPill /> ile "mode switcher"a dönüştürür.
 */
export function IntentPicker({ onPick }: { onPick: (i: Intent) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(["image", "video", "pipeline"] as const).map((k) => {
        const Icon = ICONS[k];
        const meta = COPY.generate.intents[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            title={meta.whenToUse}
            className="group text-left rounded-xl border border-line bg-panel p-4 card-interactive"
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-brand-soft text-brand-ink transition-transform duration-200 group-hover:scale-105">
              <Icon className="h-[20px] w-[20px]" />
            </div>
            <div className="serif text-[22px] ink mt-3">{meta.title}</div>
            <div className="text-[14.5px] ink-2 mt-1 leading-relaxed">
              {meta.tagline}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="mono text-[13px] ink-3">{meta.time}</span>
              <span className="text-[13px] font-medium text-brand-ink inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                Seç <ArrowRight className="h-3 w-3" />
              </span>
            </div>
            <div className="text-[13px] ink-3 mt-2 leading-snug">
              {meta.whenToUse}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Intent seçildikten sonra hero'nun yerine geçen kompakt 3-yönlü switcher.
 * Aktif olmayan bir butona basmak "soft switch" (brief + şema korunur, çıktı
 * temizlenir). "Sıfırdan başla" tam reset — AlertDialog arkasında.
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
  const goal = COPY.generate.steps.goal;
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] ink-3">{goal.modeLabel}</span>
        <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
          {(["image", "video", "pipeline"] as const).map((k) => {
            const active = k === intent;
            const Icon = ICONS[k];
            const meta = COPY.generate.intents[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => !active && onSwitch(k)}
                aria-pressed={active}
                title={active ? `Aktif: ${meta.title}` : `${meta.title}'a geç — ${meta.whenToUse}`}
                className={`px-2.5 h-7 rounded-md text-[14px] whitespace-nowrap inline-flex items-center gap-1 chip-pressable ${
                  active
                    ? "bg-panel shadow-card ink font-medium"
                    : "ink-3 hover:ink hover:bg-[color-mix(in_oklch,var(--nb-brand-soft)_30%,transparent)]"
                }`}
              >
                <Icon className="h-3 w-3" />
                {COPY.generate.intentLabels[k]}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-1 text-[13.5px] ink-3 hover:ink transition"
          title="Her şeyi temizle ve hedef seçim ekranına dön"
        >
          {goal.changeButton}
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{goal.changeConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {goal.changeConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{goal.changeConfirmCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onChange();
              }}
            >
              {goal.changeConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
