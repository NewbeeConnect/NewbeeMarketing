import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { start } from "workflow/api";
import { abTestLifecycleWorkflow } from "@/workflows/ab-test-lifecycle";

type RouteContext = { params: Promise<{ testId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("mkt_ab_tests")
      .select("*, mkt_ab_test_variants(*)")
      .eq("id", testId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ test: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** PATCH: Start a test (changes status to "running" and kicks off WDK workflow) */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { testId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const serviceClient = createServiceClient();

    if (body.action === "start") {
      const run = await start(abTestLifecycleWorkflow, [testId]);
      await serviceClient.from("mkt_ab_tests").update({
        status: "running",
        started_at: new Date().toISOString(),
        workflow_run_id: run.runId,
      }).eq("id", testId);

      return NextResponse.json({ ok: true, status: "running", workflowRunId: run.runId });
    }

    if (body.action === "pause") {
      await serviceClient.from("mkt_ab_tests").update({ status: "paused" }).eq("id", testId);
      return NextResponse.json({ ok: true, status: "paused" });
    }

    if (body.action === "cancel") {
      await serviceClient.from("mkt_ab_tests").update({ status: "cancelled" }).eq("id", testId);
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
