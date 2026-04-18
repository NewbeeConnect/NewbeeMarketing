import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { start } from "workflow/api";
import { autopilotDailyRun } from "@/workflows/autopilot-agent";

/** POST: Manually trigger an autopilot run */
export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "autopilot");
    if (!rl.allowed) return rateLimitResponse(rl);

    const run = await start(autopilotDailyRun, [user.id]);

    return NextResponse.json({ ok: true, runId: run.runId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
