"use client";

import { useRef } from "react";
import { Lock, Upload, X } from "lucide-react";
import { toast } from "sonner";

export type AssetKind = "app_ui" | "logo" | "product_photo" | "other";

export type LockedAsset = {
  file: File;
  preview: string;
  kind: AssetKind;
};

const MAX_ASSET_BYTES = 4 * 1024 * 1024;

const KIND_LABEL: Record<AssetKind, string> = {
  app_ui: "App UI",
  logo: "Logo",
  product_photo: "Product photo",
  other: "Other",
};

const KIND_HINT: Record<AssetKind, string> = {
  app_ui: "Recreate this screen pixel-faithfully",
  logo: "Place this mark exactly as shown",
  product_photo: "Preserve product details and finish",
  other: "Use as visual reference",
};

/**
 * "Lock assets" panel — up to 3 images the model must reproduce without
 * invention. Each slot shows a thumbnail, a kind dropdown, and a hint line
 * describing how the backend will instruct the model for that kind.
 * Empty slots become a single dashed "drop or click" tile.
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
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-line-2 bg-soft p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-3.5 w-3.5 ink-2" />
        <div className="text-[12.5px] font-medium ink">Lock assets</div>
        <span className="text-[11px] ink-3">
          · pixel-faithful · {assets.length}/3 · max 4 MB each
        </span>
      </div>

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
                alt={`Locked asset ${i + 1}`}
                className="w-full h-[112px] object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 border border-line-2 shadow-card flex items-center justify-center ink-2 hover:ink transition"
                aria-label="Remove asset"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <select
              value={a.kind}
              onChange={(e) => onKindChange(i, e.target.value as AssetKind)}
              className="w-full h-8 mt-2 px-2 rounded-md border border-line bg-panel text-[12px] ink outline-none focus:border-brand appearance-none bg-no-repeat"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
                backgroundPosition: "right 8px center",
              }}
            >
              {(Object.keys(KIND_LABEL) as AssetKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <div className="text-[10.5px] ink-3 mt-1 leading-tight">
              {KIND_HINT[a.kind]}
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
                  // Default kind is app_ui — that's the most common use case.
                  await onAdd(f, "app_ui");
                  added++;
                }
                if (rejectedOversize > 0) {
                  toast.error(
                    rejectedOversize === 1
                      ? "Asset too large — max 4 MB per image."
                      : `${rejectedOversize} images skipped — max 4 MB each.`
                  );
                }
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-lg border border-dashed border-line hover:border-brand hover:bg-brand-soft transition h-[180px] flex flex-col items-center justify-center gap-1.5 ink-3 hover:text-brand-ink"
            >
              <Upload className="h-[18px] w-[18px]" />
              <span className="text-[12px] font-medium">
                Drop file or click
              </span>
              <span className="text-[10.5px]">PNG, JPG · max 4 MB</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
