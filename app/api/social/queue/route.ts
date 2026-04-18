import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { start } from "workflow/api";
import { contentApprovalWorkflow } from "@/workflows/content-approval";
import { z } from "zod";

const createSchema = z.object({
  text_content: z.string().min(1),
  media_urls: z.array(z.string()).optional(),
  media_type: z.enum(["video", "image", "carousel"]).optional(),
  hashtags: z.array(z.string()).optional(),
  target_platforms: z.array(z.string()).min(1),
  campaign_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  scheduled_at: z.string().optional(),
  source: z.enum(["manual", "autopilot", "trend", "ab_test"]).optional(),
  trend_id: z.string().uuid().optional(),
  prompt_template_id: z.string().uuid().optional(),
  generation_prompt: z.string().optional(),
});

/** GET: List content queue items for the current user */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

    let query = supabase
      .from("mkt_content_queue")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status as import("@/types/database").ContentQueueStatus);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST: Create a content queue item and start approval workflow */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    // Insert into content queue
    const { data: queueItem, error: insertError } = await serviceClient
      .from("mkt_content_queue")
      .insert({
        user_id: user.id,
        text_content: input.text_content,
        media_urls: input.media_urls ?? [],
        media_type: input.media_type ?? null,
        hashtags: input.hashtags ?? [],
        target_platforms: input.target_platforms,
        campaign_id: input.campaign_id ?? null,
        project_id: input.project_id ?? null,
        scheduled_at: input.scheduled_at ?? null,
        source: input.source ?? "manual",
        trend_id: input.trend_id ?? null,
        prompt_template_id: input.prompt_template_id ?? null,
        generation_prompt: input.generation_prompt ?? null,
        status: "pending_review",
      })
      .select("id, status")
      .single();

    if (insertError || !queueItem) {
      return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
    }

    // Start the approval workflow
    const run = await start(contentApprovalWorkflow, [queueItem.id]);

    // Store workflow run ID
    await serviceClient
      .from("mkt_content_queue")
      .update({ workflow_run_id: run.runId })
      .eq("id", queueItem.id);

    return NextResponse.json({
      id: queueItem.id,
      status: "pending_review",
      workflowRunId: run.runId,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
