/**
 * GET /api/twitter/list
 *
 * List tweets from mkt_tweets table with filtering.
 */

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    // Auth
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // draft, approved, published, failed
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const serviceClient = createServiceClient();
    // mkt_tweets is not in generated types yet — cast to bypass type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient as any)
      .from("mkt_tweets")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to list tweets:", error);
      return NextResponse.json({ error: "Failed to fetch tweets" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: { total: count, limit, offset },
    });
  } catch (e) {
    console.error("Tweet list error:", e);
    return NextResponse.json({ error: "Failed to list tweets" }, { status: 500 });
  }
}
