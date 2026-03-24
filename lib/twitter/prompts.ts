/**
 * AI Tweet Generation Prompts for Newbee Marketing
 *
 * Uses Gemini Flash for cost-efficient tweet generation.
 * Content categories aligned with the guerrilla marketing plan.
 */

export type TweetCategory =
  | "value_content"      // Tips, guides, how-tos for expats
  | "community_story"    // User stories, testimonials
  | "engagement"         // Polls, questions, discussions
  | "product_cta"        // App features, download CTA
  | "trend_hack"         // Trending topic + expat angle
  | "did_you_know"       // Surprising facts about immigration
  | "thread_guide"       // Multi-tweet educational thread
  | "motivation";        // Inspirational quotes for expats

export type TweetLanguage = "en" | "tr" | "de";

export interface TweetGenerationInput {
  category: TweetCategory;
  language: TweetLanguage;
  topic?: string;
  context?: string;
  threadLength?: number; // for thread_guide category
}

const CATEGORY_DESCRIPTIONS: Record<TweetCategory, string> = {
  value_content: "Practical tips and how-to information for immigrants and expats in Germany/Europe. Focus on bureaucracy, housing, jobs, language, integration.",
  community_story: "A fictional but realistic story of an immigrant's journey. Make it relatable, emotional, and end with a community message.",
  engagement: "A question, poll idea, or discussion starter that gets expats talking. Controversial but safe topics about immigrant life.",
  product_cta: "Highlight a specific Newbee app feature (events, expert Q&A, communities, networking). Include a clear call-to-action.",
  trend_hack: "Connect a current trending topic to the immigrant/expat experience. Be witty, relevant, and timely.",
  did_you_know: "A surprising statistic or fact about immigration, expat life, or Germany that makes people stop scrolling and share.",
  thread_guide: "An educational thread (multi-tweet) about a specific immigration topic. Each tweet should be self-contained but flow as a narrative.",
  motivation: "An inspirational message for people who have moved to a new country. Acknowledge the difficulty, celebrate the courage.",
};

const LANGUAGE_INSTRUCTIONS: Record<TweetLanguage, string> = {
  en: "Write in English. Use casual, approachable tone. This reaches the widest expat audience.",
  tr: "Write in Turkish (Türkçe). Use warm, community-oriented tone. Target: Turkish diaspora in Germany/Europe.",
  de: "Write in German (Deutsch). Use friendly, inclusive tone. Target: German-speaking locals and integrated expats.",
};

export function buildTweetPrompt(input: TweetGenerationInput): string {
  const { category, language, topic, context, threadLength } = input;

  const isThread = category === "thread_guide";
  const tweetCount = isThread ? (threadLength ?? 5) : 1;
  const charLimit = 280; // Standard limit, Premium allows 4000 but shorter tweets perform better

  return `You are a social media expert for Newbee, a mobile community platform for immigrants and expats.
Newbee connects newcomers with each other, local events, and domain experts (visa, housing, jobs, language).
Available on iOS, Android, and web at app.newbeeapp.com.

${LANGUAGE_INSTRUCTIONS[language]}

CONTENT CATEGORY: ${category}
${CATEGORY_DESCRIPTIONS[category]}

${topic ? `SPECIFIC TOPIC: ${topic}` : ""}
${context ? `ADDITIONAL CONTEXT: ${context}` : ""}

RULES:
- Generate exactly ${tweetCount} tweet(s)
- Each tweet MUST be under ${charLimit} characters (this is critical)
- Use 1-3 relevant hashtags per tweet (count them in the character limit)
- Use emojis sparingly but effectively (1-3 per tweet)
- Do NOT use generic phrases like "Did you know?" as the opening for every tweet
- Vary sentence structure and opening hooks
- Sound human, not corporate. No buzzwords.
- For threads: number each tweet (1/, 2/, etc.) and make each one independently valuable
- NEVER mention competitors by name
${category === "product_cta" ? "- Include the app link: app.newbeeapp.com" : ""}
${category === "engagement" ? "- End with a clear question or call for responses" : ""}
${category === "community_story" ? '- Use a first-person narrative style: "When I first moved to..."' : ""}

RESPOND WITH ONLY the tweet text(s), nothing else. If multiple tweets, separate them with ---
Do not add any explanation, labels, or metadata.`;
}
