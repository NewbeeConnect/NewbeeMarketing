"use client";

import { useState } from "react";
import { Check, Loader2, ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLibraryImages } from "@/hooks/useGeneration";
import type { ImageRatio, ProjectSlug } from "@/lib/projects";

/**
 * Image picker that lets the user reuse any previously-generated image from
 * their library instead of paying Gemini to re-generate. Filters by project
 * + ratio so the candidates match what the current intent needs.
 */
export function LibraryPickerDialog({
  open,
  onOpenChange,
  project,
  ratio,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectSlug;
  ratio: ImageRatio;
  onPick: (url: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: items, isLoading } = useLibraryImages({
    project,
    ratio,
    enabled: open,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelected(null);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick from library</DialogTitle>
          <DialogDescription>
            Any image you&rsquo;ve generated or uploaded for{" "}
            <span className="font-medium">{project}</span> at{" "}
            <span className="font-medium">{ratio}</span>. Using an existing
            image skips the Gemini call.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading library…
            </div>
          ) : !items || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground">
              <ImageOff className="h-6 w-6 mb-2" />
              No {ratio} images for {project} yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const isSelected = selected === item.output_url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.output_url)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 bg-muted/30 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.output_url ?? undefined}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-[10px] text-white truncate">
                        {item.filename}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onPick(selected);
                onOpenChange(false);
                setSelected(null);
              }
            }}
          >
            Use this image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
