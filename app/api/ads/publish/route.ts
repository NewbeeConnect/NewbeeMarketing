import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { publishToAds } from "@/lib/ads/publisher";
import { getUserAdKeys } from "@/lib/ads/key-store";
import type { AdCampaignConfig, PublishAdRequest } from "@/lib/ads/types";

export async function POST(request: NextRequest) {
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

    // ── Validate input ────────────────────────────────────────────────────
    const body: PublishAdRequest = await request.json();

    const {
      platform,
      campaign_name,
      budget_daily_usd,
      budget_total_usd,
      start_date,
      end_date,
      targeting,
      creative_urls,
      project_id,
      campaign_id,
    } = body;

    if (!platform || !campaign_name || !project_id) {
      return NextResponse.json(
        { error: "platform, campaign_name, and project_id are required" },
        { status: 400 }
      );
    }

    if (!["google", "meta"].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be "google" or "meta"' },
        { status: 400 }
      );
    }

    if (!creative_urls || creative_urls.length === 0) {
      return NextResponse.json(
        { error: "At least one creative_url is required" },
        { status: 400 }
      );
    }

    if (!budget_daily_usd || budget_daily_usd <= 0) {
      return NextResponse.json(
        { error: "budget_daily_usd must be a positive number" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // ── Verify project ownership ──────────────────────────────────────────
    const { data: projectData, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("id")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // ── Fetch user's platform API keys ────────────────────────────────────
    const platformSlug = platform === "google" ? "google_ads" : "meta_ads";
    const userKeys = await getUserAdKeys(serviceClient, user.id, platformSlug);

    // ── Build campaign config ─────────────────────────────────────────────
    const config: AdCampaignConfig = {
      platform,
      campaign_name,
      budget_daily_usd,
      budget_total_usd: budget_total_usd ?? budget_daily_usd * 30,
      start_date: start_date ?? new Date().toISOString().split("T")[0],
      end_date: end_date ?? "",
      targeting: targeting ?? {
        age_range: [18, 65],
        locations: [],
        interests: [],
        languages: ["en"],
      },
      creative_urls,
      project_id,
    };

    // ── Call the publisher ─────────────────────────────────────────────────
    const result = await publishToAds(config, userKeys);

    // ── Save deployment record ────────────────────────────────────────────
    const { data: deployment, error: deployError } = await serviceClient
      .from("mkt_ad_deployments")
      .insert({
        user_id: user.id,
        campaign_id: campaign_id ?? null,
        project_id,
        platform,
        external_campaign_id: result.external_campaign_id,
        external_ad_id: result.external_ad_id,
        creative_urls,
        budget_daily_usd,
        budget_total_usd: config.budget_total_usd,
        targeting: config.targeting,
        status: result.success ? "pending_review" : "draft",
        published_at: result.success ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (deployError) {
      console.error("[AdsPublish] Failed to save deployment:", deployError);
      return NextResponse.json(
        {
          error: "Ad was published but failed to save deployment record",
          publishResult: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deployment,
      publishResult: result,
    });
  } catch (error) {
    console.error("[AdsPublish] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to publish ad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
