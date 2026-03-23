import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resumeHook } from "workflow/api";
import { z } from "zod";

const approveSchema = z.object({
  publishPlatforms: z.array(z.string()).optional(),
});

type RouteContext = { params: Promise<{ contentId: string }> };

/** POST: Approve a content queue item (resumes WDK hook) */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { contentId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: item } = await supabase
      .from("mkt_content_queue")
      .select("hook_token, user_id")
      .eq("id", contentId)
      .single();

    if (!item || item.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!item.hook_token) {
      return NextResponse.json({ error: "No pending approval workflow" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = approveSchema.safeParse(body);

    await resumeHook(item.hook_token, {
      decision: "approved" as const,
      publishPlatforms: parsed.success ? parsed.data.publishPlatforms : undefined,
    });

    return NextResponse.json({ ok: true, status: "approved" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
