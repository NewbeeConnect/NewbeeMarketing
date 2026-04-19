import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { parseAiJson } from "@/lib/ai/response-schemas";
import {
  STORY_SCRIPT_SYSTEM_PROMPT,
  buildStoryScriptUserPrompt,
  storyScriptSchema,
} from "@/lib/ai/prompts/story-script";

const createSchema = z.object({
  topic: z.string().min(3).max(1000),
  aspect_ratio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  duration_per_clip_seconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8),
  model_tier: z.enum(["fast", "standard"]).default("standard"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "ai-gemini");
    if (!rl.allowed) return rateLimitResponse(rl);

    const budget = await checkBudget(serviceClient, user.id);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { topic, aspect_ratio, duration_per_clip_seconds, model_tier } = parsed.data;

    const userPrompt = buildStoryScriptUserPrompt({
      topic,
      aspectRatio: aspect_ratio,
      durationPerClip: duration_per_clip_seconds,
    });

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: userPrompt,
      config: {
        systemInstruction: STORY_SCRIPT_SYSTEM_PROMPT,
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const script = parseAiJson(text, storyScriptSchema);

    const scriptMap: Record<string, string> = {};
    script.scenes.forEach((s) => (scriptMap[String(s.index)] = s.prompt));

    const frameMap: Record<string, string> = {};
    script.frames.forEach((f) => (frameMap[String(f.index)] = f.description));

    const { data: storyRow, error: insertError } = await serviceClient
      .from("mkt_stories")
      .insert({
        user_id: user.id,
        topic,
        aspect_ratio,
        duration_per_clip_seconds,
        model_tier,
        style_anchor: script.style_anchor,
        scene_scripts: scriptMap,
        frame_prompts: frameMap,
        status: "draft",
      })
      .select()
      .single();

    if (insertError || !storyRow) {
      console.error("[stories] insert error:", insertError);
      return NextResponse.json({ error: "Failed to save story" }, { status: 500 });
    }

    // Log usage BEFORE responding. If the log fails, we still return the story —
    // but we surface the failure in logs so budget accounting doesn't silently
    // drift (the Gemini cost has been incurred regardless).
    const inputTokens = Math.ceil((STORY_SCRIPT_SYSTEM_PROMPT.length + userPrompt.length) / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const { error: usageLogError } = await serviceClient
      .from("mkt_usage_logs")
      .insert({
        user_id: user.id,
        api_service: "gemini",
        model: MODELS.GEMINI_FLASH,
        operation: "story_script",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd:
          (inputTokens / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_input +
          (outputTokens / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_output,
      });

    if (usageLogError) {
      console.error(
        "[stories] usage_logs insert failed — budget tracking drift risk:",
        usageLogError,
        "user:",
        user.id,
        "story:",
        storyRow.id
      );
    }

    return NextResponse.json({ story: storyRow, script });
  } catch (error) {
    console.error("[stories POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create story" },
      { status: 500 }
    );
  }
}
