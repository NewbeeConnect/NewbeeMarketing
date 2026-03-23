"use client";

import { useState } from "react";
import { useContentQueue, useApproveContent, useRejectContent, useBatchApprove } from "@/hooks/useContentQueue";
import { formatStatus } from "@/lib/format";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, XCircle, RotateCcw, Clock, Send, Eye, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { ContentQueueStatus } from "@/types/database";
import { PLATFORM_ICONS } from "@/lib/social/platform-icons";
import { CONTENT_STATUS_COLORS } from "@/lib/social/status-colors";

const STATUS_TABS: { value: ContentQueueStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
];

export default function ContentQueuePage() {
  const [statusFilter, setStatusFilter] = useState<ContentQueueStatus | "all">("all");
  const { data: items, isLoading } = useContentQueue(statusFilter === "all" ? undefined : statusFilter);
  const approve = useApproveContent();
  const reject = useRejectContent();
  const batchApprove = useBatchApprove();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    try {
      await batchApprove.mutateAsync({ contentIds: [...selected] });
      toast.success(`Approved ${selected.size} items`);
      setSelected(new Set());
    } catch { toast.error("Batch approve failed"); }
  };

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ contentId: id });
      toast.success("Content approved");
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (id: string) => {
    try {
      await reject.mutateAsync({ contentId: id, decision: "rejected" });
      toast.success("Content rejected");
    } catch { toast.error("Failed to reject"); }
  };

  return (
    <>
      <AppHeader title="Content Queue" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Content Queue</h2>
            <p className="text-sm text-muted-foreground">
              Review, approve, and publish AI-generated content
            </p>
          </div>
          {selected.size > 0 && (
            <Button onClick={handleBatchApprove} disabled={batchApprove.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve {selected.size} Selected
            </Button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(tab.value); setSelected(new Set()); }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Queue Items */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex gap-4 py-4">
                  {item.status === "pending_review" && (
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="mt-1"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm line-clamp-2">{item.text_content}</p>
                      <Badge className={CONTENT_STATUS_COLORS[item.status as keyof typeof CONTENT_STATUS_COLORS] ?? ""}>{formatStatus(item.status)}</Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(item.target_platforms as string[]).map((p) => {
                        const Icon = PLATFORM_ICONS[p] ?? Share2;
                        return <Icon key={p} className="h-3.5 w-3.5 text-muted-foreground" />;
                      })}
                      {item.media_type && (
                        <Badge variant="outline" className="text-xs">{item.media_type}</Badge>
                      )}
                      {item.source !== "manual" && (
                        <Badge variant="secondary" className="text-xs capitalize">{item.source}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {(item.hashtags as string[]).length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(item.hashtags as string[]).slice(0, 5).join(" ")}
                      </p>
                    )}
                  </div>

                  {item.status === "pending_review" && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="default" onClick={() => handleApprove(item.id)} disabled={approve.isPending}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(item.id)} disabled={reject.isPending}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No content in queue</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Content will appear here when generated by Autopilot, A/B tests, or manual creation
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
