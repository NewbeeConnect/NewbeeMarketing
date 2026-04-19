"use client";

import { useMemo, useState } from "react";
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
  PROJECTS,
  type ProjectSlug,
} from "@/lib/projects";
import { useDeleteGeneration, useLibrary } from "@/hooks/useLibrary";
import type { GenerationRow } from "@/hooks/useGeneration";

type View =
  | { kind: "root" }
  | { kind: "project"; project: ProjectSlug }
  | { kind: "grid"; project: ProjectSlug; type: "image" | "video" };

export default function LibraryPage() {
  const [view, setView] = useState<View>({ kind: "root" });
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<GenerationRow | null>(null);
  const [search, setSearch] = useState("");

  const filter = useMemo(() => {
    if (view.kind === "root") return {};
    if (view.kind === "project") return { project: view.project };
    return { project: view.project, type: view.type };
  }, [view]);

  const { data: items = [], isLoading } = useLibrary(filter);
  const del = useDeleteGeneration();

  const rootStats = useMemo(() => {
    const m = new Map<ProjectSlug, { images: number; videos: number }>();
    for (const p of PROJECTS) m.set(p.slug, { images: 0, videos: 0 });
    return m;
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset permanently?")) return;
    try {
      await del.mutateAsync(id);
      if (preview?.id === id) setPreview(null);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.filename.toLowerCase().includes(q) ||
        (i.prompt ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Root: project cards ─────────────────────────────────────────────
  if (view.kind === "root") {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-6">
        <div className="mb-5">
          <div className="serif text-[26px] ink">Library</div>
          <div className="text-[12.5px] ink-3 mt-0.5">
            Every generation, organized by project.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map((p) => {
            const s = rootStats.get(p.slug) ?? { images: 0, videos: 0 };
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setView({ kind: "project", project: p.slug })}
                className="text-left rounded-xl border border-line bg-panel hover:border-brand hover:ring-brand transition overflow-hidden"
              >
                <div
                  className="bg-soft"
                  style={{ aspectRatio: "16/7", background: `linear-gradient(135deg, ${p.color}30, ${p.color}10)` }}
                />
                <div className="p-4 flex items-start justify-between">
                  <div>
                    <div className="serif text-[18px] ink">{p.name}</div>
                    <div className="text-[12px] ink-3 mt-0.5">
                      {p.slug === "newbee"
                        ? "Dating · chat app"
                        : "Jewelry e-commerce"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12.5px] ink font-medium">
                      {s.images + s.videos}
                    </div>
                    <div className="text-[11px] ink-3">
                      {s.images} img · {s.videos} vid
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

  const projectMeta = PROJECTS.find((p) => p.slug === view.project)!;

  // ── Project landing: Image / Video cards ───────────────────────────
  if (view.kind === "project") {
    const imgCount = items.filter((i) => i.type === "image").length;
    const vidCount = items.filter((i) => i.type === "video").length;
    return (
      <div className="max-w-[960px] mx-auto px-6 py-6">
        <Breadcrumb
          trail={[
            { label: "Library", onClick: () => setView({ kind: "root" }) },
            { label: projectMeta.name },
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {(
            [
              { kind: "image" as const, label: "Images", Icon: ImageIcon, count: imgCount },
              { kind: "video" as const, label: "Videos", Icon: VideoIcon, count: vidCount },
            ] as const
          ).map((x) => (
            <button
              key={x.kind}
              type="button"
              onClick={() =>
                setView({ kind: "grid", project: view.project, type: x.kind })
              }
              className="text-left rounded-xl border border-line bg-panel hover:border-brand hover:ring-brand transition p-5"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-soft text-brand-ink">
                <x.Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="serif text-[20px] ink mt-3">{x.label}</div>
              <div className="text-[12.5px] ink-3 mt-0.5">
                {x.count} saved
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Grid / list view ────────────────────────────────────────────────
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <Breadcrumb
        trail={[
          { label: "Library", onClick: () => setView({ kind: "root" }) },
          {
            label: projectMeta.name,
            onClick: () => setView({ kind: "project", project: view.project }),
          },
          { label: view.type === "image" ? "Images" : "Videos" },
        ]}
      />

      <div className="flex items-end justify-between mt-4 mb-4 gap-3 flex-wrap">
        <div>
          <div className="serif text-[24px] ink">
            {projectMeta.name} · {view.type === "image" ? "Images" : "Videos"}
          </div>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20 ink-3">
          <Loader2 className="h-5 w-5 nb-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-10 w-10 ink-3 mb-3 opacity-60" />
          <div className="text-[13px] ink-2">
            {search ? "No matches." : "No assets here yet."}
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
            <AssetTile
              key={it.id}
              item={it}
              onOpen={() => setPreview(it)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-panel overflow-hidden">
          <div className="text-[11px] ink-3 grid grid-cols-[60px_1fr_80px_100px_40px] gap-2 px-3 py-2 border-b border-line-2 uppercase tracking-wide">
            <span />
            <span>Name</span>
            <span>Ratio</span>
            <span>Date</span>
            <span />
          </div>
          {filteredItems.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setPreview(it)}
              className="w-full grid grid-cols-[60px_1fr_80px_100px_40px] gap-2 items-center px-3 py-2 border-b border-line-2 last:border-b-0 hover:bg-soft text-left transition"
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
              <div className="mono text-[12px] ink truncate">
                {it.filename}
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
        onDelete={handleDelete}
        deleting={del.isPending}
      />
    </div>
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
        <div className="absolute top-1.5 left-1.5 bg-panel/90 rounded p-0.5 border border-line">
          {item.type === "image" ? (
            <ImageIcon className="h-2.5 w-2.5 ink-2" />
          ) : (
            <VideoIcon className="h-2.5 w-2.5 ink-2" />
          )}
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
  onDelete,
  deleting,
}: {
  item: GenerationRow | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  if (!item) return null;

  return (
    <div
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
            <div className="mono text-[12px] ink break-all">
              {item.filename}
            </div>
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
            <Row k="Ratio" v={item.ratio} />
            <Row
              k="Created"
              v={new Date(item.created_at).toLocaleDateString()}
            />
            <Row
              k="Model"
              v={item.type === "video" ? "Veo 3.1" : "Nano Banana 2"}
            />
            {item.actual_cost_usd != null && (
              <Row
                k="Cost"
                v={`$${item.actual_cost_usd.toFixed(3)}`}
                mono
              />
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
              onClick={() => onDelete(item.id)}
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
