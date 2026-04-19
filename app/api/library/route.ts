import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { PROJECT_SLUGS, IMAGE_RATIOS, VIDEO_RATIOS } from "@/lib/projects";

/**
 * GET /api/library?project=newbee&type=image&ratio=9:16
 *
 * List the current user's generations, optionally filtered by project / type
 * / ratio. Returns rows ordered newest-first.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    const params = request.nextUrl.searchParams;
    const project = params.get("project");
    const type = params.get("type");
    const ratio = params.get("ratio");

    // Team-shared library: every authenticated admin sees every row. RLS
    // is still enforced at the DB level (zero policies → service_role
    // only); the admin gate is the middleware. We intentionally skip a
    // `.eq("user_id", user.id)` filter here so the whole team browses
    // the same pool of assets.
    let query = serviceClient
      .from("mkt_generations")
      .select(
        "id, type, project_slug, ratio, filename, prompt, model, status, output_url, estimated_cost_usd, actual_cost_usd, error_message, created_at, completed_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (project && (PROJECT_SLUGS as readonly string[]).includes(project)) {
      query = query.eq("project_slug", project);
    }
    if (type === "image" || type === "video") {
      query = query.eq("type", type);
    }
    if (
      ratio &&
      (
        [...IMAGE_RATIOS, ...VIDEO_RATIOS] as readonly string[]
      ).includes(ratio)
    ) {
      query = query.eq("ratio", ratio);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[library GET] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("[library GET] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Library list failed" },
      { status: 500 }
    );
  }
}
