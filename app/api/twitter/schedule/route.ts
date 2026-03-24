/**
 * PATCH /api/twitter/schedule
 *
 * Update tweet status: approve, schedule, or revert to draft.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

const scheduleSchema = z.object({
  tweetId: z.string().uuid(),
  action: z.enum(["approve", "schedule", "draft"]),
  scheduledFor: z.string().datetime().optional(),
});

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tweetId, action, scheduledFor } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;

    // Verify ownership
    const { data: tweet, error: fetchError } = await db
      .from("mkt_tweets")
      .select("id, status")
      .eq("id", tweetId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.status === "published") {
      return NextResponse.json({ error: "Cannot modify published tweet" }, { status: 400 });
    }

    let update: Record<string, unknown>;

    switch (action) {
      case "approve":
        update = { status: "approved", scheduled_for: null };
        break;
      case "schedule":
        if (!scheduledFor) {
          return NextResponse.json({ error: "scheduledFor is required for scheduling" }, { status: 400 });
        }
        if (new Date(scheduledFor) <= new Date()) {
          return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
        }
        update = { status: "scheduled", scheduled_for: scheduledFor };
        break;
      case "draft":
        update = { status: "draft", scheduled_for: null };
        break;
    }

    const { error: updateError } = await db
      .from("mkt_tweets")
      .update(update)
      .eq("id", tweetId);

    if (updateError) {
      console.error("Failed to update tweet:", updateError);
      return NextResponse.json({ error: "Failed to update tweet" }, { status: 500 });
    }

    return NextResponse.json({ data: { id: tweetId, ...update } });
  } catch (e) {
    console.error("Tweet schedule error:", e);
    return NextResponse.json({ error: "Failed to schedule tweet" }, { status: 500 });
  }
}
