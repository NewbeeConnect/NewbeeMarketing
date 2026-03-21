/**
 * AI Performance Analyzer Prompt
 *
 * Analyzes campaign performance data and generates structured
 * optimization recommendations using Gemini Pro.
 */

export const PERFORMANCE_ANALYZER_SYSTEM_PROMPT = `You are a senior digital advertising analyst specializing in Instagram ad optimization for mobile apps.

Your role is to analyze campaign performance data, identify patterns, and provide actionable optimization recommendations.

## Analysis Framework

1. **Creative Performance**: Which creatives (video vs image) performed best? What visual elements correlate with higher CTR?
2. **Targeting Effectiveness**: Is the current audience targeting optimal? Are there underserved segments?
3. **Budget Efficiency**: Is the budget being spent effectively? What's the cost per result trend?
4. **A/B Test Interpretation**: If multiple variants exist, which approach (emotional vs technical) won?
5. **Prompt-to-Performance Correlation**: What elements in the original generation prompts may have contributed to success/failure?

## Output Requirements

Respond ONLY with a valid JSON object (no markdown, no explanation) matching this exact structure:

{
  "overall_score": <number 1-100>,
  "summary": "<2-3 sentence executive summary in Turkish>",
  "creative_analysis": {
    "best_performing": { "creative_url": "<url>", "reason": "<Turkish>" },
    "worst_performing": { "creative_url": "<url>", "reason": "<Turkish>" },
    "video_vs_image": { "winner": "video" | "image" | "tie", "explanation": "<Turkish>" }
  },
  "targeting_recommendations": {
    "age_adjustment": { "current": [<min>, <max>], "recommended": [<min>, <max>], "reason": "<Turkish>" },
    "location_suggestions": ["<country or city>"],
    "interest_additions": ["<interest>"],
    "interest_removals": ["<interest>"]
  },
  "budget_recommendations": {
    "daily_budget_suggestion": <number USD>,
    "reallocation": "<Turkish explanation>",
    "projected_improvement": "<Turkish>"
  },
  "prompt_suggestions": {
    "new_prompts": [
      { "prompt": "<English video/image generation prompt>", "rationale": "<Turkish>", "style": "emotional" | "technical" }
    ],
    "elements_to_keep": ["<Turkish>"],
    "elements_to_change": ["<Turkish>"]
  },
  "ab_test_interpretation": {
    "winner": "emotional" | "technical" | "inconclusive",
    "confidence": "<Turkish>",
    "next_test_suggestion": "<Turkish>"
  }
}`;

export interface PerformanceAnalysisInput {
  campaignName: string;
  objective: string;
  totalBudget: number;
  spentBudget: number;
  performanceData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    spend_usd: number;
    platform: string;
  }>;
  creativeDetails: Array<{
    url: string;
    type: "video" | "image";
    prompt?: string;
    aspect_ratio?: string;
    impressions?: number;
    clicks?: number;
    ctr?: number;
  }>;
  targetingConfig: {
    age_range: [number, number];
    locations: string[];
    interests: string[];
  };
  versionType?: "emotional" | "technical" | "single";
}

export function buildPerformanceAnalysisPrompt(
  input: PerformanceAnalysisInput
): string {
  const {
    campaignName,
    objective,
    totalBudget,
    spentBudget,
    performanceData,
    creativeDetails,
    targetingConfig,
    versionType,
  } = input;

  // Aggregate metrics
  const totalImpressions = performanceData.reduce(
    (sum, d) => sum + d.impressions,
    0
  );
  const totalClicks = performanceData.reduce(
    (sum, d) => sum + d.clicks,
    0
  );
  const totalConversions = performanceData.reduce(
    (sum, d) => sum + d.conversions,
    0
  );
  const totalSpend = performanceData.reduce(
    (sum, d) => sum + d.spend_usd,
    0
  );
  const avgCtr =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : "0";

  return `## Campaign: ${campaignName}
Objective: ${objective}
Budget: $${spentBudget.toFixed(2)} spent / $${totalBudget.toFixed(2)} total

## Aggregate Metrics (${performanceData.length} days)
- Impressions: ${totalImpressions.toLocaleString()}
- Clicks: ${totalClicks.toLocaleString()}
- Average CTR: ${avgCtr}%
- Conversions: ${totalConversions}
- Total Spend: $${totalSpend.toFixed(2)}
- Cost per Click: $${totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "N/A"}
- Cost per Conversion: $${totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "N/A"}

## Daily Performance Trend
${performanceData
  .slice(0, 14)
  .map(
    (d) =>
      `${d.date}: ${d.impressions} imp, ${d.clicks} clicks, ${(d.ctr * 100).toFixed(1)}% CTR, $${d.spend_usd.toFixed(2)} spend`
  )
  .join("\n")}

## Creatives Used (${creativeDetails.length} total)
${creativeDetails
  .map(
    (c, i) =>
      `${i + 1}. [${c.type.toUpperCase()}] ${c.url.split("/").pop()}${c.prompt ? ` | Prompt: "${c.prompt.substring(0, 100)}..."` : ""}${c.ctr ? ` | CTR: ${(c.ctr * 100).toFixed(1)}%` : ""}`
  )
  .join("\n")}

## Current Targeting
- Age: ${targetingConfig.age_range[0]}-${targetingConfig.age_range[1]}
- Locations: ${targetingConfig.locations.join(", ") || "Not specified"}
- Interests: ${targetingConfig.interests.join(", ") || "Not specified"}

${versionType && versionType !== "single" ? `## A/B Test Mode: This is the "${versionType}" variant` : ""}

Analyze this campaign and provide optimization recommendations.`;
}
