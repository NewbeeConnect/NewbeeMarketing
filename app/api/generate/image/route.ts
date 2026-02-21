import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ai, MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { PersonGeneration } from "@google/genai";
import type { Project } from "@/types/database";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(1).max(5000),
  aspectRatio: z.string().optional(),
  useFastModel: z.boolean().optional(),
  purpose: z.string().optional(),
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
      return NextResponse.json({ error: "Google AI not configured" }, { status: 503 });
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
    const { projectId, prompt, aspectRatio, useFastModel, purpose } = parsed.data;

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

    const model = useFastModel ? MODELS.IMAGEN_FAST : MODELS.IMAGEN;
    const targetAspectRatio = aspectRatio || "9:16";
    const isFast = useFastModel ?? false;

    // Create generation record
    const { data: generationData, error: genInsertError } = await serviceClient
      .from("mkt_generations")
      .insert({
        project_id: projectId,
        type: "image",
        prompt,
        model,
        config: JSON.parse(
          JSON.stringify({
            aspect_ratio: targetAspectRatio,
            purpose: purpose || "thumbnail",
          })
        ),
        aspect_ratio: targetAspectRatio,
        status: "processing",
        estimated_cost_usd: isFast
          ? COST_ESTIMATES.imagen_fast_per_image
          : COST_ESTIMATES.imagen_standard_per_image,
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

    try {
      const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: targetAspectRatio,
          personGeneration: PersonGeneration.DONT_ALLOW,
        },
      });

      const imageBytes =
        response.generatedImages?.[0]?.image?.imageBytes;

      if (!imageBytes) {
        await serviceClient
          .from("mkt_generations")
          .update({
            status: "failed",
            error_message: "No image generated",
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);

        return NextResponse.json(
          { generationId: generation.id, status: "failed", error: "No image generated" },
          { status: 500 }
        );
      }

      // Upload to Supabase storage
      const buffer = Buffer.from(imageBytes, "base64");
      const fileName = `${projectId}/images/${generation.id}.png`;

      const { error: uploadError } = await serviceClient.storage
        .from("mkt-assets")
        .upload(fileName, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      let outputUrl = "";
      if (!uploadError) {
        const { data: publicUrl } = serviceClient.storage
          .from("mkt-assets")
          .getPublicUrl(fileName);
        outputUrl = publicUrl.publicUrl;
      }

      await serviceClient
        .from("mkt_generations")
        .update({
          status: "completed",
          output_url: outputUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      // Log usage
      await serviceClient.from("mkt_usage_logs").insert({
        user_id: user.id,
        project_id: projectId,
        generation_id: generation.id,
        api_service: "imagen",
        model,
        operation: purpose || "image_generation",
        estimated_cost_usd: isFast
          ? COST_ESTIMATES.imagen_fast_per_image
          : COST_ESTIMATES.imagen_standard_per_image,
      });

      return NextResponse.json({
        generationId: generation.id,
        status: "completed",
        outputUrl,
      });
    } catch (imagenError) {
      await serviceClient
        .from("mkt_generations")
        .update({
          status: "failed",
          error_message:
            imagenError instanceof Error
              ? imagenError.message
              : "Image generation failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json(
        {
          generationId: generation.id,
          status: "failed",
          error:
            imagenError instanceof Error
              ? imagenError.message
              : "Image generation failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Image generation error:", error);
    const message = "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
