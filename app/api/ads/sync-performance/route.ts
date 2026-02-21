import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id is required" },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from("mkt_campaigns")
      .select("id")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // TODO: Implement actual sync with Google Ads and Meta Ads APIs
    // This is a stub that would:
    // 1. Fetch API keys from mkt_api_keys for the user
    // 2. Connect to Google Ads API / Meta Marketing API
    // 3. Pull latest performance data (impressions, clicks, conversions, spend)
    // 4. Upsert into mkt_campaign_performance table
    // 5. Update mkt_campaigns.current_spend_usd with latest total

    return NextResponse.json({
      success: true,
      message: "Performance sync would be triggered for campaign",
      campaign_id,
      synced_platforms: [],
      note: "This is a stub endpoint. Google Ads and Meta Ads API integrations are pending.",
    });
  } catch (error) {
    console.error("Sync performance error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync performance data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
