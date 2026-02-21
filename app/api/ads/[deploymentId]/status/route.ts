import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deploymentId: string }> }
) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deploymentId } = await params;

    if (!deploymentId) {
      return NextResponse.json(
        { error: "deploymentId is required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // ── Fetch deployment ──────────────────────────────────────────────────
    const { data: deployment, error: fetchError } = await serviceClient
      .from("mkt_ad_deployments")
      .select("*")
      .eq("id", deploymentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ deployment });
  } catch (error) {
    console.error("[AdsStatus] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch deployment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
