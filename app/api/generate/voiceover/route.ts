import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { Modality } from "@google/genai";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid().optional(),
  text: z.string().min(1).max(5000),
  language: z.string().min(2).max(5),
  voiceName: z.string().optional(),
});

// Gemini TTS voice mapping per language
// Available voices: Aoede, Charon, Fenrir, Kore, Leda, Orus, Puck, Zephyr
const VOICE_MAP: Record<string, { voiceName: string; languageCode: string }> = {
  en: { voiceName: "Kore", languageCode: "en-US" },
  de: { voiceName: "Kore", languageCode: "de-DE" },
  tr: { voiceName: "Kore", languageCode: "tr-TR" },
};

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

    // Rate limit (media = stricter)
    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "ai-media");
    if (!rl.allowed) {
      return NextResponse.json({ error: rl.error }, { status: 429 });
    }

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
    const { projectId, sceneId, text, language, voiceName } = parsed.data;

    // Verify project ownership
    const { data: projectData, error: projectError } = await serviceClient
      .from("mkt_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const voice = voiceName
      ? { voiceName, languageCode: VOICE_MAP[language]?.languageCode || "en-US" }
      : VOICE_MAP[language] || VOICE_MAP.en;

    // Generate speech using Gemini TTS (same API key as Gemini/Veo/Imagen)
    const response = await ai.models.generateContent({
      model: MODELS.GEMINI_TTS,
      contents: text,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice.voiceName,
            },
          },
          languageCode: voice.languageCode,
        },
      },
    });

    // Extract audio data from response
    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    const audioData = audioPart?.inlineData;

    if (!audioData?.data) {
      console.error("No audio data in Gemini TTS response");
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    // Upload to Supabase storage
    const buffer = Buffer.from(audioData.data, "base64");
    const mimeType = audioData.mimeType || "audio/wav";
    const ext = mimeType.includes("mp3") ? "mp3" : "wav";
    const fileName = `${projectId}/voiceovers/${sceneId || "full"}_${language}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Voiceover storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Audio generated but storage upload failed. Please try again." },
        { status: 500 }
      );
    }

    const { data: publicUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(fileName);
    const outputUrl = publicUrl.publicUrl;

    // Estimate cost based on Gemini Flash token usage
    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const estimatedCost = estimateTtsCost(inputTokens, outputTokens);

    // Create generation record
    const { data: generationData } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        scene_id: sceneId || null,
        type: "voiceover",
        prompt: text,
        model: MODELS.GEMINI_TTS,
        config: JSON.parse(
          JSON.stringify({ language, voice_name: voice.voiceName })
        ),
        language,
        status: "completed",
        output_url: outputUrl,
        estimated_cost_usd: estimatedCost,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Log usage
    const { error: usageLogError } = await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      generation_id: (generationData as { id: string } | null)?.id ?? null,
      api_service: "tts",
      model: MODELS.GEMINI_TTS,
      operation: "voiceover_generation",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimatedCost,
    });
    if (usageLogError) {
      console.error("Voiceover usage log failed:", usageLogError);
    }

    return NextResponse.json({
      generationId: (generationData as { id: string } | null)?.id,
      outputUrl,
      language,
    });
  } catch (error) {
    console.error("Voiceover generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate voiceover";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Gemini TTS pricing based on Flash model rates
function estimateTtsCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_input;
  const outputCost = (outputTokens / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_output;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
