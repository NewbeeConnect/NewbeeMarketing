import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
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

// Google Cloud TTS voice mapping per language
const VOICE_MAP: Record<string, { name: string; languageCode: string }> = {
  en: { name: "en-US-Studio-O", languageCode: "en-US" },
  de: { name: "de-DE-Studio-B", languageCode: "de-DE" },
  tr: { name: "tr-TR-Standard-E", languageCode: "tr-TR" },
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

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API not configured" },
        { status: 503 }
      );
    }

    // Rate limit (media = stricter)
    const rl = checkRateLimit(user.id, "ai-media");
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
      ? { name: voiceName, languageCode: VOICE_MAP[language]?.languageCode || "en-US" }
      : VOICE_MAP[language] || VOICE_MAP.en;

    // Call Google Cloud TTS API
    const ttsResponse = await fetch(
      "https://texttospeech.googleapis.com/v1/text:synthesize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
          },
          audioConfig: {
            audioEncoding: "MP3",
            pitch: 0,
            speakingRate: 1.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      return NextResponse.json(
        { error: errorData.error?.message || "TTS generation failed" },
        { status: 500 }
      );
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent;

    if (!audioContent) {
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    // Upload to Supabase storage
    const buffer = Buffer.from(audioContent, "base64");
    const fileName = `${projectId}/voiceovers/${sceneId || "full"}_${language}.mp3`;

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, buffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    let outputUrl = "";
    if (!uploadError) {
      const { data: publicUrl } = serviceClient.storage
        .from("mkt-assets")
        .getPublicUrl(fileName);
      outputUrl = publicUrl.publicUrl;
    }

    // Create generation record
    const { data: generationData } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        scene_id: sceneId || null,
        type: "voiceover",
        prompt: text,
        model: voice.name,
        config: JSON.parse(
          JSON.stringify({ language, voice_name: voice.name })
        ),
        language,
        status: "completed",
        output_url: outputUrl,
        estimated_cost_usd: estimateTtsCost(text.length),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      project_id: projectId,
      generation_id: (generationData as { id: string } | null)?.id ?? null,
      api_service: "tts",
      model: voice.name,
      operation: "voiceover_generation",
      estimated_cost_usd: estimateTtsCost(text.length),
    });

    return NextResponse.json({
      generationId: (generationData as { id: string } | null)?.id,
      outputUrl,
      language,
    });
  } catch (error) {
    console.error("Voiceover generation error:", error);
    const message = "Failed to generate voiceover";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// TTS pricing: ~$4 per 1M characters (Standard), ~$16 per 1M characters (Studio)
function estimateTtsCost(characterCount: number): number {
  const costPer1M = 16; // Studio voices
  return Math.round((characterCount / 1_000_000) * costPer1M * 10000) / 10000;
}
