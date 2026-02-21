import { NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import type { CampaignPerformance } from "@/types/database";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Fetch recent performance data
    const { data: perfData } = await serviceClient
      .from("mkt_campaign_performance")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(60);

    const performance = (perfData ?? []) as CampaignPerformance[];

    // Fetch campaign count and project count
    const { count: campaignCount } = await serviceClient
      .from("mkt_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: deploymentCount } = await serviceClient
      .from("mkt_ad_deployments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // If no performance data, return basic insights
    if (performance.length === 0) {
      return NextResponse.json({
        insights: [
          {
            type: "info",
            message: "Start your first campaign to see AI-powered insights here.",
          },
        ],
        cached: false,
      });
    }

    // Aggregate stats
    const totalImpressions = performance.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = performance.reduce((s, r) => s + r.clicks, 0);
    const totalConversions = performance.reduce((s, r) => s + r.conversions, 0);
    const totalSpend = performance.reduce((s, r) => s + r.spend_usd, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Check for A/B performance split
    const emotional = performance.filter((r) => r.version_type === "emotional");
    const technical = performance.filter((r) => r.version_type === "technical");

    if (!ai) {
      // Rule-based insights when AI is not available
      const insights = generateRuleBasedInsights({
        totalImpressions, totalClicks, totalConversions, totalSpend, avgCtr,
        emotional, technical, campaignCount: campaignCount ?? 0,
        deploymentCount: deploymentCount ?? 0,
      });
      return NextResponse.json({ insights, cached: false });
    }

    // Generate AI insights with Gemini Flash
    const prompt = `You are an AI marketing analyst. Based on the following campaign performance data, generate 3-5 short, actionable insights. Each insight should be a single sentence.

Performance Summary:
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Clicks: ${totalClicks.toLocaleString()}
- Average CTR: ${avgCtr.toFixed(2)}%
- Total Conversions: ${totalConversions}
- Total Ad Spend: $${totalSpend.toFixed(2)}
- Active Campaigns: ${campaignCount ?? 0}
- Active Deployments: ${deploymentCount ?? 0}
${emotional.length > 0 ? `
A/B Test Data:
- Emotional approach: ${emotional.reduce((s, r) => s + r.clicks, 0)} clicks, ${emotional.length > 0 ? ((emotional.reduce((s, r) => s + r.clicks, 0) / emotional.reduce((s, r) => s + r.impressions, 0)) * 100).toFixed(2) : 0}% CTR
- Technical approach: ${technical.reduce((s, r) => s + r.clicks, 0)} clicks, ${technical.length > 0 && technical.reduce((s, r) => s + r.impressions, 0) > 0 ? ((technical.reduce((s, r) => s + r.clicks, 0) / technical.reduce((s, r) => s + r.impressions, 0)) * 100).toFixed(2) : 0}% CTR` : ""}

Return JSON array of objects: [{"type": "success|trend|warning|info", "message": "insight text"}]
- "success" for good performance metrics
- "trend" for notable patterns
- "warning" for budget or performance concerns
- "info" for general advice`;

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 512,
      },
    });

    const text = response.text ?? "[]";
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    try {
      const insights = JSON.parse(cleaned);
      return NextResponse.json({ insights, cached: false });
    } catch {
      // Fallback to rule-based
      const insights = generateRuleBasedInsights({
        totalImpressions, totalClicks, totalConversions, totalSpend, avgCtr,
        emotional, technical, campaignCount: campaignCount ?? 0,
        deploymentCount: deploymentCount ?? 0,
      });
      return NextResponse.json({ insights, cached: false });
    }
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}

function generateRuleBasedInsights(stats: {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  avgCtr: number;
  emotional: CampaignPerformance[];
  technical: CampaignPerformance[];
  campaignCount: number;
  deploymentCount: number;
}): Array<{ type: string; message: string }> {
  const insights: Array<{ type: string; message: string }> = [];

  if (stats.avgCtr > 3) {
    insights.push({ type: "success", message: `Your average CTR of ${stats.avgCtr.toFixed(1)}% is above industry average. Keep up the great work!` });
  } else if (stats.avgCtr > 0) {
    insights.push({ type: "info", message: `Your average CTR is ${stats.avgCtr.toFixed(1)}%. Try testing different hooks to improve click-through rates.` });
  }

  if (stats.emotional.length > 0 && stats.technical.length > 0) {
    const emotionalCtr = stats.emotional.reduce((s, r) => s + r.clicks, 0) / Math.max(stats.emotional.reduce((s, r) => s + r.impressions, 0), 1) * 100;
    const technicalCtr = stats.technical.reduce((s, r) => s + r.clicks, 0) / Math.max(stats.technical.reduce((s, r) => s + r.impressions, 0), 1) * 100;

    if (emotionalCtr > technicalCtr * 1.2) {
      insights.push({ type: "trend", message: `Emotional/Story-driven content is outperforming Technical content by ${((emotionalCtr / technicalCtr - 1) * 100).toFixed(0)}%. Lean into storytelling.` });
    } else if (technicalCtr > emotionalCtr * 1.2) {
      insights.push({ type: "trend", message: `Technical/Benefit-driven content is outperforming Emotional content by ${((technicalCtr / emotionalCtr - 1) * 100).toFixed(0)}%. Focus on features and data.` });
    }
  }

  if (stats.totalSpend > 0 && stats.totalConversions > 0) {
    const cpa = stats.totalSpend / stats.totalConversions;
    insights.push({ type: "info", message: `Your cost per acquisition is $${cpa.toFixed(2)}. ${cpa < 5 ? "That's efficient!" : "Consider optimizing targeting to lower CPA."}` });
  }

  if (insights.length === 0) {
    insights.push({ type: "info", message: "Your campaigns are running. Data will populate as performance metrics come in." });
  }

  return insights;
}
