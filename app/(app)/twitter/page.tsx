"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Twitter,
} from "lucide-react";
import { useTweets, usePostTweet, useScheduleTweet, useDeleteTweet } from "@/hooks/useTweets";
import { TweetCard } from "@/components/twitter/TweetCard";
import { GenerateTweetsDialog } from "@/components/twitter/GenerateTweetsDialog";
import { toast } from "sonner";

export default function TwitterPage() {
  const [activeTab, setActiveTab] = useState("draft");
  const [postingId, setPostingId] = useState<string | null>(null);

  const { data: tweetsData, isLoading } = useTweets(activeTab === "all" ? undefined : activeTab);
  const postMutation = usePostTweet();
  const scheduleMutation = useScheduleTweet();
  const deleteMutation = useDeleteTweet();

  const tweets = tweetsData?.data ?? [];
  const total = tweetsData?.meta?.total ?? 0;

  const handlePost = async (tweetId: string) => {
    setPostingId(tweetId);
    try {
      const result = await postMutation.mutateAsync({ tweetId });
      toast.success("Tweet posted!", {
        action: {
          label: "View",
          onClick: () => window.open(result.data.tweetUrl, "_blank"),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPostingId(null);
    }
  };

  const handleSchedule = async (tweetId: string, action: "approve" | "schedule" | "draft", scheduledFor?: string) => {
    try {
      await scheduleMutation.mutateAsync({ tweetId, action, scheduledFor });
      toast.success(action === "schedule" ? "Tweet scheduled!" : action === "draft" ? "Moved to drafts" : "Tweet approved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (tweetId: string) => {
    try {
      await deleteMutation.mutateAsync({ tweetId });
      toast.success("Tweet deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Twitter className="h-6 w-6" />
            Twitter Hub
          </h1>
          <p className="text-muted-foreground">
            Generate and manage tweets for @newbeeconnect
          </p>
        </div>
        <GenerateTweetsDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatsCard title="Drafts" value={total} icon={FileText} tab="draft" activeTab={activeTab} />
        <StatsCard title="Published" value="-" icon={CheckCircle2} tab="published" activeTab={activeTab} />
        <StatsCard title="Scheduled" value="-" icon={Send} tab="scheduled" activeTab={activeTab} />
        <StatsCard title="Failed" value="-" icon={XCircle} tab="failed" activeTab={activeTab} />
      </div>

      {/* Tweet List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : tweets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Twitter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No tweets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate AI-powered tweets to get started
                </p>
                <GenerateTweetsDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  onPost={handlePost}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                  isPosting={postingId === tweet.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  tab,
  activeTab,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tab: string;
  activeTab: string;
}) {
  return (
    <Card className={activeTab === tab ? "border-primary" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
