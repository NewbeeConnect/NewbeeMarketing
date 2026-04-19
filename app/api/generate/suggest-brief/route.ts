import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { PROJECTS, PROJECT_SLUGS } from "@/lib/projects";

/**
 * POST /api/generate/suggest-brief
 *
 * "Roll the dice" — given a project + target medium, suggests a single ad
 * brief the user can drop into the Brief field. Gemini 3 Pro uses the
 * project's brand description (defined in `lib/projects.ts`) so every
 * suggestion is actually on-brand.
 *
 * Output is a single sentence (~10-25 words). Temperature is high so
 * consecutive rolls produce different angles.
 */

const bodySchema = z.object({
  project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
  target: z.enum(["image", "video", "pipeline"]),
  ratio: z.string().min(3).max(5),
});

const SYSTEM = `You are a senior creative director ideating ad concepts.
Given a brand description and a target medium, output ONE specific, concrete
ad brief of 10-25 words the user can run with.

Rules:
- ONE sentence. No preamble. No quotes. No markdown. No list.
- Concrete: name a scene, a feeling, a product moment.
- Vary angle — product hero, lifestyle vignette, user-reaction cut, app-in-use,
  brand-world establishing shot, testimonial freeze, etc. Pick ONE for this call.
- Match the medium: "image" = a single still moment; "video" = a dynamic
  shot with motion; "pipeline" = a key frame that can become a 4-8s clip.
- Stay on brand (palette, tone, audience from the description).`;

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
      (400 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_input +
      (60 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_output;
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
    const { project, target, ratio } = parsed.data;

    const projectMeta = PROJECTS.find((p) => p.slug === project)!;

    const userPrompt = `Brand description:
${projectMeta.description}

Target medium: ${target}
Aspect ratio: ${ratio}

Suggest one on-brand ad brief for this medium.`;

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM,
        // Max randomness — every "roll" should feel different
        temperature: 1.1,
      },
    });

    const suggestion = (response.text ?? "")
      .trim()
      // Strip stray quotes if the model wraps the brief in them
      .replace(/^["'«]/, "")
      .replace(/["'»]$/, "")
      .trim();

    if (!suggestion) {
      return NextResponse.json(
        { error: "Model returned empty suggestion" },
        { status: 500 }
      );
    }

    const inputTokens = Math.ceil((SYSTEM.length + userPrompt.length) / 4);
    const outputTokens = Math.ceil(suggestion.length / 4);
    const actualCost =
      (inputTokens / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_input +
      (outputTokens / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_output;

    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini",
      model: MODELS.GEMINI_PRO,
      operation: "suggest_brief",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: actualCost,
    });

    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("[generate/suggest-brief] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggest-brief failed" },
      { status: 500 }
    );
  }
}
