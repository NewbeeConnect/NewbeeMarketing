import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { compositePhoneMockup, getCanvasDimensions } from "@/lib/media/phone-mockup";
import { PHONE_TEMPLATES } from "@/lib/constants";
import { z } from "zod";

const validTemplateIds = PHONE_TEMPLATES.map((t) => t.id) as [string, ...string[]];

const inputSchema = z.object({
  screenshotUrl: z.string().url(),
  templateId: z.enum(validTemplateIds),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sceneId: z.string().uuid().optional(),
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

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { screenshotUrl, templateId, aspectRatio, backgroundColor, sceneId } =
      parsed.data;

    // Fetch screenshot image
    const screenshotResponse = await fetch(screenshotUrl);
    if (!screenshotResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch screenshot image" },
        { status: 400 }
      );
    }
    const screenshotBuffer = Buffer.from(
      await screenshotResponse.arrayBuffer()
    );

    // Get canvas dimensions for aspect ratio
    const { width, height } = getCanvasDimensions(aspectRatio);

    // Composite phone mockup
    const result = await compositePhoneMockup({
      screenshotBuffer,
      templateId,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor,
    });

    // Upload composited image to Supabase storage
    const fileName = `mockups/${user.id}/mockup_${Date.now()}.png`;
    const serviceClient = createServiceClient();

    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(fileName, result.buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Mockup upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload mockup image" },
        { status: 500 }
      );
    }

    const { data: publicUrl } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(fileName);

    const mockupUrl = publicUrl.publicUrl;

    // If sceneId provided, update scene with mockup config and URL
    if (sceneId) {
      await serviceClient
        .from("mkt_scenes")
        .update({
          phone_mockup_config: { templateId, screenshotUrl, backgroundColor },
          mockup_image_url: mockupUrl,
        })
        .eq("id", sceneId);
    }

    return NextResponse.json({
      mockupUrl,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Mockup generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate mockup" },
      { status: 500 }
    );
  }
}
