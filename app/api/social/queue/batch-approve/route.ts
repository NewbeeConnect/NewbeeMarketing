import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resumeHook } from "workflow/api";
import { z } from "zod";

const batchSchema = z.object({
  contentIds: z.array(z.string().uuid()).min(1).max(50),
  publishPlatforms: z.array(z.string()).optional(),
});

/** POST: Batch approve multiple content queue items */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { contentIds, publishPlatforms } = parsed.data;

    // Get hook tokens for all items
    const { data: items } = await supabase
      .from("mkt_content_queue")
      .select("id, hook_token")
      .in("id", contentIds)
      .eq("user_id", user.id)
      .eq("status", "pending_review");

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No pending items found" }, { status: 404 });
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const item of items) {
      if (!item.hook_token) {
        results.push({ id: item.id, success: false, error: "No hook token" });
        continue;
      }

      try {
        await resumeHook(item.hook_token, {
          decision: "approved" as const,
          publishPlatforms,
        });
        results.push({ id: item.id, success: true });
      } catch (e) {
        results.push({ id: item.id, success: false, error: (e as Error).message });
      }
    }

    return NextResponse.json({
      approved: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
