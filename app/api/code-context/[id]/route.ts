import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from("mkt_code_contexts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Code context not found" }, { status: 404 });
    }

    return NextResponse.json({ codeContext: data });
  } catch (error) {
    console.error("Get code context error:", error);
    return NextResponse.json({ error: "Failed to fetch code context" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const serviceClient = createServiceClient();

    // Fetch first to get storage path for cleanup
    const { data: existing } = await serviceClient
      .from("mkt_code_contexts")
      .select("raw_file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Code context not found" }, { status: 404 });
    }

    // Delete from database
    const { error } = await serviceClient
      .from("mkt_code_contexts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete code context" }, { status: 500 });
    }

    // Clean up storage file if exists
    if (existing.raw_file_url) {
      const storagePath = `${user.id}/code-context/${id}.txt`;
      await serviceClient.storage.from("mkt-assets").remove([storagePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete code context error:", error);
    return NextResponse.json({ error: "Failed to delete code context" }, { status: 500 });
  }
}
