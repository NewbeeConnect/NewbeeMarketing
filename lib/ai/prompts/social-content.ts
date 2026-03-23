/**
 * Social Content Generation Prompts
 *
 * Dynamic prompt builders for generating social media content.
 * Integrates brand context, platform constraints, few-shot examples,
 * trend data, and performance insights.
 */

import type { BrandKit } from "@/types/database";
import { PLATFORM_CONSTRAINTS, type SocialPlatform, type ContentFormat } from "@/lib/social/types";

interface SocialContentPromptParams {
  brandKit: BrandKit | null;
  platform: SocialPlatform;
  format: ContentFormat;
  productName: string;
  productDescription: string;
  targetAudience?: string;
  tone?: string;
  style?: string;
  trendContext?: string;
  topPerformingExamples?: Array<{ text: string; engagement: number }>;
  performanceInsights?: string;
  language?: string;
}

export function buildSocialContentPrompt(params: SocialContentPromptParams): string {
  const constraints = PLATFORM_CONSTRAINTS[params.platform];

  const sections: string[] = [];

  // System context
  sections.push(`You are an expert social media content creator for ${params.platform}.
Generate a ${params.format} post that will maximize engagement.`);

  // Brand context
  if (params.brandKit) {
    sections.push(`## Brand
- Name: ${params.brandKit.name}
- Voice: ${params.brandKit.brand_voice ?? "professional yet approachable"}
- Colors: ${params.brandKit.colors ? JSON.stringify(params.brandKit.colors) : "not specified"}`);
  }

  // Product info
  sections.push(`## Product
- Name: ${params.productName}
- Description: ${params.productDescription}
- Target Audience: ${params.targetAudience ?? "general"}
- Tone: ${params.tone ?? "energetic"}
- Style: ${params.style ?? "modern"}`);

  // Platform constraints
  sections.push(`## Platform Rules (${params.platform})
- Max caption: ${constraints.maxCaptionLength} characters
- Max hashtags: ${constraints.maxHashtags ?? "unlimited"}
- Format: ${params.format}
- Media: ${constraints.supportedMediaTypes.join(", ")}
- Aspect ratio: ${constraints.supportedAspectRatios.join(", ")}`);

  // Trend integration
  if (params.trendContext) {
    sections.push(`## Trending Context
Incorporate this trend naturally: ${params.trendContext}`);
  }

  // Few-shot examples from top performers
  if (params.topPerformingExamples && params.topPerformingExamples.length > 0) {
    const examples = params.topPerformingExamples
      .slice(0, 3)
      .map((e, i) => `${i + 1}. (${(e.engagement * 100).toFixed(1)}% engagement) "${e.text.slice(0, 200)}"`)
      .join("\n");
    sections.push(`## Top Performing Examples (learn from these patterns)
${examples}`);
  }

  // Performance insights
  if (params.performanceInsights) {
    sections.push(`## Performance Insights
${params.performanceInsights}`);
  }

  // Output format
  sections.push(`## Output
Return JSON:
{
  "text": "the caption/post text (respect character limit)",
  "hashtags": ["#relevant", "#hashtags"],
  "hook": "first line that grabs attention",
  "cta": "call to action",
  "media_prompt": "description for AI video/image generation (Veo 3.1 / Imagen 4)",
  "media_type": "video" or "image",
  "suggested_posting_time": "HH:MM UTC"
}

${params.language ? `Write in ${params.language}.` : "Write in English."}`);

  return sections.join("\n\n");
}

export function buildVariantPrompt(params: SocialContentPromptParams & {
  variantType: "emotional" | "technical" | "trending";
  baseContent?: string;
}): string {
  const base = buildSocialContentPrompt(params);

  const variantGuide = {
    emotional: "Focus on emotions, storytelling, personal connection. Use power words that evoke feelings. Lead with a relatable pain point or aspiration.",
    technical: "Focus on features, data, capabilities. Use specific numbers and comparisons. Lead with a surprising statistic or achievement.",
    trending: "Adapt the content to match current trending formats and language. Use trending sounds/effects references. Make it feel native to the platform's current culture.",
  };

  return `${base}

## Variant Style: ${params.variantType.toUpperCase()}
${variantGuide[params.variantType]}

${params.baseContent ? `## Base Content (create a variant of this)
${params.baseContent}` : ""}`;
}
