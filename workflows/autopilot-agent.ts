/**
 * Autopilot Agent Workflow (WDK)
 *
 * Daily AI agent that analyzes performance, detects trends,
 * generates content suggestions, and queues them for approval.
 */

import { getWritable } from "workflow";

export type AutopilotEvent =
  | { type: "analyzing"; step: string }
  | { type: "generating"; count: number }
  | { type: "complete"; generated: number; cost: number };

export async function autopilotDailyRun(userId: string): Promise<{
  status: "completed" | "failed";
  generated: number;
  cost: number;
}> {
  "use workflow";

  // Step 1: Check if autopilot is enabled and within budget
  const config = await getAutopilotConfig(userId);
  if (!config || !config.is_enabled) {
    return { status: "completed", generated: 0, cost: 0 };
  }

  // Step 2: Create run record
  const runId = await createRunRecord(userId);

  try {
    // Step 3: Gather performance data
    await emitEvent({ type: "analyzing", step: "performance" });
    const performanceData = await gatherPerformanceData(userId);

    // Step 4: Analyze what works
    await emitEvent({ type: "analyzing", step: "analysis" });
    const analysis = await analyzePerformance(userId, performanceData);

    // Step 5: Get recent trends
    await emitEvent({ type: "analyzing", step: "trends" });
    const trends = await getRecentTrends(userId);

    // Step 6: Generate content suggestions
    await emitEvent({ type: "generating", count: 0 });
    const suggestions = await generateSuggestions(
      userId,
      config,
      analysis,
      trends
    );

    // Step 7: Queue suggestions (within budget)
    let generated = 0;
    let totalCost = 0;

    for (const suggestion of suggestions) {
      if (totalCost + suggestion.estimatedCost > config.monthly_budget_usd) break;

      await queueContent(userId, suggestion);
      generated++;
      totalCost += suggestion.estimatedCost;
    }

    await emitEvent({ type: "complete", generated, cost: totalCost });
    await completeRun(runId, generated, totalCost, analysis);

    return { status: "completed", generated, cost: totalCost };
  } catch (e) {
    await failRun(runId, (e as Error).message);
    return { status: "failed", generated: 0, cost: 0 };
  }
}

// ─── Step Functions ─────────────────────────────────────────────────────────

async function getAutopilotConfig(userId: string) {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  const { data } = await client.from("mkt_autopilot_config")
    .select("id, user_id, is_enabled, auto_generate, frequency, target_platforms, brand_kit_id, monthly_budget_usd, content_types, preferred_posting_times, style_preferences")
    .eq("user_id", userId).single();
  return data;
}

async function createRunRecord(userId: string): Promise<string> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  const { data } = await client.from("mkt_autopilot_runs").insert({
    user_id: userId,
    status: "running",
  }).select("id").single();
  return data?.id ?? "";
}

async function gatherPerformanceData(userId: string): Promise<Record<string, unknown>> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  // Last 30 days of social post metrics
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: metrics } = await client
    .from("mkt_social_post_metrics")
    .select("platform, impressions, reach, likes, comments, shares, engagement_rate, video_views")
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgo);

  // Top performing content
  const { data: topContent } = await client
    .from("mkt_content_queue")
    .select("text_content, hashtags, target_platforms, media_type, source")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return { metrics: metrics ?? [], topContent: topContent ?? [] };
}

async function analyzePerformance(userId: string, data: Record<string, unknown>): Promise<string> {
  "use step";
  const { ai } = await import("@/lib/google-ai");
  if (!ai) return "AI not available — using default recommendations.";

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze this social media performance data and provide actionable insights.
Focus on: best performing content types, optimal posting times, top hashtags, content gaps.

Data: ${JSON.stringify(data).slice(0, 8000)}

Return a brief analysis (max 500 words) with specific recommendations for content creation.`,
  });

  // Log cost
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  await client.from("mkt_usage_logs").insert({
    user_id: userId,
    api_service: "gemini",
    model: "gemini-2.5-flash",
    operation: "autopilot_analysis",
    estimated_cost_usd: 0.005,
  });

  return result.text ?? "";
}

async function getRecentTrends(userId: string): Promise<Array<{ name: string; platform: string; score: number }>> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  const { data } = await client
    .from("mkt_trends")
    .select("name, platform, composite_score")
    .eq("user_id", userId)
    .gte("composite_score", 0.5)
    .order("composite_score", { ascending: false })
    .limit(10);

  return (data ?? []).map(t => ({ name: t.name, platform: t.platform, score: t.composite_score }));
}

async function generateSuggestions(
  userId: string,
  config: { target_platforms: string[]; content_types: string[]; style_preferences: unknown },
  analysis: string,
  trends: Array<{ name: string; platform: string; score: number }>
): Promise<Array<{ text: string; hashtags: string[]; platforms: string[]; mediaType: string; estimatedCost: number }>> {
  "use step";
  const { ai } = await import("@/lib/google-ai");
  if (!ai) return [];

  const result = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `Generate 3-5 social media content suggestions based on this analysis.

Performance Analysis: ${analysis}
Trending Topics: ${trends.map(t => `${t.name} (${t.platform}, score: ${t.score})`).join(", ")}
Target Platforms: ${config.target_platforms.join(", ")}
Content Types: ${config.content_types.join(", ")}

For each suggestion, return JSON array:
[{
  "text": "caption/post text",
  "hashtags": ["#tag1", "#tag2"],
  "platforms": ["instagram", "tiktok"],
  "mediaType": "video" or "image",
  "estimatedCost": 0.50
}]`,
  });

  // Log cost
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  await client.from("mkt_usage_logs").insert({
    user_id: userId,
    api_service: "gemini",
    model: "gemini-2.5-pro",
    operation: "autopilot_suggestions",
    estimated_cost_usd: 0.02,
  });

  // Extract JSON from AI response (handles markdown code blocks, mixed text, etc.)
  const { extractAiJson } = await import("@/lib/ai/response-schemas");
  try {
    const parsed = extractAiJson(result.text ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function queueContent(
  userId: string,
  suggestion: { text: string; hashtags: string[]; platforms: string[]; mediaType: string }
): Promise<void> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  await client.from("mkt_content_queue").insert({
    user_id: userId,
    text_content: suggestion.text,
    hashtags: suggestion.hashtags,
    target_platforms: suggestion.platforms,
    media_type: suggestion.mediaType as "video" | "image" | null,
    source: "autopilot",
    status: "pending_review",
  });
}

async function completeRun(runId: string, generated: number, cost: number, analysis: string): Promise<void> {
  "use step";
  if (!runId) return;
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  await client.from("mkt_autopilot_runs").update({
    status: "completed",
    content_generated: generated,
    ai_cost_usd: cost,
    analysis_summary: { text: analysis.slice(0, 2000) },
    completed_at: new Date().toISOString(),
  }).eq("id", runId);
}

async function failRun(runId: string, error: string): Promise<void> {
  "use step";
  if (!runId) return;
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();
  await client.from("mkt_autopilot_runs").update({
    status: "failed",
    error_message: error,
    completed_at: new Date().toISOString(),
  }).eq("id", runId);
}

async function emitEvent(event: AutopilotEvent): Promise<void> {
  "use step";
  const writer = getWritable<AutopilotEvent>().getWriter();
  try { await writer.write(event); } finally { writer.releaseLock(); }
}
