import { z } from "zod";

export const strategyResponseSchema = z.object({
  hook: z.string().min(1),
  narrative_arc: z.string().min(1),
  key_messages: z.array(z.string()).min(1).max(7),
  cta: z.string().min(1),
  recommended_duration: z.number().min(4).max(600),
  recommended_scenes: z.number().min(1).max(20),
  music_mood: z.string().min(1),
});

export type StrategyResponse = z.infer<typeof strategyResponseSchema>;

export const sceneItemSchema = z.object({
  scene_number: z.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  duration_seconds: z.number().refine((v) => [4, 6, 8].includes(v), {
    message: "Duration must be 4, 6, or 8 seconds",
  }),
  camera_movement: z.string().nullable().optional(),
  lighting: z.string().nullable().optional(),
  text_overlay: z.string().nullable().optional(),
  audio_type: z.enum(["native_veo", "tts_voiceover", "silent"]).default("native_veo"),
  voiceover_text: z.string().nullable().optional(),
  audio_description: z.string().nullable().optional(),
  dialogue_text: z.string().nullable().optional(),
  transition_hint: z.string().nullable().optional(),
  shot_type: z.string().nullable().optional(),
});

export const scenesResponseSchema = z.object({
  scenes: z.array(sceneItemSchema).min(1).max(20),
});

export type ScenesResponse = z.infer<typeof scenesResponseSchema>;

export const promptOptimizeResponseSchema = z.object({
  optimized_prompt: z.string().min(1),
  negative_prompt: z.string().min(1),
});

export type PromptOptimizeResponse = z.infer<typeof promptOptimizeResponseSchema>;

export const captionResponseSchema = z.object({
  srt_content: z.string().min(1),
});

export type CaptionResponse = z.infer<typeof captionResponseSchema>;

export const refineResponseSchema = z.object({
  updated_content: z.record(z.string(), z.unknown()),
  explanation: z.string(),
});

export type RefineResponse = z.infer<typeof refineResponseSchema>;

// A/B Strategy schemas
const strategyWithPersonaSchema = strategyResponseSchema.extend({
  persona_type: z.enum(["emotional", "technical"]),
  persona_description: z.string().min(1),
});

export const abStrategyResponseSchema = z.object({
  version_a: strategyWithPersonaSchema,
  version_b: strategyWithPersonaSchema,
});

export type AbStrategyResponse = z.infer<typeof abStrategyResponseSchema>;
export type StrategyWithPersona = z.infer<typeof strategyWithPersonaSchema>;

/**
 * Parse AI response that might contain JSON wrapped in markdown code blocks
 * or mixed with explanatory text.
 */
export function parseAiJson<T>(text: string, schema: z.ZodType<T>): T {
  let cleaned = text.trim();

  // 1) Strip markdown code blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // 2) Try direct parse first
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  } catch {
    // continue to fallback strategies
  }

  // 3) Extract JSON from markdown code block anywhere in the text
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      parsed = JSON.parse(codeBlockMatch[1].trim());
      return schema.parse(parsed);
    } catch {
      // continue
    }
  }

  // 4) Find matching { ... } or [ ... ] block using bracket depth tracking
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const startIdx =
    firstBrace === -1 ? firstBracket :
    firstBracket === -1 ? firstBrace :
    Math.min(firstBrace, firstBracket);

  if (startIdx !== -1) {
    const openChar = cleaned[startIdx];
    const closeChar = openChar === "{" ? "}" : "]";
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      if (cleaned[i] === openChar) depth++;
      else if (cleaned[i] === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx > startIdx) {
      try {
        parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        return schema.parse(parsed);
      } catch {
        // continue
      }
    }
  }

  throw new Error(
    `AI response is not valid JSON. First 200 chars: ${cleaned.substring(0, 200)}`
  );
}
