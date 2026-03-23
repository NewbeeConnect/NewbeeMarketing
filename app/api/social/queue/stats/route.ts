import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * GET: Return content queue counts grouped by status.
 * Fetches only the status column (lightweight) and counts client-side,
 * replacing the need for multiple full-list queries.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: items, error } = await supabase
      .from("mkt_content_queue")
      .select("status")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const item of items ?? []) {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
