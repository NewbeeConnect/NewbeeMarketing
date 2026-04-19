"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Folder,
  FolderOpen,
  ImageIcon,
  Loader2,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PROJECTS,
  IMAGE_RATIOS,
  VIDEO_RATIOS,
  type ProjectSlug,
  type ImageRatio,
  type VideoRatio,
} from "@/lib/projects";
import {
  useDeleteGeneration,
  useLibrary,
} from "@/hooks/useLibrary";
import type { GenerationRow } from "@/hooks/useGeneration";

type NodeKey =
  | { kind: "root" }
  | { kind: "project"; project: ProjectSlug }
  | { kind: "type"; project: ProjectSlug; type: "image" | "video" }
  | {
      kind: "ratio";
      project: ProjectSlug;
      type: "image" | "video";
      ratio: ImageRatio | VideoRatio;
    };

export default function LibraryPage() {
  const [selected, setSelected] = useState<NodeKey>({ kind: "root" });
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(PROJECTS.map((p) => `project:${p.slug}`))
  );
  const [preview, setPreview] = useState<GenerationRow | null>(null);

  // Filter passed to the server based on tree selection
  const filter = useMemo(() => {
    if (selected.kind === "root") return {};
    if (selected.kind === "project") return { project: selected.project };
    if (selected.kind === "type")
      return { project: selected.project, type: selected.type };
    return {
      project: selected.project,
      type: selected.type,
      ratio: selected.ratio,
    };
  }, [selected]);

  const { data: items = [], isLoading } = useLibrary(filter);
  const del = useDeleteGeneration();

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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

  const breadcrumb = useMemo(() => {
    const parts: string[] = ["Library"];
    if (selected.kind !== "root") {
      parts.push(PROJECTS.find((p) => p.slug === selected.project)!.name);
      if (selected.kind !== "project") {
        parts.push(selected.type === "image" ? "Image" : "Video");
        if (selected.kind === "ratio") parts.push(selected.ratio);
      }
    }
    return parts.join(" / ");
  }, [selected]);

  return (
    <div className="flex h-[calc(100vh-1px)] w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 p-3 overflow-y-auto shrink-0">
        <button
          type="button"
          onClick={() => setSelected({ kind: "root" })}
          className={`w-full text-left px-2 py-1.5 rounded text-sm font-medium ${
            selected.kind === "root" ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
          }`}
        >
          All assets
        </button>

        <div className="mt-2 space-y-0.5">
          {PROJECTS.map((project) => {
            const projectKey = `project:${project.slug}`;
            const projectExpanded = expanded.has(projectKey);
            const isProjectSelected =
              selected.kind === "project" && selected.project === project.slug;

            return (
              <div key={project.slug}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => toggle(projectKey)}
                    className="p-0.5 hover:bg-muted/50 rounded"
                    aria-label={projectExpanded ? "Collapse" : "Expand"}
                  >
                    {projectExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected({ kind: "project", project: project.slug })
                    }
                    className={`flex-1 text-left flex items-center gap-1.5 px-1.5 py-1 rounded text-sm ${
                      isProjectSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </button>
                </div>

                {projectExpanded && (
                  <div className="ml-5 space-y-0.5">
                    {(["image", "video"] as const).map((type) => {
                      const typeKey = `type:${project.slug}:${type}`;
                      const typeExpanded = expanded.has(typeKey);
                      const isTypeSelected =
                        selected.kind === "type" &&
                        selected.project === project.slug &&
                        selected.type === type;
                      const ratios = type === "image" ? IMAGE_RATIOS : VIDEO_RATIOS;

                      return (
                        <div key={type}>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => toggle(typeKey)}
                              className="p-0.5 hover:bg-muted/50 rounded"
                              aria-label={typeExpanded ? "Collapse" : "Expand"}
                            >
                              {typeExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSelected({
                                  kind: "type",
                                  project: project.slug,
                                  type,
                                })
                              }
                              className={`flex-1 text-left flex items-center gap-1.5 px-1.5 py-1 rounded text-xs ${
                                isTypeSelected
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              {typeExpanded ? (
                                <FolderOpen className="h-3.5 w-3.5" />
                              ) : (
                                <Folder className="h-3.5 w-3.5" />
                              )}
                              <span className="capitalize">{type}</span>
                            </button>
                          </div>

                          {typeExpanded && (
                            <div className="ml-5 space-y-0.5">
                              {ratios.map((ratio) => {
                                const isRatioSelected =
                                  selected.kind === "ratio" &&
                                  selected.project === project.slug &&
                                  selected.type === type &&
                                  selected.ratio === ratio;
                                return (
                                  <button
                                    key={ratio}
                                    type="button"
                                    onClick={() =>
                                      setSelected({
                                        kind: "ratio",
                                        project: project.slug,
                                        type,
                                        ratio,
                                      })
                                    }
                                    className={`w-full text-left pl-5 pr-2 py-1 rounded text-xs ${
                                      isRatioSelected
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted/50"
                                    }`}
                                  >
                                    {ratio}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b px-6 py-3 z-10">
          <p className="text-sm text-muted-foreground">{breadcrumb}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${items.length} item${items.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No assets here yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Head to the Generate page to create one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <AssetTile key={item.id} item={item} onOpen={() => setPreview(item)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Preview modal */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base truncate">
              {preview?.filename ?? "Asset"}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              {preview.type === "image" && preview.output_url ? (
                <div className="relative w-full max-h-[60vh] bg-muted/40 rounded overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.output_url}
                    alt={preview.prompt}
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </div>
              ) : preview.type === "video" && preview.output_url ? (
                <video
                  src={preview.output_url}
                  controls
                  className="w-full max-h-[60vh] bg-black rounded"
                />
              ) : preview.status === "failed" ? (
                <p className="text-sm text-destructive">
                  Failed: {preview.error_message ?? "unknown error"}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Still rendering…
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium text-foreground">Prompt:</span>{" "}
                  {preview.prompt}
                </div>
                <div>
                  {PROJECTS.find((p) => p.slug === preview.project_slug)?.name} /{" "}
                  {preview.type === "image" ? "Image" : "Video"} / {preview.ratio}
                </div>
                <div>
                  Status: {preview.status}
                  {preview.actual_cost_usd != null &&
                    ` · $${preview.actual_cost_usd.toFixed(3)}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {preview.output_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={preview.output_url} download={preview.filename}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(preview.id)}
                  disabled={del.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                <div className="flex-1" />
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Close
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const aspectClass =
    item.ratio === "1:1"
      ? "aspect-square"
      : item.ratio === "4:5"
      ? "aspect-[4/5]"
      : item.ratio === "16:9"
      ? "aspect-video"
      : "aspect-[9/16]";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left"
    >
      <Card className="p-2 hover:shadow-md transition-shadow">
        <div className={`relative ${aspectClass} rounded overflow-hidden bg-muted/40`}>
          {item.status === "completed" && item.output_url ? (
            item.type === "image" ? (
              <Image
                src={item.output_url}
                alt={item.prompt}
                fill
                sizes="200px"
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
            <div className="absolute inset-0 flex items-center justify-center text-xs text-destructive p-2 text-center">
              Failed
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 bg-background/80 rounded p-0.5">
            {item.type === "image" ? (
              <ImageIcon className="h-3 w-3" />
            ) : (
              <VideoIcon className="h-3 w-3" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 truncate">
          {item.prompt}
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          {item.ratio} · {new Date(item.created_at).toLocaleDateString()}
        </p>
      </Card>
    </button>
  );
}
