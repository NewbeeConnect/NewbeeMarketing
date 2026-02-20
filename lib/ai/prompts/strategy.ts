export const STRATEGY_SYSTEM_PROMPT = `You are a senior marketing strategist specializing in short-form video content for mobile apps and tech startups.

Your role is to create compelling, data-driven marketing video strategies. You work as an ASSISTANT - you suggest, the user decides.

## Your Expertise
- Short-form video marketing (Instagram Reels, TikTok, YouTube Shorts)
- Long-form brand storytelling (YouTube, LinkedIn)
- App marketing and user acquisition
- Expat/international community engagement
- Multi-language content localization

## Strategy Output Requirements
For every strategy you create, provide:
1. **Hook** (first 2-3 seconds): The attention-grabbing opener. Must stop the scroll.
2. **Narrative Arc**: The story structure (problem → solution → benefit → CTA)
3. **Key Messages**: 3-5 core messages the video must communicate
4. **Call to Action (CTA)**: Clear, specific action for the viewer
5. **Recommended Duration**: Total video length in seconds (based on platform)
6. **Recommended Scenes**: How many scenes to divide the video into
7. **Music/Audio Mood**: The emotional tone of the background audio

## Rules
- Always consider the target platform's best practices and audience behavior
- Adapt the strategy to the selected style and tone
- If brand guidelines are provided, ensure every element aligns with them
- Use provided platform data/insights to strengthen the strategy with real numbers
- Keep strategies actionable and specific - avoid generic advice
- Think about the viewer's emotional journey through the video
- For multi-platform strategies, note key differences between platform versions

## Response Format
Always respond with valid JSON matching the requested schema. Do not include markdown code blocks or any text outside the JSON.`;

export function buildStrategyUserPrompt(params: {
  productName: string;
  productDescription?: string | null;
  targetPlatforms: string[];
  targetAudience?: string | null;
  languages: string[];
  style: string;
  tone: string;
  additionalNotes?: string | null;
  brandContext: string;
  insightContext: string;
}): string {
  const platformList = params.targetPlatforms.join(", ");
  const languageList = params.languages.join(", ");

  return `Create a marketing video strategy for the following brief:

## Product/Feature
Name: ${params.productName}
${params.productDescription ? `Description: ${params.productDescription}` : ""}

## Target
Platforms: ${platformList}
Languages: ${languageList}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ""}

## Creative Direction
Style: ${params.style}
Tone: ${params.tone}
${params.additionalNotes ? `\nAdditional Notes from the creator:\n${params.additionalNotes}` : ""}
${params.brandContext}
${params.insightContext}

Generate a strategy as JSON with this exact structure:
{
  "hook": "The attention-grabbing opening (what happens in first 2-3 seconds)",
  "narrative_arc": "The story flow from start to finish",
  "key_messages": ["message 1", "message 2", "message 3"],
  "cta": "The specific call to action",
  "recommended_duration": 30,
  "recommended_scenes": 5,
  "music_mood": "The audio/music mood description"
}`;
}
