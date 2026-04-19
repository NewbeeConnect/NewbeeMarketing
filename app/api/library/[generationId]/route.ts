import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { ratioToSlug, type AnyRatio } from "@/lib/projects";

/**
 * DELETE /api/library/[generationId]
 *
 * Remove a row and its stored asset from `mkt-assets`. Deletion is permanent.
 */

type RouteContext = { params: Promise<{ generationId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { generationId } = await params;

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Team-shared library: any signed-in admin can delete any asset. We
    // fetch the row first only to derive the storage path for removal.
    const { data: generation, error: fetchError } = await serviceClient
      .from("mkt_generations")
      .select("id, user_id, type, project_slug, ratio, filename")
      .eq("id", generationId)
      .maybeSingle();

    if (fetchError || !generation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (generation.project_slug && generation.ratio && generation.filename) {
      const path = `${generation.project_slug}/${generation.type}/${ratioToSlug(
        generation.ratio as AnyRatio
      )}/${generation.filename}`;
      const { error: storageError } = await serviceClient.storage
        .from("mkt-assets")
        .remove([path]);
      if (storageError) {
        // Don't fail the whole request if the object was already missing.
        console.warn(
          "[library DELETE] storage remove warning:",
          storageError.message,
          path
        );
      }
    }

    const { error: deleteError } = await serviceClient
      .from("mkt_generations")
      .delete()
      .eq("id", generationId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[library DELETE] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
