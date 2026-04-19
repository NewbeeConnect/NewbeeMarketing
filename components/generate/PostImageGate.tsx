"use client";

import { ArrowRight, Check, Film } from "lucide-react";
import { PreviewImage } from "./PreviewImage";
import type { AnyRatio } from "@/lib/projects";
import { COPY } from "@/lib/i18n/copy";

/**
 * Pipeline-only ara adımı. Görsel üretildikten sonra kullanıcıya soruyoruz:
 * "canlandırılsın mı, yoksa sadece görsel mi kalsın?"
 */
export function PostImageGate({
  imageUrl,
  ratio,
  onContinue,
  onStop,
}: {
  imageUrl: string;
  ratio: AnyRatio;
  onContinue: () => void;
  onStop: () => void;
}) {
  const s = COPY.generate.steps.postImage;
  return (
    <div className="space-y-3">
      <PreviewImage src={imageUrl} ratio={ratio} alt="Step 2 görseli" />
      <div className="text-center text-[14.5px] ink-2">{s.question}</div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onStop}
          title="Videoya geçme, sadece görseli kaydet"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[15px] hover:bg-soft transition"
        >
          <Check className="h-3 w-3" />
          {s.stopAtImage}
        </button>
        <button
          type="button"
          onClick={onContinue}
          title="Bu görseli ilk kare yapıp Veo 3.1 ile 4-8 saniyelik klibe dönüştür"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[15px] font-semibold hover:brightness-95 transition"
        >
          <Film className="h-3 w-3" />
          {s.continueAnimate}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
