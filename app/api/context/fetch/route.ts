import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { scrapeUrl, scrapeGithubRepo, isGithubUrl } from "@/lib/scraping/url-scraper";
import { summarizeContext } from "@/lib/scraping/context-summarizer";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkBudget } from "@/lib/budget-guard";
import { MODELS, COST_ESTIMATES } from "@/lib/google-ai";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url("Invalid URL format"),
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
    const serviceClient = createServiceClient();

    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    // Budget guard (summarization uses Gemini Flash)
    const budget = await checkBudget(serviceClient, user.id);
    if (!budget.allowed) {
      return NextResponse.json({ error: budget.error }, { status: 429 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // Scrape based on URL type
    const scraped = isGithubUrl(url)
      ? await scrapeGithubRepo(url)
      : await scrapeUrl(url);

    // Summarize with AI
    const context = await summarizeContext(scraped);

    // Log AI usage for the summarization step
    await serviceClient.from("mkt_usage_logs").insert({
      user_id: user.id,
      api_service: "gemini",
      model: MODELS.GEMINI_FLASH,
      operation: "context_summarization",
      estimated_cost_usd: estimateSummarizationCost(),
    });

    return NextResponse.json({ context });
  } catch (error) {
    console.error("Context fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function estimateSummarizationCost(): number {
  // ~2000 input tokens (scraped text) + ~500 output tokens (JSON summary)
  const inputCost = (2000 / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_input;
  const outputCost = (500 / 1_000_000) * COST_ESTIMATES.gemini_flash_per_1m_output;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}
