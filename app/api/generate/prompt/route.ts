import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { PROJECT_SLUGS, type ProjectSlug } from "@/lib/projects";
import { getBrandProfile } from "@/lib/generate/brand-profiles";

/**
 * POST /api/generate/prompt
 *
 * Turn a short human brief into a STRUCTURED prompt blueprint whose fields map
 * 1:1 to what Nano Banana 2 / Veo 3.1 need for best-quality output. We never
 * ask the user for a raw prompt — the form asks for the fields the model
 * needs, and Gemini 3 Pro fills them from a brief. The user can edit any
 * field; the client composes the final prompt string from the edited fields.
 */

const bodySchema = z.object({
  project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
  target: z.enum(["image", "video"]),
  ratio: z.string().min(3).max(5),
  brief: z.string().min(3).max(1000),
});

// Fields map to Nano Banana 2 best-practice prompt structure.
const imageFieldsSchema = z.object({
  subject: z.string().min(3),
  style: z.string().min(3),
  composition: z.string().min(3),
  lighting: z.string().min(3),
  mood: z.string().min(3),
  technical: z.string().min(3),
});

// Fields map to Veo 3.1 best-practice prompt structure.
const videoFieldsSchema = z.object({
  subject: z.string().min(3),
  camera: z.string().min(3),
  action: z.string().min(3),
  lighting: z.string().min(3),
  mood: z.string().min(3),
  audio: z.string().min(3),
});

const SYSTEM_IMAGE = `You fill the structured prompt blueprint for Nano Banana
2 (Google's top image model). Given a short brief, produce JSON that fills
EVERY field with a specific, dense, visual answer. Each field is one phrase
or short sentence. No hedging, no "optional", no empty strings.

Fields:
- subject: the literal thing being shown (who/what, what they're doing)
- style: the visual genre / photography tradition (e.g. "editorial fashion
  photography", "cinematic dark-academia", "minimal product catalogue")
- composition: shot type, framing, angle, focal length (e.g. "macro
  close-up, 45° high angle, 85mm equivalent, centered")
- lighting: light source direction + color + quality (e.g. "soft rim light
  from left, warm golden highlights, diffused shadows")
- mood: emotional tone + palette (e.g. "elegant, timeless, luxurious,
  champagne-gold palette")
- technical: focus, depth of field, grain, sharpness cues

Respond with valid JSON only — no markdown fences, no prose.`;

const SYSTEM_VIDEO = `You fill the structured prompt blueprint for Veo 3.1
(Google's top video model). Given a short brief, produce JSON that fills
EVERY field with a specific, kinetic, visual answer. Each field is one phrase
or short sentence. No hedging, no empty strings.

Fields:
- subject: who/what appears in the opening frame + initial composition
- camera: specific camera movement (e.g. "slow dolly-in from 3m to 1m,
  then 15° orbit right", "static locked-off", "handheld follow")
- action: what changes during the clip — gestures, props, environment
- lighting: direction + color + quality + how it evolves if at all
- mood: emotional tone + palette + cinematic reference
- audio: Veo will generate audio; describe what to synthesize (e.g.
  "ambient room tone + gentle piano melody", "silent", "urban traffic
  with distant laughter")

Respond with valid JSON only — no markdown fences, no prose.`;

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

    const estimatedCost =
      (500 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_input +
      (300 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_output;
    const budget = await checkBudget(serviceClient, user.id, estimatedCost);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { project, target, ratio, brief } = parsed.data;

    const profile = getBrandProfile(project as ProjectSlug);
    const systemPrompt = target === "image" ? SYSTEM_IMAGE : SYSTEM_VIDEO;
    const fieldsSchema =
      target === "image" ? imageFieldsSchema : videoFieldsSchema;

    // Pass brand voice + palette + reference look so the blueprint lands
    // on-brand even if the user's brief is sparse.
    const userPrompt = `PROJECT: ${profile.product}
VALUE PROPOSITION: ${profile.valueProp}
TONE: ${profile.tone}
PALETTE: ${profile.palette}
REFERENCE LOOK: ${profile.referenceLook}

Target medium: ${target}
Aspect ratio: ${ratio}

Brief:
${brief.trim()}`;

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    });

    const rawText = (response.text ?? "").trim();
    let fields: z.infer<typeof fieldsSchema>;
    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const parsedJson = JSON.parse(cleaned);
      fields = fieldsSchema.parse(parsedJson);
    } catch (parseErr) {
      console.error("[generate/prompt] parse error:", parseErr, "raw:", rawText.slice(0, 400));
      return NextResponse.json(
        { error: "Model returned malformed structured output" },
        { status: 502 }
      );
    }

    const inputTokens = Math.ceil(
      (systemPrompt.length + userPrompt.length) / 4
    );
    const outputTokens = Math.ceil(rawText.length / 4);
    const actualCost =
      (inputTokens / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_input +
      (outputTokens / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_output;

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini",
      model: MODELS.GEMINI_PRO,
      operation: "prompt_blueprint",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: actualCost,
    });

    return NextResponse.json({ fields, estimatedCost: actualCost });
  } catch (err) {
    console.error("[generate/prompt] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prompt generation failed" },
      { status: 500 }
    );
  }
}

/**
 * Client helper — assemble structured fields into a single dense prompt
 * string. Exported shape matches what Nano Banana 2 / Veo 3.1 expect.
 */
export type ImagePromptFields = z.infer<typeof imageFieldsSchema>;
export type VideoPromptFields = z.infer<typeof videoFieldsSchema>;
