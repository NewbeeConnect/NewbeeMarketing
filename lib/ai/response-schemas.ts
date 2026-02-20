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

/**
 * Parse AI response that might contain JSON wrapped in markdown code blocks
 */
export function parseAiJson<T>(text: string, schema: z.ZodType<T>): T {
  // Strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);
  return schema.parse(parsed);
}
