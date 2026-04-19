"use client";

import { useRef } from "react";
import { Lock, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { COPY } from "@/lib/i18n/copy";

export type AssetKind = "app_ui" | "logo" | "product_photo" | "other";

export type LockedAsset = {
  file: File;
  preview: string;
  kind: AssetKind;
};

const MAX_ASSET_BYTES = 4 * 1024 * 1024;

/**
 * "Sabit tutulacak görseller" paneli — AI'nın halüsinasyon yapmadan birebir
 * koruması gereken 3'e kadar görsel (uygulama ekranı, logo, ürün fotoğrafı,
 * diğer). Her slot: thumbnail + kind dropdown + hint. Boş slot = tek bir
 * dashed drop zone.
 */
export function AssetLockEditor({
  assets,
  onAdd,
  onRemove,
  onKindChange,
}: {
  assets: LockedAsset[];
  onAdd: (file: File, kind: AssetKind) => Promise<void> | void;
  onRemove: (index: number) => void;
  onKindChange: (index: number, kind: AssetKind) => void;
}) {
  const al = COPY.generate.assetLock;
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-line-2 bg-soft p-3">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Lock className="h-3.5 w-3.5 ink-2" />
        <div
          className="text-[14.5px] font-medium ink"
          title={COPY.concepts.assetLock.long}
        >
          {al.title}
        </div>
        <span className="text-[13px] ink-3">{al.meta(assets.length)}</span>
      </div>
      <p className="text-[13px] ink-3 mb-2 leading-relaxed">
        {COPY.concepts.assetLock.short}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {assets.map((a, i) => (
          <div
            key={i}
            className="rounded-lg bg-panel border border-line p-2"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.preview}
                alt={`Sabit görsel ${i + 1}`}
                className="w-full h-[112px] object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 border border-line-2 shadow-card flex items-center justify-center ink-2 hover:ink transition"
                aria-label={al.removeLabel}
                title={al.removeLabel}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <select
              value={a.kind}
              onChange={(e) => onKindChange(i, e.target.value as AssetKind)}
              title={al.kindHints[a.kind]}
              className="w-full h-8 mt-2 px-2 rounded-md border border-line bg-panel text-[14px] ink outline-none focus:border-brand appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
                backgroundPosition: "right 8px center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {(Object.keys(al.kindLabels) as AssetKind[]).map((k) => (
                <option key={k} value={k}>
                  {al.kindLabels[k]}
                </option>
              ))}
            </select>
            <div className="text-[12px] ink-3 mt-1 leading-tight">
              {al.kindHints[a.kind]}
            </div>
          </div>
        ))}

        {assets.length < 3 && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                let added = assets.length;
                let rejectedOversize = 0;
                for (const f of files) {
                  if (added >= 3) break;
                  if (!f.type.startsWith("image/")) continue;
                  if (f.size > MAX_ASSET_BYTES) {
                    rejectedOversize++;
                    continue;
                  }
                  await onAdd(f, "app_ui");
                  added++;
                }
                if (rejectedOversize > 0) {
                  toast.error(
                    rejectedOversize === 1
                      ? al.tooBig
                      : al.tooBigMany(rejectedOversize)
                  );
                }
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              title="PNG veya JPG seç; max 4 MB"
              className="rounded-lg border border-dashed border-line hover:border-brand hover:bg-brand-soft transition h-[180px] flex flex-col items-center justify-center gap-1.5 ink-3 hover:text-brand-ink"
            >
              <Upload className="h-[18px] w-[18px]" />
              <span className="text-[14px] font-medium">{al.dropTitle}</span>
              <span className="text-[12px]">{al.dropSub}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
