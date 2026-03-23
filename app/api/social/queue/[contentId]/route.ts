import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** GET: Fetch a single content queue item by ID */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("mkt_content_queue")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
