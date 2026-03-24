/**
 * GET /api/cron/tweet-scheduler
 *
 * Cron job — posts scheduled tweets whose scheduled_for time has passed.
 * Runs every 15 minutes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { postTweet, postThread } from "@/lib/twitter/client";

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;

    // Find tweets that are scheduled and due
    const { data: tweets, error } = await db
      .from("mkt_tweets")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (error) {
      console.error("[tweet-scheduler] Query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (!tweets || tweets.length === 0) {
      return NextResponse.json({ ok: true, posted: 0 });
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const tweet of tweets) {
      // Mark as publishing to prevent duplicate posting
      await db
        .from("mkt_tweets")
        .update({ status: "publishing" })
        .eq("id", tweet.id);

      try {
        const result = tweet.is_thread && tweet.thread_tweets
          ? await postThread(tweet.thread_tweets as string[])
          : await postTweet(tweet.content);

        if (result.success) {
          await db
            .from("mkt_tweets")
            .update({
              status: "published",
              tweet_id: result.tweetId,
              tweet_url: result.tweetUrl,
              published_at: new Date().toISOString(),
            })
            .eq("id", tweet.id);

          results.push({ id: tweet.id, success: true });
        } else {
          await db
            .from("mkt_tweets")
            .update({ status: "failed", error_message: result.error })
            .eq("id", tweet.id);

          results.push({ id: tweet.id, success: false, error: result.error });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await db
          .from("mkt_tweets")
          .update({ status: "failed", error_message: msg })
          .eq("id", tweet.id);

        results.push({ id: tweet.id, success: false, error: msg });
      }
    }

    const posted = results.filter((r) => r.success).length;
    return NextResponse.json({ ok: true, posted, total: tweets.length, results });
  } catch (e) {
    console.error("[tweet-scheduler] Error:", e);
    return NextResponse.json({ error: "Scheduler failed" }, { status: 500 });
  }
}
