"use client";

import { useRef } from "react";
import { Lock, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Must match the backend cap (~5.5 MB base64 ≈ ~4 MB raw) with margin.
const MAX_ASSET_BYTES = 4 * 1024 * 1024;

export type AssetKind = "app_ui" | "logo" | "product_photo" | "other";

export type LockedAsset = {
  file: File;
  preview: string;
  kind: AssetKind;
};

const KIND_LABELS: Record<AssetKind, string> = {
  app_ui: "App UI / screenshot",
  logo: "Brand logo",
  product_photo: "Product photo",
  other: "Other reference",
};

const KIND_HINTS: Record<AssetKind, string> = {
  app_ui:
    "The model is instructed to reproduce the UI pixel-faithfully — no hallucinated buttons or text.",
  logo:
    "The logo is preserved at correct proportions and colors.",
  product_photo:
    "The product is preserved with its actual shape, colors, and materials.",
  other:
    "Used as a visual reference — subject, style, or detail the model should match.",
};

/**
 * Strict "assets to preserve" picker. Unlike generic reference images, these
 * come with a semantic label so backend prompt-injection can tell the model
 * *how* to treat each one — e.g. an "app_ui" asset triggers instructions to
 * reproduce the UI without modification.
 *
 * Up to 3 assets. Max 5 MB each (matches backend zod cap at ~5.5 MB base64).
 */
export function AssetLockEditor({
  assets,
  onAdd,
  onRemove,
  onKindChange,
  heading = "Assets to preserve exactly",
  sub = "Screenshots, logos, or product photos you want reproduced faithfully — no AI hallucination.",
}: {
  assets: LockedAsset[];
  onAdd: (file: File, kind: AssetKind) => Promise<void> | void;
  onRemove: (index: number) => void;
  onKindChange: (index: number, kind: AssetKind) => void;
  heading?: string;
  sub?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        <Label className="text-sm">{heading}</Label>
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>

      <div className="flex flex-wrap items-start gap-3">
        {assets.map((a, i) => (
          <div key={i} className="flex flex-col gap-1.5 w-28">
            <div className="relative h-28 w-28 rounded-md overflow-hidden border bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.preview}
                alt={`asset ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
                aria-label="Remove asset"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Select
              value={a.kind}
              onValueChange={(v) => onKindChange(i, v as AssetKind)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABELS) as AssetKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p
              className="text-[10px] text-muted-foreground leading-tight"
              title={KIND_HINTS[a.kind]}
            >
              {KIND_HINTS[a.kind]}
            </p>
          </div>
        ))}

        {assets.length < 3 && (
          <>
            <Input
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
                  // Default kind is app_ui since that's the biggest pain point
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
              className="h-28 w-28 rounded-md border border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-muted/40"
            >
              <Upload className="h-4 w-4 mb-1" />
              Add
            </button>
          </>
        )}
      </div>
    </div>
  );
}
