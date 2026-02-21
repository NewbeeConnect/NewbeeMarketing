import { ai, MODELS } from "@/lib/google-ai";
import type { ScrapedContext } from "./url-scraper";

export type SummarizedContext = {
  companyName: string;
  productDescription: string;
  targetAudience: string;
  keyFeatures: string[];
  uniqueSellingPoints: string[];
  brandTone: string;
  techStack: string[];
};

const SUMMARIZE_PROMPT = `You are a marketing analyst. Given the raw scraped content from a website, extract and summarize the following marketing-relevant information in a structured JSON format.

Be concise but accurate. If a field cannot be determined from the content, use reasonable inferences from the available text.

Return valid JSON with this exact structure:
{
  "companyName": "The company or product name",
  "productDescription": "A 2-3 sentence description of what the product/company does",
  "targetAudience": "Who the product is for (1-2 sentences)",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "uniqueSellingPoints": ["USP 1", "USP 2"],
  "brandTone": "The perceived brand tone (e.g., professional, casual, innovative)",
  "techStack": ["Tech 1", "Tech 2"]
}`;

/**
 * Use Gemini Flash to summarize raw scraped content into structured marketing context.
 */
export async function summarizeContext(raw: ScrapedContext): Promise<SummarizedContext> {
  if (!ai) {
    // Fallback: return structured data from raw scrape without AI
    return {
      companyName: raw.title,
      productDescription: raw.description || raw.aboutUs || raw.rawText.slice(0, 300),
      targetAudience: "",
      keyFeatures: raw.features.slice(0, 5),
      uniqueSellingPoints: raw.usp.slice(0, 3),
      brandTone: "professional",
      techStack: raw.techStack,
    };
  }

  const userPrompt = `Here is the scraped content from a website:

**Title:** ${raw.title}
**Meta Description:** ${raw.description}
${raw.aboutUs ? `**About Section:**\n${raw.aboutUs}` : ""}
${raw.features.length > 0 ? `**Features Found:**\n${raw.features.map((f) => `- ${f}`).join("\n")}` : ""}
${raw.usp.length > 0 ? `**USP/Benefits Found:**\n${raw.usp.map((u) => `- ${u}`).join("\n")}` : ""}
${raw.techStack.length > 0 ? `**Tech Stack Detected:** ${raw.techStack.join(", ")}` : ""}

**Raw Page Text (first 2000 chars):**
${raw.rawText.slice(0, 2000)}

Please analyze this content and return the structured marketing context as JSON.`;

  const response = await ai.models.generateContent({
    model: MODELS.GEMINI_FLASH,
    contents: userPrompt,
    config: {
      systemInstruction: SUMMARIZE_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text ?? "";

  // Parse response - strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned) as SummarizedContext;
    return {
      companyName: parsed.companyName || raw.title,
      productDescription: parsed.productDescription || raw.description,
      targetAudience: parsed.targetAudience || "",
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : raw.features,
      uniqueSellingPoints: Array.isArray(parsed.uniqueSellingPoints) ? parsed.uniqueSellingPoints : raw.usp,
      brandTone: parsed.brandTone || "professional",
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : raw.techStack,
    };
  } catch {
    // Fallback if AI response isn't valid JSON
    return {
      companyName: raw.title,
      productDescription: raw.description || raw.rawText.slice(0, 300),
      targetAudience: "",
      keyFeatures: raw.features.slice(0, 5),
      uniqueSellingPoints: raw.usp.slice(0, 3),
      brandTone: "professional",
      techStack: raw.techStack,
    };
  }
}
