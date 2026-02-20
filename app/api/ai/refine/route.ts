import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";

const REFINE_SYSTEM_PROMPT = `You are a marketing strategy refinement assistant. The user has an existing strategy or scene breakdown and wants to modify specific aspects.

Your role is to:
1. Understand what the user wants to change
2. Make ONLY the requested changes while preserving everything else
3. Return the complete updated content with changes applied
4. Explain what you changed and why

## Rules
- Only modify what the user explicitly asks to change
- Preserve the overall structure and format
- If the request is ambiguous, lean toward minimal changes
- Always return valid JSON matching the original structure

## Response Format
Always respond with valid JSON. Do not include markdown code blocks or any text outside the JSON.`;

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

    const body = await request.json();
    const { projectId, currentContent, refinementRequest, contentType } = body;

    if (!projectId || !currentContent || !refinementRequest || !contentType) {
      return NextResponse.json(
        { error: "projectId, currentContent, refinementRequest, and contentType are required" },
        { status: 400 }
      );
    }

    if (!["strategy", "scenes"].includes(contentType)) {
      return NextResponse.json({ error: "contentType must be 'strategy' or 'scenes'" }, { status: 400 });
    }

    // Verify project ownership
    const serviceClient = createServiceClient();
    const { data: project, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const userPrompt = `Here is the current ${contentType}:
${JSON.stringify(currentContent, null, 2)}

User's refinement request: "${refinementRequest}"

Apply the requested changes and return the updated ${contentType} as JSON with this structure:
{
  "updated_content": { /* the complete updated ${contentType} with changes applied */ },
  "explanation": "Brief explanation of what was changed"
}`;

    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: userPrompt,
      config: {
        systemInstruction: REFINE_SYSTEM_PROMPT,
        temperature: 0.5,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text ?? "";
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const result = JSON.parse(cleaned);

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      api_service: "gemini",
      model: MODELS.GEMINI_FLASH,
      operation: `${contentType}_refinement`,
      input_tokens: response.usageMetadata?.promptTokenCount ?? null,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? null,
      estimated_cost_usd: estimateCost(
        response.usageMetadata?.promptTokenCount ?? 0,
        response.usageMetadata?.candidatesTokenCount ?? 0
      ),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Refinement error:", error);
    const message = error instanceof Error ? error.message : "Failed to refine content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  // Gemini Flash pricing
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.6;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
