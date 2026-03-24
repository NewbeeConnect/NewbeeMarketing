/**
 * POST /api/twitter/post
 *
 * Post a tweet or thread to X via @newbeeconnect.
 * Can post a draft from mkt_tweets or raw text.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { postTweet, postThread } from "@/lib/twitter/client";

const postSchema = z.union([
  z.object({
    tweetId: z.string().uuid(),
  }),
  z.object({
    text: z.string().min(1).max(4000),
  }),
  z.object({
    thread: z.array(z.string().min(1).max(4000)).min(1).max(10),
  }),
]);

export async function POST(req: Request) {
  try {
    // Auth
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const serviceClient = createServiceClient();
    const rateCheck = await checkRateLimit(serviceClient, user.id, "social-publish");
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.error }, { status: 429 });
    }

    // Validate input
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;

    // mkt_tweets is not in generated types yet — cast to bypass type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = serviceClient as any;

    // Determine what to post
    let tweetText: string | undefined;
    let threadTweets: string[] | undefined;
    let dbTweetId: string | undefined;

    if ("tweetId" in input) {
      // Posting a saved draft
      dbTweetId = input.tweetId;
      const { data: tweet, error: fetchError } = await db
        .from("mkt_tweets")
        .select("*")
        .eq("id", input.tweetId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !tweet) {
        return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
      }

      if (tweet.status === "published") {
        return NextResponse.json({ error: "Tweet already published" }, { status: 400 });
      }

      if (tweet.is_thread && tweet.thread_tweets) {
        threadTweets = tweet.thread_tweets as string[];
      } else {
        tweetText = tweet.content;
      }
    } else if ("thread" in input) {
      threadTweets = input.thread;
    } else {
      tweetText = input.text;
    }

    // Post to X
    const result = threadTweets
      ? await postThread(threadTweets)
      : await postTweet(tweetText!);

    if (!result.success) {
      // Update status to failed if from DB
      if (dbTweetId) {
        await db
          .from("mkt_tweets")
          .update({ status: "failed", error_message: result.error })
          .eq("id", dbTweetId);
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update DB record
    if (dbTweetId) {
      await db
        .from("mkt_tweets")
        .update({
          status: "published",
          tweet_id: result.tweetId,
          tweet_url: result.tweetUrl,
          published_at: new Date().toISOString(),
        })
        .eq("id", dbTweetId);
    } else {
      // Save the manually posted tweet
      await db.from("mkt_tweets").insert({
        user_id: user.id,
        content: tweetText ?? (threadTweets ? threadTweets[0] : ""),
        is_thread: !!threadTweets,
        thread_tweets: threadTweets ?? null,
        category: "manual",
        language: "en",
        status: "published",
        tweet_id: result.tweetId,
        tweet_url: result.tweetUrl,
        published_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      data: {
        tweetId: result.tweetId,
        tweetUrl: result.tweetUrl,
      },
    });
  } catch (e) {
    console.error("Tweet post error:", e);
    return NextResponse.json(
      { error: "Failed to post tweet" },
      { status: 500 }
    );
  }
}
