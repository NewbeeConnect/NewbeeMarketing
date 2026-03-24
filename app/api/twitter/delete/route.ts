/**
 * DELETE /api/twitter/delete
 *
 * Delete a draft tweet from mkt_tweets.
 * Published tweets can optionally be deleted from X as well.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { deleteTweet } from "@/lib/twitter/client";

const deleteSchema = z.object({
  tweetId: z.string().uuid(),
  deleteFromX: z.boolean().default(false),
});

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tweetId, deleteFromX } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;

    const { data: tweet, error: fetchError } = await db
      .from("mkt_tweets")
      .select("id, status, tweet_id")
      .eq("id", tweetId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Delete from X if requested and tweet was published
    if (deleteFromX && tweet.tweet_id) {
      const result = await deleteTweet(tweet.tweet_id);
      if (!result.success) {
        console.error("Failed to delete from X:", result.error);
      }
    }

    const { error: deleteError } = await db
      .from("mkt_tweets")
      .delete()
      .eq("id", tweetId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete tweet:", deleteError);
      return NextResponse.json({ error: "Failed to delete tweet" }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (e) {
    console.error("Tweet delete error:", e);
    return NextResponse.json({ error: "Failed to delete tweet" }, { status: 500 });
  }
}
