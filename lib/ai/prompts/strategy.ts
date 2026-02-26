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

## A/B Testing Mode
When A/B testing is requested, generate TWO distinct strategies:
- **Version A (Emotional/Story-driven)**: Focus on viewer's emotions, use personal storytelling, problem-empathy-solution arc, relatable characters, and emotional triggers. The hook should create an emotional connection.
- **Version B (Technical/Benefit-driven)**: Focus on features, data points, social proof, concrete benefits. The hook should present a compelling statistic or feature. Use "feature → proof → result" structure.

## Performance-Driven Optimization
When previous campaign performance data is provided, use it to inform your strategy:
- If one approach (emotional vs technical) clearly outperformed, lean into the winning style
- Reference specific metrics to justify your creative direction
- Suggest improvements based on what worked and what didn't

## Rules
- Always consider the target platform's best practices and audience behavior
- Adapt the strategy to the selected style and tone
- If brand guidelines are provided, ensure every element aligns with them
- Use provided platform data/insights to strengthen the strategy with real numbers
- If external product context is provided, use it to create more specific and accurate strategies
- If app codebase analysis is provided, leverage it to reference actual features, screens, and user flows accurately in the strategy
- Keep strategies actionable and specific - avoid generic advice
- Think about the viewer's emotional journey through the video
- For multi-platform strategies, note key differences between platform versions

## Response Format
Always respond with valid JSON matching the requested schema. Do not include markdown code blocks or any text outside the JSON.`;

export type StrategyPromptParams = {
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
  externalContext?: string;
  performanceContext?: string;
  codeContext?: string;
};

function buildBriefSection(params: StrategyPromptParams): string {
  const platformList = params.targetPlatforms.join(", ");
  const languageList = params.languages.join(", ");

  return `## Product/Feature
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
${params.externalContext || ""}
${params.performanceContext || ""}
${params.codeContext || ""}`;
}

export function buildStrategyUserPrompt(params: StrategyPromptParams): string {
  return `Create a marketing video strategy for the following brief:

${buildBriefSection(params)}

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

export function buildAbStrategyUserPrompt(params: StrategyPromptParams): string {
  return `Create TWO distinct A/B marketing video strategies for the following brief:

${buildBriefSection(params)}

Generate TWO strategies as JSON with this exact structure:
{
  "version_a": {
    "persona_type": "emotional",
    "persona_description": "Brief description of the Emotional/Story-driven approach",
    "hook": "The emotional, story-driven opening",
    "narrative_arc": "Story-driven flow: problem → empathy → solution → transformation",
    "key_messages": ["message 1", "message 2", "message 3"],
    "cta": "Emotionally compelling call to action",
    "recommended_duration": 30,
    "recommended_scenes": 5,
    "music_mood": "Emotional audio mood"
  },
  "version_b": {
    "persona_type": "technical",
    "persona_description": "Brief description of the Technical/Benefit-driven approach",
    "hook": "The data-driven, benefit-focused opening",
    "narrative_arc": "Benefit-driven flow: feature → proof → result → action",
    "key_messages": ["message 1", "message 2", "message 3"],
    "cta": "Clear, benefit-driven call to action",
    "recommended_duration": 30,
    "recommended_scenes": 5,
    "music_mood": "Professional audio mood"
  }
}

IMPORTANT: Both versions MUST address the same product/audience but use completely different emotional approaches. Version A tells a STORY, Version B sells FEATURES.`;
}
