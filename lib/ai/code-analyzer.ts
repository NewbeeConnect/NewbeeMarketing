import { ai, MODELS } from "@/lib/google-ai";
import type { CodeAnalysis } from "@/types/database";
import { z } from "zod";
import { parseAiJson } from "@/lib/ai/response-schemas";

const CODE_ANALYSIS_SYSTEM_PROMPT = `You are an app marketing analyst. Given a codebase summary (file tree, key files, dependencies), extract marketing-relevant information.

Focus on understanding the PRODUCT from its code — what the app does, who uses it, key screens/features, visual patterns, and potential marketing angles. You are NOT doing a code review.

## What to Extract
1. **appName**: The name of the application
2. **appType**: One of: mobile_app, web_app, saas, api, desktop_app, browser_extension
3. **techStack**: Major technologies used (React, Next.js, Flutter, etc.)
4. **mainFeatures**: Core features the app offers to users (not implementation details)
5. **keyScreens**: Main screens/pages a user would see (Home, Profile, Search, etc.)
6. **uiComponents**: Visual design patterns used (tab navigation, card grid, map view, etc.)
7. **userFlows**: Key user journeys (signup → profile → explore, etc.)
8. **marketingAngles**: Suggested marketing angles based on what makes this app special
9. **targetPlatforms**: Where the app runs (iOS, Android, Web, etc.)
10. **monetization**: How the app makes money (freemium, subscription, ads, free, etc.)

## Rules
- Focus on USER-FACING features, not internal architecture
- For marketing angles, think about what would appeal to potential users
- Keep descriptions concise and actionable
- If you can't determine something, use an empty array or "unknown"

## Response Format
Always respond with valid JSON. Do not include markdown code blocks.`;

const codeAnalysisSchema = z.object({
  appName: z.string().min(1),
  appType: z.string().min(1),
  techStack: z.array(z.string()),
  mainFeatures: z.array(z.string()),
  keyScreens: z.array(z.string()),
  uiComponents: z.array(z.string()),
  userFlows: z.array(z.string()),
  marketingAngles: z.array(z.string()),
  targetPlatforms: z.array(z.string()),
  monetization: z.string(),
});

// Max characters to send to Gemini (roughly 50K tokens)
const MAX_INPUT_CHARS = 200_000;

/**
 * Analyze a codebase summary text using Gemini Flash.
 * Returns structured CodeAnalysis for marketing context injection.
 */
export async function analyzeCodeContext(rawText: string): Promise<{
  analysis: CodeAnalysis;
  tokenCount: number;
  fileTree: string | null;
}> {
  if (!ai) {
    throw new Error("Google AI not configured");
  }

  // Truncate input if necessary
  const truncated = rawText.length > MAX_INPUT_CHARS
    ? rawText.slice(0, MAX_INPUT_CHARS) + "\n\n[TRUNCATED — file too large, only first portion analyzed]"
    : rawText;

  // Extract file tree section if present (common in Repomix output)
  let fileTree: string | null = null;
  const treeMatch = truncated.match(/(?:File Tree|Directory Structure|Project Structure)[\s:]*\n([\s\S]*?)(?=\n\n|\n[A-Z])/i);
  if (treeMatch) {
    fileTree = treeMatch[1].trim().slice(0, 5000);
  }

  const userPrompt = `Analyze the following codebase summary and extract marketing-relevant information as JSON:

${truncated}

Respond with a JSON object matching this structure:
{
  "appName": "App Name",
  "appType": "mobile_app",
  "techStack": ["React", "TypeScript"],
  "mainFeatures": ["Feature 1", "Feature 2"],
  "keyScreens": ["Home", "Profile"],
  "uiComponents": ["Tab navigation", "Card grid"],
  "userFlows": ["Signup → Profile → Explore"],
  "marketingAngles": ["Angle 1", "Angle 2"],
  "targetPlatforms": ["iOS", "Android"],
  "monetization": "freemium"
}`;

  const response = await ai.models.generateContent({
    model: MODELS.GEMINI_FLASH,
    contents: userPrompt,
    config: {
      systemInstruction: CODE_ANALYSIS_SYSTEM_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const analysis = parseAiJson(text, codeAnalysisSchema) as CodeAnalysis;
  const tokenCount = response.usageMetadata?.promptTokenCount ?? 0;

  return { analysis, tokenCount, fileTree };
}
