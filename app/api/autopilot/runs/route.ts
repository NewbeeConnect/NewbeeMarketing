import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** GET: List autopilot run history */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("mkt_autopilot_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ runs: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
