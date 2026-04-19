"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FastForward,
  Film,
  FolderOpen,
  Grid3x3,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Rows3,
  Search,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import { useDeleteGeneration, useLibrary } from "@/hooks/useLibrary";
import type { GenerationRow } from "@/hooks/useGeneration";

/**
 * Single-tenant Library.
 *
 * Tree:
 *   /library
 *   ├── Image            (view: grid, type=image)
 *   │   ├── Generated    — tab filter: model !== "user-upload"
 *   │   ├── Source       — tab filter: model === "user-upload"
 *   │   └── All          — no filter
 *   └── Video            (view: grid, type=video, same three tabs)
 *
 * The "source" vs "generated" split is derived from the existing
 * `model` column on mkt_generations — user-uploaded files are tagged
 * `"user-upload"` by /api/library/upload; anything else came from an AI
 * model. No schema change, no file movement — just a smarter grouping.
 */

type View =
  | { kind: "root" }
  | { kind: "grid"; type: "image" | "video" };

type SourceFilter = "all" | "generated" | "source";

export default function LibraryPage() {
  const [view, setView] = useState<View>({ kind: "root" });
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [preview, setPreview] = useState<GenerationRow | null>(null);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<GenerationRow | null>(
    null
  );

  const filter = useMemo(() => {
    if (view.kind === "root") return {};
    return { type: view.type };
  }, [view]);

  const { data: items = [], isLoading } = useLibrary(filter);
  const del = useDeleteGeneration();

  async function performDelete(id: string) {
    try {
      await del.mutateAsync(id);
      if (preview?.id === id) setPreview(null);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setPendingDelete(null);
    }
  }

  // Tally — always counts the current data set grouped by type + source.
  const stats = useMemo(() => {
    const t = {
      image: { source: 0, generated: 0 },
      video: { source: 0, generated: 0 },
    };
    for (const it of items) {
      const bucket = it.type === "image" ? t.image : t.video;
      if (isSource(it)) bucket.source++;
      else bucket.generated++;
    }
    return t;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (sourceFilter === "generated" && isSource(i)) return false;
      if (sourceFilter === "source" && !isSource(i)) return false;
      if (!q) return true;
      return (
        i.filename.toLowerCase().includes(q) ||
        (i.prompt ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, sourceFilter]);

  // ── Root: Image / Video cards ──────────────────────────────────────
  if (view.kind === "root") {
    const totals = {
      image: stats.image.source + stats.image.generated,
      video: stats.video.source + stats.video.generated,
    };
    return (
      <div className="max-w-[960px] mx-auto px-6 py-6">
        <div className="mb-5">
          <div className="serif text-[26px] ink">Library</div>
          <div className="text-[12.5px] ink-3 mt-0.5">
            Your uploaded sources and AI-generated outputs — grouped by type.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              { kind: "image" as const, label: "Images", Icon: ImageIcon },
              { kind: "video" as const, label: "Videos", Icon: VideoIcon },
            ] as const
          ).map((x) => {
            const s = stats[x.kind];
            return (
              <button
                key={x.kind}
                type="button"
                onClick={() => {
                  setView({ kind: "grid", type: x.kind });
                  setSourceFilter("all");
                }}
                className="text-left rounded-xl border border-line bg-panel hover:border-brand hover:ring-brand transition p-5"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-soft text-brand-ink">
                  <x.Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <div className="serif text-[20px] ink">{x.label}</div>
                    <div className="text-[12.5px] ink-3 mt-0.5">
                      {isLoading ? "Loading…" : `${totals[x.kind]} saved`}
                    </div>
                  </div>
                  <div className="text-right text-[11px] ink-3 leading-tight">
                    <div>
                      <span className="ink font-medium mono">{s.generated}</span>{" "}
                      generated
                    </div>
                    <div className="mt-0.5">
                      <span className="ink font-medium mono">{s.source}</span>{" "}
                      source
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Grid / list view ───────────────────────────────────────────────
  const typeLabel = view.type === "image" ? "Images" : "Videos";
  const bucket = stats[view.type];

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <Breadcrumb
        trail={[
          { label: "Library", onClick: () => setView({ kind: "root" }) },
          { label: typeLabel },
        ]}
      />

      <div className="flex items-end justify-between mt-4 mb-4 gap-3 flex-wrap">
        <div>
          <div className="serif text-[24px] ink">{typeLabel}</div>
          <div className="text-[12.5px] ink-3 mt-0.5">
            {isLoading ? "Loading…" : `${items.length} saved`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ink-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 pl-8 pr-3 rounded-md border border-line bg-panel text-[12.5px] ink outline-none focus:border-brand w-[200px]"
            />
          </div>
          <div className="inline-flex p-0.5 bg-soft rounded-lg border border-line-2">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={`px-2.5 h-7 rounded-md text-[12px] ${
                layout === "grid"
                  ? "bg-panel shadow-card ink"
                  : "ink-3 hover:ink"
              }`}
              aria-pressed={layout === "grid"}
            >
              <Grid3x3 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={`px-2.5 h-7 rounded-md text-[12px] ${
                layout === "list"
                  ? "bg-panel shadow-card ink"
                  : "ink-3 hover:ink"
              }`}
              aria-pressed={layout === "list"}
            >
              <Rows3 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Source / Generated / All tabs */}
      <div className="flex items-center gap-1 border-b border-line-2 mb-4">
        {(
          [
            { k: "all", label: "All", count: bucket.source + bucket.generated },
            { k: "generated", label: "Generated", count: bucket.generated },
            { k: "source", label: "Source", count: bucket.source },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setSourceFilter(t.k)}
            className={`px-3 h-8 text-[12.5px] relative inline-flex items-center gap-1.5 ${
              sourceFilter === t.k ? "ink font-medium" : "ink-3 hover:ink"
            }`}
          >
            {t.label}
            <span className="text-[10.5px] mono ink-3">{t.count}</span>
            {sourceFilter === t.k && (
              <div className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 ink-3">
          <Loader2 className="h-5 w-5 nb-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-10 w-10 ink-3 mb-3 opacity-60" />
          <div className="text-[13px] ink-2">
            {search
              ? "No matches."
              : sourceFilter === "source"
              ? `No ${view.type} sources uploaded yet.`
              : sourceFilter === "generated"
              ? `No ${view.type}s generated yet.`
              : "No assets here yet."}
          </div>
          <div className="text-[12px] ink-3 mt-0.5">
            {search ? (
              "Try a different query."
            ) : (
              <>
                Head to the{" "}
                <Link href="/generate" className="underline text-brand-ink">
                  Generate
                </Link>{" "}
                page to create one.
              </>
            )}
          </div>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredItems.map((it) => (
            <AssetTile key={it.id} item={it} onOpen={() => setPreview(it)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-panel overflow-hidden">
          <div className="text-[11px] ink-3 grid grid-cols-[60px_1fr_90px_80px_100px_40px] gap-2 px-3 py-2 border-b border-line-2 uppercase tracking-wide">
            <span />
            <span>Name</span>
            <span>Origin</span>
            <span>Ratio</span>
            <span>Date</span>
            <span />
          </div>
          {filteredItems.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setPreview(it)}
              className="w-full grid grid-cols-[60px_1fr_90px_80px_100px_40px] gap-2 items-center px-3 py-2 border-b border-line-2 last:border-b-0 hover:bg-soft text-left transition"
            >
              <div className="relative w-11 h-11 rounded overflow-hidden bg-soft">
                {it.status === "completed" && it.output_url ? (
                  it.type === "image" ? (
                    <Image
                      src={it.output_url}
                      alt={it.filename}
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black">
                      <VideoIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                  )
                ) : null}
              </div>
              <div className="mono text-[12px] ink truncate">{it.filename}</div>
              <div className="text-[11.5px] ink-2">
                <OriginChip item={it} />
              </div>
              <div className="text-[11.5px] ink-2">{it.ratio}</div>
              <div className="text-[11.5px] ink-3">
                {new Date(it.created_at).toLocaleDateString()}
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 ink-3" />
            </button>
          ))}
        </div>
      )}

      <AssetPreview
        item={preview}
        onClose={() => setPreview(null)}
        onRequestDelete={(item) => setPendingDelete(item)}
        deleting={del.isPending}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.filename
                ? `"${pendingDelete.filename}" will be removed from your library and Supabase storage. This can't be undone.`
                : "This asset will be removed from your library and Supabase storage. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) performDelete(pendingDelete.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Uploads go through /api/library/upload with model="user-upload"; every
 * other generation has the actual model id. That's how we distinguish a
 * source asset from an AI output without a schema change.
 */
function isSource(item: GenerationRow): boolean {
  return item.model === "user-upload";
}

function OriginChip({ item }: { item: GenerationRow }) {
  const source = isSource(item);
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 h-5 text-[10.5px] rounded-md border"
      style={
        source
          ? {
              background: "var(--nb-soft)",
              borderColor: "var(--nb-line-2)",
              color: "var(--nb-ink-2)",
            }
          : {
              background: "var(--nb-brand-soft)",
              borderColor: "transparent",
              color: "var(--nb-brand-ink)",
            }
      }
    >
      {source ? "Source" : "AI"}
    </span>
  );
}

function Breadcrumb({
  trail,
}: {
  trail: { label: string; onClick?: () => void }[];
}) {
  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      {trail.map((t, i) => {
        const isLast = i === trail.length - 1;
        return (
          <div key={i} className="flex items-center gap-2">
            {t.onClick && !isLast ? (
              <button
                type="button"
                onClick={t.onClick}
                className="ink-3 hover:ink transition"
              >
                {t.label}
              </button>
            ) : (
              <span className={isLast ? "ink font-medium" : "ink-3"}>
                {t.label}
              </span>
            )}
            {!isLast && <span className="ink-3">/</span>}
          </div>
        );
      })}
    </div>
  );
}

function AssetTile({
  item,
  onOpen,
}: {
  item: GenerationRow;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-lg border border-line bg-panel hover:border-brand overflow-hidden transition"
    >
      <div className="relative aspect-[4/5] bg-soft">
        {item.status === "completed" && item.output_url ? (
          item.type === "image" ? (
            <Image
              src={item.output_url}
              alt={item.filename}
              fill
              sizes="240px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <video
              src={item.output_url}
              className="h-full w-full object-cover"
              muted
            />
          )
        ) : item.status === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] ink-3 p-2 text-center">
            Failed
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center ink-3">
            <Loader2 className="h-4 w-4 nb-spin" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <OriginChip item={item} />
        </div>
      </div>
      <div className="p-2">
        <div className="mono text-[10.5px] ink truncate">{item.filename}</div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="text-[10.5px] ink-3">{item.ratio}</div>
          <div className="text-[10.5px] ink-3">
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </button>
  );
}

function AssetPreview({
  item,
  onClose,
  onRequestDelete,
  deleting,
}: {
  item: GenerationRow | null;
  onClose: () => void;
  onRequestDelete: (item: GenerationRow) => void;
  deleting: boolean;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.filename} preview`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30,20,10,.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-panel rounded-xl border border-line shadow-pop w-full max-w-[900px] max-h-[88vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 bg-soft flex items-center justify-center p-6 min-h-[200px]">
          {item.type === "image" && item.output_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.output_url}
              alt={item.filename}
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-card"
            />
          ) : item.type === "video" && item.output_url ? (
            <video
              src={item.output_url}
              controls
              className="max-h-[70vh] max-w-full bg-black rounded-lg"
            />
          ) : item.status === "failed" ? (
            <div className="text-[13px] ink-2">
              Failed: {item.error_message ?? "unknown error"}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] ink-3">
              <Loader2 className="h-4 w-4 nb-spin" />
              Still rendering…
            </div>
          )}
        </div>
        <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-line-2 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="mono text-[12px] ink break-all">{item.filename}</div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md inline-flex items-center justify-center ink-2 hover:bg-soft transition"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 space-y-2 text-[12px]">
            <Row k="Origin" v={isSource(item) ? "User upload" : "AI"} />
            <Row k="Ratio" v={item.ratio} />
            <Row
              k="Created"
              v={new Date(item.created_at).toLocaleDateString()}
            />
            <Row
              k="Model"
              v={
                isSource(item)
                  ? "—"
                  : item.type === "video"
                  ? "Veo 3.1"
                  : "Nano Banana 2"
              }
            />
            {item.actual_cost_usd != null && (
              <Row k="Cost" v={`$${item.actual_cost_usd.toFixed(3)}`} mono />
            )}
            <Row k="Status" v={item.status} />
          </div>
          <div className="mt-4 pt-3 border-t border-line-2">
            <div className="text-[11px] ink-3 mb-1">Prompt</div>
            <div className="text-[12px] ink-2 leading-relaxed line-clamp-6">
              {item.prompt}
            </div>
          </div>
          <div className="mt-auto pt-4 space-y-2">
            {item.output_url && (
              <a
                href={item.output_url}
                download={item.filename}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[13px] font-semibold hover:brightness-95 transition"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            )}
            {item.type === "image" && (
              <Link
                href="/generate"
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
              >
                <Film className="h-3 w-3" />
                Animate this image
              </Link>
            )}
            {item.type === "video" && (
              <Link
                href="/generate"
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[13px] hover:bg-soft transition"
              >
                <FastForward className="h-3 w-3" />
                Extend this video
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => onRequestDelete(item)}
              disabled={deleting}
              className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg ink-2 text-[13px] hover:bg-soft disabled:opacity-40 transition"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="ink-3">{k}</span>
      <span className={`ink ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}
