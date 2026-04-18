import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** GET: Unified social analytics dashboard data */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const url = new URL(request.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30") || 30, 1), 365);
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Aggregate metrics per platform
    const { data: metrics } = await supabase
      .from("mkt_social_post_metrics")
      .select("platform, impressions, reach, likes, comments, shares, saves, clicks, engagement_rate, video_views, date")
      .eq("user_id", user.id)
      .gte("date", sinceDate)
      .order("date", { ascending: true });

    // Per-platform totals
    const platformTotals: Record<string, {
      impressions: number; reach: number; likes: number; comments: number;
      shares: number; saves: number; clicks: number; avgEngagement: number; posts: number;
    }> = {};

    for (const m of metrics ?? []) {
      if (!platformTotals[m.platform]) {
        platformTotals[m.platform] = { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, avgEngagement: 0, posts: 0 };
      }
      const p = platformTotals[m.platform];
      p.impressions += m.impressions;
      p.reach += m.reach;
      p.likes += m.likes;
      p.comments += m.comments;
      p.shares += m.shares;
      p.saves += m.saves;
      p.clicks += m.clicks;
      p.avgEngagement += m.engagement_rate;
      p.posts++;
    }

    // Calculate averages
    for (const p of Object.values(platformTotals)) {
      p.avgEngagement = p.posts > 0 ? p.avgEngagement / p.posts : 0;
    }

    // Content queue stats
    const { data: queueStats } = await supabase
      .from("mkt_content_queue")
      .select("status")
      .eq("user_id", user.id);

    const statusCounts: Record<string, number> = {};
    for (const item of queueStats ?? []) {
      statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
    }

    return NextResponse.json({
      platformTotals,
      dailyMetrics: metrics ?? [],
      queueStats: statusCounts,
      period: { days, since: sinceDate },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
