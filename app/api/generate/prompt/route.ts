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
  /**
   * Partial-regenerate mode. When `regenerateFields` is non-empty, Gemini
   * regenerates ONLY those fields; the others are preserved (they still get
   * sent as context so the regenerated fields fit the whole blueprint).
   *
   * Omit both to generate a brand-new blueprint from the brief.
   */
  existingFields: z.record(z.string(), z.string()).optional(),
  regenerateFields: z.array(z.string()).max(8).optional(),
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
// `negativePrompt` (optional) lets the planner stack stability + artifact
// exclusions Veo should avoid — Google's guide recommends positive-framed
// noun/adjective lists ("no vehicles" → "empty street, unpopulated").
const videoFieldsSchema = z.object({
  subject: z.string().min(3),
  camera: z.string().min(3),
  action: z.string().min(3),
  lighting: z.string().min(3),
  mood: z.string().min(3),
  audio: z.string().min(3),
  negativePrompt: z.string().optional().default(""),
});

const SYSTEM_IMAGE = `You fill the structured prompt blueprint for Nano Banana
2 / Gemini 3 Pro Image (Google's top image model). Given a short brief,
produce JSON that fills EVERY field with a specific, dense, visual answer.

GOOGLE'S OFFICIAL GUIDANCE for this model (internalize these rules):
1. "Describe the scene, don't just list keywords" — each field is a
   narrative fragment, not a tag dump.
2. POSITIVE-ONLY framing. This model has no negativePrompt channel; never
   write "no X" / "without Y". If you need to exclude, phrase positively
   ("empty street", "unbranded packaging", "clean minimalist backdrop").
3. Name the subject with a specific noun phrase that can be reused verbatim
   across later generations (same brand, same product, same character).
4. Composition MUST include shot type + camera distance + framing + focal
   length when relevant (e.g. "macro close-up, 85mm equivalent, center-framed,
   low-angle product hero").
5. Lighting MUST name the light source, its direction, its color temperature
   and quality (e.g. "soft north-window light from frame-left, 4500K,
   diffused shadows, subtle warm bounce from right").
6. If the intent mentions a phone/screen/UI: Nano Banana can hallucinate
   fake UI elements. Use wording like "real UI, legible app chrome" and
   mention that any icons/text shown must be the actual product, not invented.

Fields (each is one short sentence, dense, concrete):
- subject: the literal thing being shown (who/what + what they're doing,
  with a reusable noun phrase for the hero). Include aspect-aware framing
  cues ("centered vertical composition" for 9:16, "letterboxed wide shot"
  for 16:9).
- style: visual genre + photographic tradition + film/lens feel
  (e.g. "editorial fashion photography, analog Fujifilm grain,
  cinematic color grade").
- composition: shot type, framing, angle, focal length, rule-of-thirds
  placement (e.g. "medium close-up, 50mm, subject on right-third,
  negative space left").
- lighting: source + direction + color + quality + shadow behavior.
- mood: emotional tone + palette (3-4 hex-nameable colors if possible).
- technical: focus, depth of field, lens/film stock, grain, sharpness cues.

Respond with valid JSON only — no markdown fences, no prose.`;

