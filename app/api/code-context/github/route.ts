import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { analyzeCodeContext } from "@/lib/ai/code-analyzer";
import { fetchRepoWithPat } from "@/lib/scraping/github-pat-fetcher";
import { decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { z } from "zod";

const inputSchema = z.object({
  repoUrl: z.string().url().refine(
    (url) => /github\.com\/[^/]+\/[^/]+/.test(url),
    "Must be a valid GitHub repository URL"
  ),
});

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

    // Input validation
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { repoUrl } = parsed.data;

    // Fetch encrypted PAT from mkt_api_keys
    const { data: apiKeyRow } = await serviceClient
      .from("mkt_api_keys")
      .select("keys_encrypted")
      .eq("user_id", user.id)
      .eq("platform", "github")
      .single();

    if (!apiKeyRow) {
      return NextResponse.json(
        { error: "GitHub Personal Access Token not configured. Add it in Settings." },
        { status: 400 }
      );
    }

    // Decrypt PAT
    const keys = apiKeyRow.keys_encrypted as Record<string, string>;
    let pat: string;
    try {
      pat = decrypt(keys.personal_access_token);
    } catch {
      return NextResponse.json(
        { error: "Failed to decrypt GitHub token. Please re-enter it in Settings." },
        { status: 500 }
      );
    }

    // Fetch repo contents with PAT
    const { assembledText, repoName } = await fetchRepoWithPat(repoUrl, pat);

    // Analyze with Gemini Flash
    const { analysis, tokenCount, fileTree } = await analyzeCodeContext(assembledText);

    // Save to database
    const { data: codeContext, error: insertError } = await serviceClient
      .from("mkt_code_contexts")
      .insert({
        user_id: user.id,
        name: repoName,
        source_type: "github_pat" as const,
        repo_url: repoUrl,
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
    console.error("GitHub code context error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch and analyze repository" },
      { status: 500 }
    );
  }
}
