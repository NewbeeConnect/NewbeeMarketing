"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useCreateProjectFromTemplate,
} from "@/hooks/useTemplates";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  FileStack,
  Plus,
  Trash2,
  Rocket,
  Copy,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_CATEGORIES, PLATFORMS, STYLES, TONES } from "@/lib/constants";
import type { TemplateFormData } from "@/lib/validations";
import type { Template, TemplateCategory } from "@/types/database";

export default function TemplatesPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = useTemplates(
    categoryFilter !== "all" ? (categoryFilter as TemplateCategory) : undefined
  );
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createFromTemplate = useCreateProjectFromTemplate();

  const filtered = templates?.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
    setDeleteId(null);
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      await createFromTemplate.mutateAsync(template.id);
      toast.success("Creating project from template...");
      const params = new URLSearchParams();
      if (template.platform) params.set("platform", template.platform);
      if (template.style) params.set("style", template.style);
      if (template.tone) params.set("tone", template.tone);
      params.set("template", template.id);
      router.push(`/projects/new?${params.toString()}`);
    } catch {
      toast.error("Failed to use template");
    }
  };

  return (
    <>
      <AppHeader title="Templates" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Template Library</h2>
            <p className="text-sm text-muted-foreground">
              Save and reuse successful project configurations
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={
                  categoryFilter === cat.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onDelete={() => setDeleteId(template.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">
                {search || categoryFilter !== "all"
                  ? "No matching templates"
                  : "No templates yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create templates from successful projects or build new ones from scratch"}
              </p>
              {!search && categoryFilter === "all" && (
                <Button
                  className="mt-4"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          try {
            await createTemplate.mutateAsync(data);
            toast.success("Template created!");
            setShowCreate(false);
          } catch {
            toast.error("Failed to create template");
          }
        }}
        isPending={createTemplate.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TemplateCard({
  template,
  onUse,
  onDelete,
}: {
  template: Template;
  onUse: () => void;
  onDelete: () => void;
}) {
  const categoryLabel = TEMPLATE_CATEGORIES.find(
    (c) => c.value === template.category
  )?.label;
  const platformLabel = PLATFORMS.find(
    (p) => p.value === template.platform
  )?.label;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{template.title}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {categoryLabel && (
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
          )}
          {platformLabel && (
            <Badge variant="outline" className="text-xs">
              {platformLabel}
            </Badge>
          )}
          {template.style && (
            <Badge variant="outline" className="text-xs">
              {template.style}
            </Badge>
          )}
          {template.tone && (
            <Badge variant="outline" className="text-xs">
              {template.tone}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Copy className="h-3 w-3" />
            Used {template.use_count} time{template.use_count !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onUse}>
            <Rocket className="h-3.5 w-3.5 mr-1" />
            Use Template
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTemplateDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("general");
  const [platform, setPlatform] = useState("");
  const [style, setStyle] = useState("");
  const [tone, setTone] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      platform: platform || undefined,
      style: style || undefined,
      tone: tone || undefined,
    });
    setTitle("");
    setDescription("");
    setCategory("general");
    setPlatform("");
    setStyle("");
    setTone("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. App Feature Showcase"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform || undefined} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style || undefined} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone || undefined} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
          >
            {isPending ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
