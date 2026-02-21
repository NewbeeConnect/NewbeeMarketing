import * as cheerio from "cheerio";

// SSRF protection: block private/internal IPs and dangerous protocols
function validateUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS protocols are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "::1"
  ) {
    throw new Error("Access to localhost is not allowed");
  }

  // Block private IP ranges
  const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (
      a === 10 || // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 169 && b === 254) || // link-local / cloud metadata
      a === 0 || // 0.0.0.0/8
      a === 127 // 127.0.0.0/8
    ) {
      throw new Error("Access to private/internal IP addresses is not allowed");
    }
  }

  // Block cloud metadata endpoints
  if (hostname === "metadata.google.internal" || hostname === "metadata.google.com") {
    throw new Error("Access to cloud metadata endpoints is not allowed");
  }

  return parsed;
}

export type ScrapedContext = {
  title: string;
  description: string;
  aboutUs: string | null;
  features: string[];
  usp: string[];
  techStack: string[];
  rawText: string;
};

const ABOUT_KEYWORDS = ["about", "who we are", "our story", "mission", "hakkımızda", "über uns"];
const FEATURE_KEYWORDS = ["feature", "what we offer", "services", "capabilities", "özellikler", "funktionen"];
const USP_KEYWORDS = ["why", "unique", "advantage", "benefit", "different", "neden", "warum"];

/**
 * Scrape a generic website URL and extract marketing-relevant content.
 */
export async function scrapeUrl(url: string): Promise<ScrapedContext> {
  const validatedUrl = validateUrl(url);
  const response = await fetch(validatedUrl.toString(), {
    headers: {
      "User-Agent": "NewbeeMarketing-Bot/1.0 (Context Fetcher)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer for cleaner text extraction
  $("script, style, nav, footer, header, iframe, noscript").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const aboutUs = extractSection($, ABOUT_KEYWORDS);
  const features = extractListItems($, FEATURE_KEYWORDS);
  const usp = extractListItems($, USP_KEYWORDS);

  // Get all visible body text as fallback
  const rawText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

  return {
    title,
    description,
    aboutUs,
    features,
    usp,
    techStack: [],
    rawText,
  };
}

/**
 * Scrape a GitHub repository for marketing-relevant info from README.
 */
export async function scrapeGithubRepo(url: string): Promise<ScrapedContext> {
  // Convert github.com URL to raw README URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }

  const [, owner, repo] = match;

  // Try fetching README via GitHub API (no auth needed for public repos)
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github.v3.html",
      "User-Agent": "NewbeeMarketing-Bot/1.0",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    // Fallback: scrape the repo page directly
    return scrapeUrl(url);
  }

  const readmeHtml = await response.text();
  const $ = cheerio.load(readmeHtml);

  const title = $("h1").first().text().trim() || repo;
  const description = $("p").first().text().trim() || "";

  const aboutUs = extractSection($, ABOUT_KEYWORDS);
  const features = extractListItems($, FEATURE_KEYWORDS);
  const usp = extractListItems($, USP_KEYWORDS);

  // Try to detect tech stack from README
  const techStack = extractTechStack($);

  const rawText = $.text().replace(/\s+/g, " ").trim().slice(0, 5000);

  return {
    title,
    description,
    aboutUs,
    features,
    usp,
    techStack,
    rawText,
  };
}

/**
 * Detect whether a URL is a GitHub repository.
 */
export function isGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(url);
}

// ---- Helpers ----

function extractSection($: cheerio.CheerioAPI, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();

    // Find headings matching the keyword
    const headings = $("h1, h2, h3, h4").filter(function () {
      return $(this).text().toLowerCase().includes(lowerKeyword);
    });

    if (headings.length > 0) {
      const heading = headings.first();
      const parts: string[] = [];

      // Collect all sibling content until the next heading of same or higher level
      const headingTag = heading.prop("tagName")?.toLowerCase() ?? "h2";
      let next = heading.next();
      let count = 0;

      while (next.length > 0 && count < 10) {
        const tag = next.prop("tagName")?.toLowerCase() ?? "";
        if (["h1", "h2", "h3", "h4"].includes(tag) && tag <= headingTag) break;

        const text = next.text().trim();
        if (text) parts.push(text);

        next = next.next();
        count++;
      }

      if (parts.length > 0) {
        return parts.join("\n").slice(0, 2000);
      }
    }
  }
  return null;
}

function extractListItems($: cheerio.CheerioAPI, keywords: string[]): string[] {
  const items: string[] = [];

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();

    const headings = $("h1, h2, h3, h4").filter(function () {
      return $(this).text().toLowerCase().includes(lowerKeyword);
    });

    if (headings.length > 0) {
      const heading = headings.first();
      // Look for list items after this heading
      const nextList = heading.nextAll("ul, ol").first();
      if (nextList.length > 0) {
        nextList.find("li").each(function () {
          const text = $(this).text().trim();
          if (text && items.length < 10) {
            items.push(text);
          }
        });
      }

      // Also check for paragraphs with bullet-like content
      if (items.length === 0) {
        let next = heading.next();
        let count = 0;
        while (next.length > 0 && count < 8) {
          const tag = next.prop("tagName")?.toLowerCase() ?? "";
          if (["h1", "h2", "h3"].includes(tag)) break;

          if (tag === "p" || tag === "li") {
            const text = next.text().trim();
            if (text) items.push(text);
          }
          next = next.next();
          count++;
        }
      }
    }
  }

  return items.slice(0, 10);
}

function extractTechStack($: cheerio.CheerioAPI): string[] {
  const techKeywords = [
    "React", "Next.js", "Vue", "Angular", "Node.js", "Python", "Django",
    "Flask", "Ruby", "Rails", "Go", "Rust", "Java", "Spring", "TypeScript",
    "JavaScript", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "Firebase", "Supabase", "GraphQL", "REST",
    "Tailwind", "Swift", "Kotlin", "Flutter", "Capacitor",
  ];

  const bodyText = $.text();
  const found: string[] = [];

  for (const tech of techKeywords) {
    if (bodyText.includes(tech) && !found.includes(tech)) {
      found.push(tech);
    }
  }

  return found.slice(0, 15);
}
