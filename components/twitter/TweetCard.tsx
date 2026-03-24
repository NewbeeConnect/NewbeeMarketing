"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ExternalLink,
  Trash2,
  Copy,
  Edit2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { Tweet } from "@/hooks/useTweets";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  draft: { label: "Draft", variant: "secondary", icon: Edit2 },
  approved: { label: "Approved", variant: "outline", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", variant: "outline", icon: Clock },
  publishing: { label: "Publishing...", variant: "default", icon: Loader2 },
  published: { label: "Published", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  value_content: "Value",
  community_story: "Story",
  engagement: "Engagement",
  product_cta: "CTA",
  trend_hack: "Trend",
  did_you_know: "Fact",
  thread_guide: "Thread",
  motivation: "Motivation",
  manual: "Manual",
};

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  tr: "🇹🇷",
  de: "🇩🇪",
};

interface TweetCardProps {
  tweet: Tweet;
  onPost?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string, action: "approve" | "schedule" | "draft", scheduledFor?: string) => void;
  isPosting?: boolean;
}

export function TweetCard({ tweet, onPost, onDelete, onSchedule, isPosting }: TweetCardProps) {
  const statusConfig = STATUS_CONFIG[tweet.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  const charCount = tweet.content.length;
  const isOverLimit = charCount > 280;

  return (
    <Card className="group relative">
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={statusConfig.variant} className="text-xs">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[tweet.category] ?? tweet.category}
            </Badge>
            <span className="text-xs">{LANG_FLAGS[tweet.language] ?? "🌍"}</span>
          </div>
          <span className={`text-xs font-mono ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
            {charCount}/280
          </span>
        </div>

        {tweet.is_thread && tweet.thread_tweets ? (
          <div className="space-y-2">
            {tweet.thread_tweets.map((t, i) => (
              <div key={i} className="text-sm border-l-2 border-muted pl-3 py-1">
                <span className="text-muted-foreground text-xs font-mono mr-1">{i + 1}/</span>
                {t}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{tweet.content}</p>
        )}

        {tweet.topic && (
          <p className="text-xs text-muted-foreground mt-2">
            Topic: {tweet.topic}
          </p>
        )}

        {tweet.error_message && (
          <p className="text-xs text-destructive mt-2">
            Error: {tweet.error_message}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(tweet.generated_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div className="flex items-center gap-1">
          {tweet.tweet_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={tweet.tweet_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigator.clipboard.writeText(tweet.content)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          {(tweet.status === "draft" || tweet.status === "failed") && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(tweet.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {tweet.status === "draft" && onSchedule && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const date = prompt("Schedule for (YYYY-MM-DDTHH:mm):");
                if (date) onSchedule(tweet.id, "schedule", new Date(date).toISOString());
              }}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Schedule
            </Button>
          )}

          {tweet.status === "scheduled" && onSchedule && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSchedule(tweet.id, "draft")}
            >
              Unschedule
            </Button>
          )}

          {tweet.scheduled_for && tweet.status === "scheduled" && (
            <span className="text-xs text-muted-foreground">
              {new Date(tweet.scheduled_for).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}

          {(tweet.status === "draft" || tweet.status === "approved" || tweet.status === "failed") && onPost && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPost(tweet.id)}
              disabled={isPosting}
            >
              {isPosting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Post
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
