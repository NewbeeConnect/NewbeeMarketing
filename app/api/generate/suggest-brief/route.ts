import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { PROJECT_SLUGS, type ProjectSlug } from "@/lib/projects";
import {
  getBrandProfile,
  profileAsPromptContext,
} from "@/lib/generate/brand-profiles";

/**
 * POST /api/generate/suggest-brief
 *
 * "Roll the dice" — given a project + target medium, Gemini 3 Pro picks ONE
 * product highlight / feature from the brand profile and writes a detailed
 * ad brief around it. The brief names the feature, explains the user
 * benefit, describes a specific scene, and suggests tone. The user can roll
 * again for a different angle, or edit what came back.
 *
 * The rich context lives in `lib/generate/brand-profiles.ts`. Update there
 * when the product evolves.
 */

const bodySchema = z.object({
  project: z.enum(PROJECT_SLUGS as [string, ...string[]]),
  target: z.enum(["image", "video", "pipeline"]),
  ratio: z.string().min(3).max(5),
  /**
   * Optional: name of a highlight the client wants to avoid this roll
   * (e.g. the one surfaced last time). Gemini is told to pick something
   * else so rolls don't feel repetitive.
   */
  avoidHighlight: z.string().optional(),
  /**
   * Optional: when the user is extending a prior video, we pass the previous
   * video's brief. Gemini writes the NEXT beat in the same story — same
   * characters, same setting, continuation of the action — rather than a
   * fresh unrelated brief.
   */
  extendFromBrief: z.string().max(2000).optional(),
});

const SYSTEM = `You are a senior creative director at an ad agency. A client
hands you a rich brand profile and a target medium, and you write ONE
concrete ad brief that the creative team can go run with.

How you write the brief:

1. Pick ONE highlight / feature from the HIGHLIGHTS list. Choose something
   concrete and visual. If an "avoid" hint is given, pick a different one.
2. Open with the HERO MOMENT — the single scene the ad revolves around.
   Be specific: who is in the frame, what they are doing, where they are,
   what they are feeling.
3. Name the HIGHLIGHT and the USER BENEFIT in plain language — what it is
   and why someone actually cares.
4. Describe the VISUAL + TONE — palette, lighting, pace, mood. Borrow
   from the profile's PALETTE and REFERENCE LOOK.
5. End with a SO WHAT — the message or feeling the viewer should walk
   away with.

Formatting rules:
- Output plain prose, 70–140 words, 3–5 sentences, one paragraph.
- NO headings, NO bullets, NO markdown, NO quotes around the output.
- NO preamble ("Here's a brief…"). Start with the hero moment.
- Match the MEDIUM:
  - "image"    → a single moment frozen in time. No camera movement words.
  - "video"    → imply motion across 4–8 seconds. Use verbs of movement.
  - "pipeline" → describe a key frame AND the motion it hands off to Veo.
- Stay on brand. Every detail (palette, ref look, tone) must match the profile.
- Do NOT reference "the user" or "the app" generically. Name the feature.

Your output IS the brief — it will be pasted straight into a textarea for the
team to either ship or edit.`;

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

    // Larger context + longer output than the one-sentence version.
    const estimatedCost =
      (1500 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_input +
      (200 / 1_000_000) * COST_ESTIMATES.gemini_pro_per_1m_output;
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
    const { project, target, ratio, avoidHighlight, extendFromBrief } =
      parsed.data;

    const profile = getBrandProfile(project as ProjectSlug);
    const profileContext = profileAsPromptContext(profile);

    const extendBlock = extendFromBrief
      ? `\nPREVIOUS BEAT (this is an EXTENSION — continue the same story with the SAME subject, setting, palette, and tone; Veo will continue from the prior clip's final frame, so the opening of this beat should visually follow naturally):\n${extendFromBrief.trim()}\n`
      : "";

    const userPrompt = `BRAND PROFILE:
${profileContext}

TARGET MEDIUM: ${target}
ASPECT RATIO: ${ratio}
${avoidHighlight ? `AVOID HIGHLIGHT (pick a different one): ${avoidHighlight}` : ""}
${extendBlock}

Write one on-brand ad brief${extendFromBrief ? " that continues the previous beat" : " that picks one highlight and spells it out"} per the rules.`;

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_PRO,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM,
        // Temperature high enough that consecutive rolls diverge, but not
        // so high that Gemini drifts off-brand.
        temperature: 1.0,
      },
    });

    const suggestion = (response.text ?? "")
      .trim()
      // Strip wrapping quotes if Gemini added them
      .replace(/^["'«]+/, "")
      .replace(/["'»]+$/, "")
      // Strip a leading markdown header if it slipped in
      .replace(/^#+\s+[^\n]+\n+/, "")
      .trim();

    if (!suggestion) {
      return NextResponse.json(
        { error: "Model returned empty suggestion" },
        { status: 500 }
      );
    }

    // Try to spot which highlight name appears in the output so the client
    // can pass it back as `avoidHighlight` on the next roll for variety.
    const pickedHighlight =
      profile.highlights.find((h) =>
        suggestion.toLowerCase().includes(h.name.toLowerCase())
      )?.name ?? null;

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

    return NextResponse.json({ suggestion, pickedHighlight });
  } catch (err) {
    console.error("[generate/suggest-brief] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggest-brief failed" },
      { status: 500 }
    );
  }
}
