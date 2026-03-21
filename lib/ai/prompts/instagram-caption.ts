/**
 * Instagram Caption & Hashtag Generator
 *
 * Generates captions, hashtags, and first comments
 * optimized for Instagram ad formats.
 */

export const INSTAGRAM_CAPTION_SYSTEM_PROMPT = `You are an Instagram content specialist who creates high-converting ad captions.

## Rules
- Feed captions: max 2200 characters, but front-load the first 125 chars (visible before "more")
- Stories/Reels: shorter, more action-oriented
- Use emojis strategically (not excessively)
- Include a clear CTA
- Hashtags: 20-30 relevant, mix of popular and niche
- First comment: additional hashtags to keep caption clean

## Output Requirements

Respond ONLY with a valid JSON object:

{
  "caption": "<main caption text>",
  "hashtags": ["tag1", "tag2", ...],
  "first_comment": "<additional hashtags and engagement prompt>",
  "cta_text": "<call to action text>"
}`;

export interface InstagramCaptionInput {
  productName: string;
  productDescription: string;
  videoDescription: string;
  targetAudience: string;
  tone: "professional" | "casual" | "playful" | "urgent" | "inspirational";
  placement: "feed" | "story" | "reels";
  language: string;
  ctaType?: string;
}

export function buildInstagramCaptionPrompt(
  input: InstagramCaptionInput
): string {
  const {
    productName,
    productDescription,
    videoDescription,
    targetAudience,
    tone,
    placement,
    language,
    ctaType,
  } = input;

  return `## Product
Name: ${productName}
Description: ${productDescription}

## Creative
Video/Image description: ${videoDescription}
Placement: Instagram ${placement}

## Audience & Tone
Target: ${targetAudience}
Tone: ${tone}
Language: ${language}
${ctaType ? `CTA type: ${ctaType}` : ""}

Write an Instagram ${placement} caption that drives engagement and conversions. The caption language must be ${language}.`;
}