const SYSTEM_VIDEO = `You fill the structured prompt blueprint for Veo 3.1
(Google's top video model). Given a short brief, produce JSON that fills
EVERY field with a specific, kinetic, visual answer.

GOOGLE'S OFFICIAL STRUCTURE for Veo 3.1 is five parts:
  [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
You are splitting this across the 6 fields below (plus a dedicated
negativePrompt). Write each field as a crisp, Veo-friendly sentence
using the canonical camera vocabulary ("dolly in/out", "pan left/right",
"tilt up/down", "orbit right", "static locked-off", "tripod-like stability",
"handheld follow", "crane shot", "rack focus", "push-in", "pull-back").

====================================================================
CRITICAL: PHYSICS & STABILITY REQUIREMENTS
====================================================================
Veo's default bias is "everything is alive" — if you don't explicitly
anchor static objects, they will slide, drift, morph, or float when the
camera moves. This is the #1 failure mode of AI video and is unacceptable
for marketing work. Every clip prompt you generate MUST:

1. SEPARATE camera motion from object motion. Put camera movement on its
   own sentence. e.g. "The phone rests flat on the matte oak desk. The
   camera dollies in slowly over 8 seconds."

2. LOCK static objects to surfaces using this exact phrase template:
   "The {object} remains completely stationary, locked to the {surface},
   maintaining full contact throughout. Physics-accurate weight and
   gravity. Only the camera moves; all props are locked in place."

3. FORCE-BASED verbs for wanted motion. Say "push", "pull", "sway",
   "strike", "tilt" — not vague verbs ("moves", "goes", "does").

4. ONE DOMINANT motion per clip. Never stack "camera pans AND object
   rotates AND lights flicker". Pick camera OR subject motion, rarely
   both, never three.

5. NAME THE LIGHT SOURCE with direction — gives Veo a spatial anchor
   that transitively stabilizes the whole scene
   ("lit by the window at frame-left").

6. MATERIAL SPECIFICITY for any hero object — "matte oak", "brushed
   aluminum", "woven charcoal canvas" — gives Veo a light-reflection
   profile that carries across frames.

7. ASPECT-AWARE framing:
   - 9:16 (vertical): "vertical portrait framing, subject centered,
     shoulders-to-forehead" — never reuse a 16:9 wide prompt here.
   - 16:9 (horizontal): "cinematic wide composition, negative space
     left-of-frame" or similar.

Fields (each is one concrete sentence following the rules above):
- subject: who/what appears in the opening frame + initial composition
  + aspect-aware framing cue. Use a reusable noun phrase for the hero.
- camera: ONE specific camera movement in canonical vocabulary. Must be
  its own sentence, not buried in subject description. Default to
  conservative motion (slow dolly-in or static hold) unless the brief
  explicitly asks for dynamic motion.
- action: what changes during the clip — with force-based verbs only.
  If the hero is a static prop, the "action" is usually an environmental
  change (light shift, steam rising, leaves drifting) while the prop
  stays put. Explicitly state "The {hero} remains locked in place" if
  the hero is a static object.
- lighting: direction + color + quality + how it evolves if at all.
  Prefer steady light over changing light unless the brief demands it.
- mood: emotional tone + palette + optional cinematic reference
  ("tone of a Sofia Coppola morning scene").
- audio: Veo will generate audio natively; describe the ambient bed +
  any specific sounds. Use neutral ambient if unsure — changing audio
  dramatically is a cut signal.
- negativePrompt: a comma-separated list of NOUNS and ADJECTIVES (never
  "no X" phrasing). Stack these defaults at minimum, add brief-specific
  ones as needed: "blurry, distorted geometry, morphing objects, sliding
  objects, drifting props, text artifacts, fake logos, extra fingers,
  deformed hands, low quality, jittery motion, watermarks". If the brief
  involves a phone/UI screen, also add "fake app UI, hallucinated icons,
  garbled on-screen text".

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
    const { project, target, ratio, brief, existingFields, regenerateFields } =
      parsed.data;

    const profile = getBrandProfile(project as ProjectSlug);
    const systemPrompt = target === "image" ? SYSTEM_IMAGE : SYSTEM_VIDEO;
    const fieldsSchema =
      target === "image" ? imageFieldsSchema : videoFieldsSchema;

    const isPartial = !!(
      regenerateFields &&
      regenerateFields.length > 0 &&
      existingFields &&
      Object.keys(existingFields).length > 0
    );

    // Build the blueprint context block the model can see.
    const existingContext = isPartial
      ? `\n\nCURRENT BLUEPRINT (keep these unchanged unless listed as REGENERATE):\n${Object.entries(
          existingFields!
        )
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}\n\nREGENERATE ONLY these fields with fresh ideas: ${regenerateFields!.join(", ")}.\nReturn the COMPLETE blueprint JSON — kept fields verbatim, regenerated fields replaced.`
      : "";

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
${brief.trim()}${existingContext}`;

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
