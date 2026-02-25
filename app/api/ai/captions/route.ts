import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS } from "@/lib/google-ai";
import {
  CAPTION_SYSTEM_PROMPT,
  buildCaptionPrompt,
} from "@/lib/ai/prompts/caption-generator";
import { captionResponseSchema, parseAiJson } from "@/lib/ai/response-schemas";
import type { Project, Scene } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  language: z.string().min(2).max(5),
  generationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ai) {
      return NextResponse.json(
        { error: "Google AI not configured" },
        { status: 503 }
      );
    }

    // Rate limit
    const rl = checkRateLimit(user.id, "ai-gemini");
    if (!rl.allowed) {
      return NextResponse.json({ error: rl.error }, { status: 429 });
    }

    const serviceClient = createServiceClient();

    // Budget guard
    const budget = await checkBudget(serviceClient, user.id);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    // Input validation
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { projectId, language, generationId } = parsed.data;

    // Fetch project
    const { data: projectData, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    const project = projectData as Project | null;

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch scenes
    const { data: scenesData, error: scenesError } = await serviceClient
      .from("mkt_scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    const scenes = (scenesData ?? []) as Scene[];

    if (scenesError || scenes.length === 0) {
      return NextResponse.json({ error: "No scenes found" }, { status: 404 });
    }

    const totalDuration = scenes.reduce(
      (sum, s) => sum + s.duration_seconds,
      0
    );

    // Build prompt
    const userPrompt = buildCaptionPrompt({
      scenes: scenes.map((s) => ({
        title: s.title,
        description: s.description,
        duration_seconds: s.duration_seconds,
        voiceover_text: s.voiceover_text,
        text_overlay: s.text_overlay,
      })),
      language,
      totalDuration,
    });

    // Call Gemini Flash (cheaper for caption generation)
    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_FLASH,
      contents: userPrompt,
      config: {
        systemInstruction: CAPTION_SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text ?? "";
    const captionResult = parseAiJson(text, captionResponseSchema);

    // Save caption to database
    const { data: captionData, error: captionError } = await serviceClient
      .from("mkt_captions")
      .insert({
        generation_id: generationId,
        language,
        srt_content: captionResult.srt_content,
        is_embedded: false,
      })
      .select()
      .single();

    if (captionError) {
      // Still return the SRT even if DB save fails
      console.error("Caption save error:", captionError);
    }

    // Also upload SRT file to storage
    const srtFileName = `${projectId}/captions/${language}.srt`;
    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(srtFileName, captionResult.srt_content, {
        contentType: "text/plain",
        upsert: true,
      });

    if (uploadError) {
      console.error("SRT upload error:", uploadError);
    }

    const { data: srtUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(srtFileName);

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      api_service: "gemini",
      model: MODELS.GEMINI_FLASH,
      operation: "caption_generation",
      input_tokens: response.usageMetadata?.promptTokenCount ?? null,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? null,
      estimated_cost_usd: estimateCostFlash(
        response.usageMetadata?.promptTokenCount ?? 0,
        response.usageMetadata?.candidatesTokenCount ?? 0
      ),
    });

    return NextResponse.json({
      captionId: (captionData as { id: string } | null)?.id,
      srtContent: captionResult.srt_content,
      srtUrl: srtUrl.publicUrl,
      language,
    });
  } catch (error) {
    console.error("Caption generation error:", error);
    const message = "Failed to generate captions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateCostFlash(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.075;
  const outputCost = (outputTokens / 1_000_000) * 0.6;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
