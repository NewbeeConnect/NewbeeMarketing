import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { VideoGenerationReferenceType, type VideoCompressionQuality } from "@google/genai";
import type { Project, Scene } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const VALID_RESOLUTIONS = ["720p", "1080p", "4k"] as const;

const inputSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
  language: z.string().optional(),
  platform: z.string().optional(),
  aspectRatio: z.string().optional(),
  resolution: z.enum(VALID_RESOLUTIONS).optional(),
  useFastModel: z.boolean().optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
  compressionQuality: z.enum(["OPTIMIZED", "LOSSLESS"]).optional(),
  enhancePrompt: z.boolean().optional(),
  firstFrameImageUrl: z.string().url().optional(),
});

function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim()
    .substring(0, 5000);
}

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
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
    }

    // Rate limit with Retry-After header
    const rl = checkRateLimit(user.id, "ai-media");
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) },
        }
      );
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
    const {
      projectId, sceneId, language, platform, aspectRatio,
      resolution, useFastModel, seed, compressionQuality,
      enhancePrompt, firstFrameImageUrl,
    } = parsed.data;

    // Verify project ownership
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

    // Fetch scene
    const { data: sceneData, error: sceneError } = await serviceClient
      .from("mkt_scenes")
      .select("*")
      .eq("id", sceneId)
      .eq("project_id", projectId)
      .single();
    const scene = sceneData as Scene | null;

    if (sceneError || !scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const prompt = sanitizePrompt(scene.optimized_prompt || scene.description);
    const model = useFastModel ? MODELS.VEO_FAST : MODELS.VEO;
    const targetAspectRatio = aspectRatio || scene.aspect_ratio || "9:16";

    // Validate aspect ratio (Veo only supports 16:9 and 9:16)
    const validAspectRatios = ["16:9", "9:16"];
    const aspectRatioConverted = !validAspectRatios.includes(targetAspectRatio);
    const finalAspectRatio = aspectRatioConverted ? "9:16" : targetAspectRatio;

    // Clamp duration to Veo-supported values (4, 6, or 8 seconds)
    const validDurations = [4, 6, 8] as const;
    const rawDuration = scene.duration_seconds;
    const finalDuration = validDurations.reduce((closest, val) =>
      Math.abs(val - rawDuration) < Math.abs(closest - rawDuration) ? val : closest
    );

    // Validate resolution (1080p/4k only support 8s duration)
    const finalResolution = resolution || "720p";
    const resolvedDuration = (finalResolution === "1080p" || finalResolution === "4k") ? 8 : finalDuration;

    // Build reference images from scene data (Veo supports max 3 ASSET or 1 STYLE)
    let referenceImages: Array<{
      image: { gcsUri: string };
      referenceType: VideoGenerationReferenceType;
    }> | undefined;

    if (scene.reference_image_urls && scene.reference_image_urls.length > 0) {
      referenceImages = scene.reference_image_urls.slice(0, 3).map((url) => ({
        image: { gcsUri: url },
        referenceType: VideoGenerationReferenceType.ASSET,
      }));
    }

    // Determine audio generation based on scene audio_type
    const shouldGenerateAudio = scene.audio_type !== "silent";

    // personGeneration: "allow_all" for text-to-video, "allow_adult" for image-to-video
    const personGenSetting = firstFrameImageUrl ? "allow_adult" : "allow_all";

    // Create generation record
    const { data: generationData, error: genInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        scene_id: sceneId,
        type: "video",
        prompt,
        model,
        config: JSON.parse(
          JSON.stringify({
            duration_seconds: resolvedDuration,
            aspect_ratio: finalAspectRatio,
            resolution: finalResolution,
            negative_prompt: scene.negative_prompt,
            ...(seed !== undefined && { seed }),
            ...(compressionQuality && { compression_quality: compressionQuality }),
            ...(enhancePrompt !== undefined && { enhance_prompt: enhancePrompt }),
            ...(firstFrameImageUrl && { first_frame_image_url: firstFrameImageUrl }),
            ...(referenceImages && { reference_image_count: referenceImages.length }),
            generate_audio: shouldGenerateAudio,
          })
        ),
        language: language || null,
        platform: platform || null,
        aspect_ratio: finalAspectRatio,
        status: "pending",
        estimated_cost_usd: estimateVideoCost(
          resolvedDuration,
          useFastModel ?? false,
          finalResolution
        ),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (genInsertError || !generationData) {
      return NextResponse.json(
        { error: "Failed to create generation record" },
        { status: 500 }
      );
    }

    const generation = generationData as { id: string; [key: string]: unknown };

    // Start async video generation with Veo
    try {
      // Build generateVideos parameters
      const generateParams: Parameters<typeof ai.models.generateVideos>[0] = {
        model,
        prompt,
        config: {
          aspectRatio: finalAspectRatio,
          numberOfVideos: 1,
          durationSeconds: resolvedDuration,
          resolution: finalResolution,
          negativePrompt: scene.negative_prompt || undefined,
          personGeneration: personGenSetting,
          generateAudio: shouldGenerateAudio,
          ...(seed !== undefined && { seed }),
          ...(compressionQuality && { compressionQuality: compressionQuality as VideoCompressionQuality }),
          ...(enhancePrompt !== undefined && { enhancePrompt }),
          ...(referenceImages && { referenceImages }),
        },
      };

      // Image-to-video: use provided image as first frame
      if (firstFrameImageUrl) {
        generateParams.image = { gcsUri: firstFrameImageUrl };
      }

      const operation = await ai.models.generateVideos(generateParams);

      // Store operation name for polling
      const operationName = operation.name || null;

      await serviceClient
        .from("mkt_generations")
        .update({
          operation_name: operationName,
          status: "processing",
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        operationName,
        status: "processing",
        ...(aspectRatioConverted && {
          warning: `Aspect ratio "${targetAspectRatio}" is not supported by Veo. Using "9:16" instead.`,
        }),
      });
    } catch (veoError) {
      // Extract detailed error info
      const errorDetail = veoError instanceof Error
        ? { message: veoError.message, name: veoError.name, stack: veoError.stack }
        : { message: String(veoError) };
      console.error("Veo API error:", JSON.stringify(errorDetail, null, 2));
      console.error("Veo request config:", { model, prompt: "[REDACTED]", aspectRatio: finalAspectRatio, duration: resolvedDuration, resolution: finalResolution });

      const errorMsg = veoError instanceof Error ? veoError.message : "Veo generation failed";

      // Update generation as failed
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json(
        {
          generationId: generation.id,
          status: "failed",
          error: errorMsg,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to start video generation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateVideoCost(durationSeconds: number, isFast: boolean, resolution?: string): number {
  const costPerSecond = isFast
    ? COST_ESTIMATES.veo_fast_per_second
    : COST_ESTIMATES.veo_standard_per_second;
  const resolutionMultiplier = resolution === "4k" ? 2.0 : resolution === "1080p" ? 1.5 : 1.0;
  return Math.round(durationSeconds * costPerSecond * resolutionMultiplier * 10000) / 10000;
}
