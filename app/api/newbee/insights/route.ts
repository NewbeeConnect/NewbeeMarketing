import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { fetchNewbeeInsights } from "@/lib/newbee/insights";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insights = await fetchNewbeeInsights();

    if (!insights) {
      return NextResponse.json(
        { error: "Newbee data source not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Newbee insights error:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
