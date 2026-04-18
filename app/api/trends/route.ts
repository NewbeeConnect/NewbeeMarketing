import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** GET: List trends for the current user */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");
    const minScore = parseFloat(url.searchParams.get("minScore") ?? "0");

    let query = supabase
      .from("mkt_trends")
      .select("*")
      .eq("user_id", user.id)
      .gte("composite_score", minScore)
      .order("composite_score", { ascending: false })
      .limit(50);

    if (platform) query = query.eq("platform", platform);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ trends: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
