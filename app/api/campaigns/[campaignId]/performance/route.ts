import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CampaignPerformance } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
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

    const { campaignId } = await params;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const platform = searchParams.get("platform");

    // Build query
    let query = supabase
      .from("mkt_campaign_performance")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (from) {
      query = query.gte("date", from);
    }
    if (to) {
      query = query.lte("date", to);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as CampaignPerformance[];

    // Aggregate metrics
    const aggregated = {
      total_impressions: 0,
      total_clicks: 0,
      total_conversions: 0,
      total_spend_usd: 0,
      avg_ctr: 0,
      avg_conversion_rate: 0,
    };

    for (const row of rows) {
      aggregated.total_impressions += row.impressions;
      aggregated.total_clicks += row.clicks;
      aggregated.total_conversions += row.conversions;
      aggregated.total_spend_usd += row.spend_usd;
    }

    if (rows.length > 0) {
      aggregated.avg_ctr =
        aggregated.total_impressions > 0
          ? (aggregated.total_clicks / aggregated.total_impressions) * 100
          : 0;
      aggregated.avg_conversion_rate =
        aggregated.total_clicks > 0
          ? (aggregated.total_conversions / aggregated.total_clicks) * 100
          : 0;
    }

    // Round numbers
    aggregated.total_spend_usd =
      Math.round(aggregated.total_spend_usd * 100) / 100;
    aggregated.avg_ctr = Math.round(aggregated.avg_ctr * 100) / 100;
    aggregated.avg_conversion_rate =
      Math.round(aggregated.avg_conversion_rate * 100) / 100;

    return NextResponse.json({
      aggregated,
      data: rows,
    });
  } catch (error) {
    console.error("Campaign performance error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch campaign performance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
