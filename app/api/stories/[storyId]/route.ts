import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ storyId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    const { data: story, error: storyError } = await serviceClient
      .from("mkt_stories")
      .select("*")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { data: generations } = await serviceClient
      .from("mkt_generations")
      .select("id, story_role, sequence_index, type, prompt, status, output_url, operation_name, estimated_cost_usd, actual_cost_usd, created_at")
      .eq("story_id", storyId)
      .order("story_role", { ascending: true })
      .order("sequence_index", { ascending: true });

    const frames = (generations ?? []).filter((g) => g.story_role === "frame");
    const clips = (generations ?? []).filter((g) => g.story_role === "clip");
    const stitched = (generations ?? []).find((g) => g.story_role === "stitched");

    return NextResponse.json({ story, frames, clips, stitched: stitched ?? null });
  } catch (error) {
    console.error("[stories GET] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch story" },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({
  scene_scripts: z.record(z.string(), z.string()).optional(),
  frame_prompts: z.record(z.string(), z.string()).optional(),
  style_anchor: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { storyId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const { data: updated, error: updateError } = await serviceClient
      .from("mkt_stories")
      .update({
        ...(parsed.data.scene_scripts && { scene_scripts: parsed.data.scene_scripts }),
        ...(parsed.data.frame_prompts && { frame_prompts: parsed.data.frame_prompts }),
        ...(parsed.data.style_anchor && { style_anchor: parsed.data.style_anchor }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ story: updated });
  } catch (error) {
    console.error("[stories PATCH] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update story" },
      { status: 500 }
    );
  }
}
