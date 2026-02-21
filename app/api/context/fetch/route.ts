import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { scrapeUrl, scrapeGithubRepo, isGithubUrl } from "@/lib/scraping/url-scraper";
import { summarizeContext } from "@/lib/scraping/context-summarizer";
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

    return NextResponse.json({ context });
  } catch (error) {
    console.error("Context fetch error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
