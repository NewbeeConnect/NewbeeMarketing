"use client";

import { useState } from "react";
import { useGallery } from "@/hooks/useGallery";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Images,
  Search,
  Film,
  Image as ImageIcon,
  Mic,
  Download,
  X,
} from "lucide-react";
import Image from "next/image";
import { PLATFORMS, LANGUAGES } from "@/lib/constants";
import type { Generation } from "@/types/database";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "video", label: "Videos", icon: Film },
  { value: "image", label: "Images", icon: ImageIcon },
  { value: "voiceover", label: "Voiceovers", icon: Mic },
  { value: "stitched", label: "Stitched", icon: Film },
] as const;

export default function GalleryPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Generation | null>(null);

  const { data: items, isLoading } = useGallery({
    type:
      typeFilter !== "all"
        ? (typeFilter as "video" | "image" | "voiceover" | "stitched")
        : undefined,
    platform: platformFilter !== "all" ? platformFilter : undefined,
    language: languageFilter !== "all" ? languageFilter : undefined,
    search: search || undefined,
  });

  const activeFilters = [
    typeFilter !== "all" && typeFilter,
    platformFilter !== "all" && platformFilter,
    languageFilter !== "all" && languageFilter,
    search,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter("all");
    setPlatformFilter("all");
    setLanguageFilter("all");
    setSearch("");
  };

  return (
    <>
      <AppHeader title="Gallery" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">Content Library</h2>
          <p className="text-sm text-muted-foreground">
            Browse all generated videos and images across your projects
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              Clear ({activeFilters})
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Images className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">
                {activeFilters > 0 ? "No results" : "Gallery is empty"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {activeFilters > 0
                  ? "Try adjusting your filters to see more results"
                  : "Generated videos and images from your projects will appear here"}
              </p>
              {activeFilters > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={() => setSelectedItem(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {selectedItem.type === "video" || selectedItem.type === "stitched"
                    ? "Video"
                    : selectedItem.type === "image"
                      ? "Image"
                      : "Voiceover"}{" "}
                  Detail
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Preview */}
                {(selectedItem.type === "video" ||
                  selectedItem.type === "stitched") && (
                  <video
                    src={selectedItem.output_url ?? undefined}
                    controls
                    className="w-full rounded-lg bg-black"
                  />
                )}
                {selectedItem.type === "image" && (
                  <img
                    src={selectedItem.output_url ?? undefined}
                    alt="Generated"
                    className="w-full rounded-lg"
                  />
                )}
                {selectedItem.type === "voiceover" && (
                  <audio
                    src={selectedItem.output_url ?? undefined}
                    controls
                    className="w-full"
                  />
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedItem.type}</Badge>
                  {selectedItem.platform && (
                    <Badge variant="outline">{selectedItem.platform}</Badge>
                  )}
                  {selectedItem.language && (
                    <Badge variant="outline">{selectedItem.language}</Badge>
                  )}
                  {selectedItem.aspect_ratio && (
                    <Badge variant="outline">
                      {selectedItem.aspect_ratio}
                    </Badge>
                  )}
                  <Badge variant="outline">{selectedItem.model}</Badge>
                </div>

                {/* Prompt */}
                {selectedItem.prompt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Prompt
                    </p>
                    <p className="text-sm bg-muted/50 rounded p-3">
                      {selectedItem.prompt}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedItem.output_url && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={selectedItem.output_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GalleryCard({
  item,
  onClick,
}: {
  item: Generation;
  onClick: () => void;
}) {
  const typeIcon =
    item.type === "video" || item.type === "stitched" ? (
      <Film className="h-3.5 w-3.5" />
    ) : item.type === "image" ? (
      <ImageIcon className="h-3.5 w-3.5" />
    ) : (
      <Mic className="h-3.5 w-3.5" />
    );

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : item.type === "image" && item.output_url ? (
          <Image
            src={item.output_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {typeIcon}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className="text-[10px] gap-1" variant="secondary">
            {typeIcon}
            {item.type}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.prompt}
        </p>
        <div className="flex gap-1.5 mt-2">
          {item.platform && (
            <Badge variant="outline" className="text-[10px]">
              {item.platform}
            </Badge>
          )}
          {item.language && (
            <Badge variant="outline" className="text-[10px]">
              {item.language.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
