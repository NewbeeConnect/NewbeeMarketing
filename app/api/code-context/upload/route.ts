import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { analyzeCodeContext } from "@/lib/ai/code-analyzer";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Uploaded Codebase";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Read file content
    const rawText = await file.text();
    if (!rawText.trim()) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Upload raw file to Supabase storage
    const fileId = crypto.randomUUID();
    const storagePath = `${user.id}/code-context/${fileId}.txt`;
    const { error: uploadError } = await serviceClient.storage
      .from("mkt-assets")
      .upload(storagePath, rawText, {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from("mkt-assets")
      .getPublicUrl(storagePath);

    // Analyze with Gemini Flash
    const { analysis, tokenCount, fileTree } = await analyzeCodeContext(rawText);

    // Save to database
    const { data: codeContext, error: insertError } = await serviceClient
      .from("mkt_code_contexts")
      .insert({
        user_id: user.id,
        name,
        source_type: "repomix_upload" as const,
        raw_file_url: publicUrl,
        analysis,
        file_tree: fileTree,
        token_count: tokenCount,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Code context insert error:", insertError);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // Log usage
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini",
      model: "gemini-2.5-flash",
      operation: "code_analysis",
      input_tokens: tokenCount,
      output_tokens: null,
      estimated_cost_usd: (tokenCount / 1_000_000) * 0.075,
    });

    return NextResponse.json({ codeContext });
  } catch (error) {
    console.error("Code context upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze code" },
      { status: 500 }
    );
  }
}
