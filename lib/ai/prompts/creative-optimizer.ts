/**
 * Creative Optimizer Prompt
 *
 * Takes original generation prompts + performance data
 * and generates optimized prompt variations.
 */

export const CREATIVE_OPTIMIZER_SYSTEM_PROMPT = `You are a creative optimization specialist who improves video/image generation prompts based on ad performance data.

Your job is to analyze what worked and what didn't in the original creative, then generate improved prompt variations that should perform better on Instagram.

## Key Principles
- Keep elements that correlated with high CTR/engagement
- Change elements that correlated with low performance
- Each variation should focus on a different improvement angle
- Prompts must be specific enough for Veo 3.1 (video) or Imagen 4 (image) generation

## Output Requirements

Respond ONLY with a valid JSON object:

{
  "variations": [
    {
      "prompt": "<English generation prompt for Veo/Imagen>",
      "negative_prompt": "<what to avoid>",
      "rationale": "<Turkish - why this should perform better>",
      "expected_improvement": "<Turkish - what metric should improve>",
      "focus_area": "hook" | "narrative" | "visual_style" | "cta"
    }
  ],
  "recommended_aspect_ratios": ["9:16", "1:1"],
  "recommended_duration": <number in seconds>
}`;

export interface CreativeOptimizationInput {
  originalPrompt: string;
  creativeType: "video" | "image";
  aspectRatio: string;
  duration?: number;
  performanceMetrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    spend_usd: number;
  };
  analysisInsights: string[];
  campaignObjective: string;
  targetAudience: string;
}

export function buildCreativeOptimizationPrompt(
  input: CreativeOptimizationInput
): string {
  const {
    originalPrompt,
    creativeType,
    aspectRatio,
    duration,
    performanceMetrics,
    analysisInsights,
    campaignObjective,
    targetAudience,
  } = input;

  const ctr = (performanceMetrics.ctr * 100).toFixed(2);
  const cpc =
    performanceMetrics.clicks > 0
      ? (
          performanceMetrics.spend_usd / performanceMetrics.clicks
        ).toFixed(2)
      : "N/A";

  return `## Original Creative
Type: ${creativeType}
Aspect Ratio: ${aspectRatio}
${duration ? `Duration: ${duration}s` : ""}
Prompt: "${originalPrompt}"

## Performance Results
- Impressions: ${performanceMetrics.impressions.toLocaleString()}
- Clicks: ${performanceMetrics.clicks.toLocaleString()}
- CTR: ${ctr}%
- Conversions: ${performanceMetrics.conversions}
- Spend: $${performanceMetrics.spend_usd.toFixed(2)}
- CPC: $${cpc}

## AI Analysis Insights
${analysisInsights.map((i) => `- ${i}`).join("\n")}

## Campaign Context
- Objective: ${campaignObjective}
- Target Audience: ${targetAudience}
- Platform: Instagram

Generate 3 optimized prompt variations that should improve performance. Each variation should focus on a different improvement angle (hook, narrative, visual_style, or cta).`;
}
