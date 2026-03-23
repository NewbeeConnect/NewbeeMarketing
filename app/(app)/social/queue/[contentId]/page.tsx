"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApproveContent, useRejectContent } from "@/hooks/useContentQueue";
import { formatStatus } from "@/lib/format";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, RotateCcw, ArrowLeft, Clock, Share2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { ContentQueueItem } from "@/types/database";
import { PLATFORM_ICONS } from "@/lib/social/platform-icons";
import { CONTENT_STATUS_COLORS } from "@/lib/social/status-colors";

export default function ContentDetailPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = use(params);
  const { data: item, isLoading } = useQuery<ContentQueueItem>({
    queryKey: ["content-queue-item", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/social/queue/${contentId}`);
      if (!res.ok) throw new Error("Failed to fetch content item");
      const data = await res.json();
      return data.item;
    },
  });
  const approve = useApproveContent();
  const reject = useRejectContent();
  const [revisionNotes, setRevisionNotes] = useState("");

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ contentId });
      toast.success("Content approved — publishing started");
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async () => {
    try {
      await reject.mutateAsync({ contentId, decision: "rejected" });
      toast.success("Content rejected");
    } catch { toast.error("Failed to reject"); }
  };

  const handleRevision = async () => {
    if (!revisionNotes.trim()) { toast.error("Please provide revision notes"); return; }
    try {
      await reject.mutateAsync({ contentId, decision: "revision", notes: revisionNotes });
      toast.success("Revision requested — AI will regenerate");
      setRevisionNotes("");
    } catch { toast.error("Failed to request revision"); }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Content Detail" />
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-8 w-48" /><Skeleton className="h-64" />
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <AppHeader title="Content Detail" />
        <div className="flex-1 p-4 lg:p-6">
          <Card><CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Content not found</p>
            <Button asChild variant="outline" className="mt-4"><Link href="/social/queue">Back to Queue</Link></Button>
          </CardContent></Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Content Detail" />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/social/queue"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h2 className="text-lg font-semibold">Content Review</h2>
          <Badge className={CONTENT_STATUS_COLORS[item.status as keyof typeof CONTENT_STATUS_COLORS] ?? ""}>{formatStatus(item.status)}</Badge>
        </div>

        {/* Content Preview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{item.text_content}</p>
            </div>

            {(item.hashtags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(item.hashtags as string[]).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </div>
              {item.source !== "manual" && <Badge variant="outline" className="text-xs capitalize">{item.source}</Badge>}
              {item.media_type && <Badge variant="outline" className="text-xs">{item.media_type}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Target Platforms */}
        <Card>
          <CardHeader><CardTitle className="text-base">Target Platforms</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(item.target_platforms as string[]).map((p) => {
                const Icon = PLATFORM_ICONS[p] ?? Share2;
                return (
                  <div key={p} className="flex items-center gap-1.5 text-sm">
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{p}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions (only for pending_review) */}
        {item.status === "pending_review" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={approve.isPending} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Request Revision</p>
                <Textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Describe what should change (AI will regenerate)..."
                  rows={3}
                />
                <Button variant="outline" onClick={handleRevision} disabled={reject.isPending} className="mt-2">
                  <RotateCcw className="h-4 w-4 mr-2" /> Request Revision
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Notes */}
        {item.rejection_notes && (
          <Card className="border-orange-500/30">
            <CardContent className="py-3">
              <p className="text-sm font-medium text-orange-600">Revision Notes:</p>
              <p className="text-sm text-muted-foreground">{item.rejection_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
