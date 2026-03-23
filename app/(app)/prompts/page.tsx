"use client";

import { useState } from "react";
import { usePromptTemplates, useCreatePromptTemplate } from "@/hooks/usePromptTemplates";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MessageSquare, Star, Hash, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function PromptsPage() {
  const { data: templates, isLoading } = usePromptTemplates();
  const create = useCreatePromptTemplate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [platform, setPlatform] = useState("");

  const handleCreate = async () => {
    if (!name || !templateText) { toast.error("Name and template text required"); return; }
    try {
      await create.mutateAsync({
        name,
        template_text: templateText,
        platform: platform || undefined,
      });
      toast.success("Template created");
      setShowCreate(false);
      setName(""); setTemplateText(""); setPlatform("");
    } catch { toast.error("Failed to create template"); }
  };

  return (
    <>
      <AppHeader title="Prompts" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Prompt Templates</h2>
            <p className="text-sm text-muted-foreground">
              Manage and track AI prompt templates with performance scoring
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Prompt Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Emotional Reel Hook" />
                </div>
                <div>
                  <Label>Platform (optional)</Label>
                  <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g., instagram, tiktok" />
                </div>
                <div>
                  <Label>Template Text</Label>
                  <Textarea
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    placeholder="Write your prompt template. Use {{variables}} for dynamic parts..."
                    rows={8}
                  />
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((t) => {
              const score = Math.round(t.performance_score * 100);
              const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-gray-500";
              return (
                <Card key={t.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">v{t.version}{t.platform ? ` · ${t.platform}` : ""}</p>
                      </div>
                      {score > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className={`h-3.5 w-3.5 ${scoreColor}`} />
                          <span className={`text-sm font-medium ${scoreColor}`}>{score}%</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/50 p-2 rounded">
                      {t.template_text.slice(0, 200)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" /> Used {t.use_count} times
                      {t.avg_engagement_rate > 0 && (
                        <><TrendingUp className="h-3 w-3 ml-2" /> {(t.avg_engagement_rate * 100).toFixed(2)}% avg engagement</>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No prompt templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create prompt templates to maintain consistent brand voice across all content
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
