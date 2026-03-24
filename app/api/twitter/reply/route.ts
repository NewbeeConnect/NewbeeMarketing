/**
 * POST /api/twitter/reply
 *
 * Send a reply to a tweet. Accepts tweet URL or ID + reply text.
 * Uses Free tier tweet creation endpoint (replies count as tweets).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTwitterClient } from "@/lib/twitter/client";

const replySchema = z.object({
  tweetUrl: z.string().min(1),
  replyText: z.string().min(1).max(280),
});

function extractTweetId(input: string): string | null {
  // Handle full URL: https://x.com/user/status/123456 or https://twitter.com/user/status/123456
  const urlMatch = input.match(/(?:x|twitter)\.com\/\w+\/status\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  // Handle raw ID
  if (/^\d+$/.test(input.trim())) return input.trim();
  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const rateCheck = await checkRateLimit(serviceClient, user.id, "social-publish");
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.error }, { status: 429 });
    }

    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const tweetId = extractTweetId(parsed.data.tweetUrl);
    if (!tweetId) {
      return NextResponse.json({ error: "Invalid tweet URL or ID" }, { status: 400 });
    }

    const client = getTwitterClient();
    if (!client) {
      return NextResponse.json({ error: "Twitter client not configured" }, { status: 503 });
    }

    const result = await client.v2.reply(parsed.data.replyText, tweetId);

    return NextResponse.json({
      data: {
        replyId: result.data.id,
        replyUrl: `https://x.com/newbeeconnect/status/${result.data.id}`,
        inReplyTo: tweetId,
      },
    });
  } catch (e) {
    console.error("Reply error:", e);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
