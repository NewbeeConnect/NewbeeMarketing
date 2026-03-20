import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { publishToAds } from "@/lib/ads/publisher";
import { getUserAdKeys } from "@/lib/ads/key-store";
import type { AdCampaignConfig } from "@/lib/ads/types";
import { z } from "zod";

const publishSchema = z.object({
  platform: z.enum(["google", "meta"]),
  campaign_name: z.string().min(1, "Campaign name is required"),
  budget_daily_usd: z.number().positive("Daily budget must be positive"),
  budget_total_usd: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  targeting: z.object({
    age_range: z.tuple([z.number().min(13), z.number().max(65)]),
    locations: z.array(z.string()),
    interests: z.array(z.string()),
    languages: z.array(z.string()),
  }).optional(),
  creative_urls: z.array(z.string().url()).min(1, "At least one creative URL is required"),
  project_id: z.string().uuid(),
  campaign_id: z.string().uuid().optional(),
});

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
    const body = await request.json();
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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
    } = parsed.data;

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
