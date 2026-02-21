import type { BrandKit, CampaignPerformance } from "@/types/database";
import type { SummarizedContext } from "@/lib/scraping/context-summarizer";

export function buildBrandContext(brandKit: BrandKit | null): string {
  if (!brandKit) return "";

  const parts: string[] = [
    `\n## Brand Guidelines`,
    `Brand Name: ${brandKit.name}`,
  ];

  if (brandKit.brand_voice) {
    parts.push(`Brand Voice & Tone: ${brandKit.brand_voice}`);
  }

  if (brandKit.colors) {
    const c = brandKit.colors;
    parts.push(
      `Brand Colors: Primary ${c.primary}, Secondary ${c.secondary}, Accent ${c.accent}${c.background ? `, Background ${c.background}` : ""}${c.text ? `, Text ${c.text}` : ""}`
    );
  }

  if (brandKit.fonts) {
    const f = brandKit.fonts;
    parts.push(
      `Typography: Heading "${f.heading}", Body "${f.body}"${f.caption ? `, Caption "${f.caption}"` : ""}`
    );
  }

  return parts.join("\n");
}

export function buildNewbeeInsightContext(insights: {
  totalUsers?: number;
  activeUsers?: number;
  topFeatures?: string[];
  topCities?: string[];
  upcomingEvents?: number;
  totalEvents?: number;
} | null): string {
  if (!insights) return "";

  const parts: string[] = ["\n## Newbee Platform Data (for marketing context)"];

  if (insights.totalUsers) {
    parts.push(`Total registered users: ${insights.totalUsers.toLocaleString()}`);
  }
  if (insights.activeUsers) {
    parts.push(`Monthly active users: ${insights.activeUsers.toLocaleString()}`);
  }
  if (insights.topFeatures?.length) {
    parts.push(`Most popular features: ${insights.topFeatures.join(", ")}`);
  }
  if (insights.topCities?.length) {
    parts.push(`Top cities: ${insights.topCities.join(", ")}`);
  }
  if (insights.upcomingEvents) {
    parts.push(`Upcoming events: ${insights.upcomingEvents}`);
  }
  if (insights.totalEvents) {
    parts.push(`Total events created: ${insights.totalEvents.toLocaleString()}`);
  }

  return parts.join("\n");
}

export function buildExternalContext(context: SummarizedContext | null): string {
  if (!context) return "";

  const parts: string[] = ["\n## External Product Context (scraped from source URL)"];

  parts.push(`Company/Product: ${context.companyName}`);
  if (context.productDescription) {
    parts.push(`Description: ${context.productDescription}`);
  }
  if (context.targetAudience) {
    parts.push(`Target Audience: ${context.targetAudience}`);
  }
  if (context.keyFeatures.length > 0) {
    parts.push(`Key Features:\n${context.keyFeatures.map((f) => `- ${f}`).join("\n")}`);
  }
  if (context.uniqueSellingPoints.length > 0) {
    parts.push(`Unique Selling Points:\n${context.uniqueSellingPoints.map((u) => `- ${u}`).join("\n")}`);
  }
  if (context.brandTone) {
    parts.push(`Detected Brand Tone: ${context.brandTone}`);
  }
  if (context.techStack.length > 0) {
    parts.push(`Tech Stack: ${context.techStack.join(", ")}`);
  }

  return parts.join("\n");
}

export function buildPerformanceContext(data: CampaignPerformance[]): string {
  if (!data || data.length === 0) return "";

  const parts: string[] = ["\n## Previous Campaign Performance Data"];

  // Aggregate by version type
  const byVersion: Record<string, { impressions: number; clicks: number; conversions: number; spend: number; count: number }> = {};

  for (const row of data) {
    const key = row.version_type || "single";
    if (!byVersion[key]) {
      byVersion[key] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, count: 0 };
    }
    byVersion[key].impressions += row.impressions;
    byVersion[key].clicks += row.clicks;
    byVersion[key].conversions += row.conversions;
    byVersion[key].spend += row.spend_usd;
    byVersion[key].count += 1;
  }

  for (const [version, stats] of Object.entries(byVersion)) {
    const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : "0";
    const cvr = stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(2) : "0";

    const label = version === "emotional" ? "Emotional/Story-driven"
      : version === "technical" ? "Technical/Benefit-driven"
      : "Standard";

    parts.push(`**${label} Version:**`);
    parts.push(`  Impressions: ${stats.impressions.toLocaleString()}, Clicks: ${stats.clicks.toLocaleString()}`);
    parts.push(`  CTR: ${ctr}%, Conversion Rate: ${cvr}%, Spend: $${stats.spend.toFixed(2)}`);
  }

  // Determine winner
  const versions = Object.entries(byVersion);
  if (versions.length > 1) {
    const sorted = versions.sort((a, b) => {
      const ctrA = a[1].impressions > 0 ? a[1].clicks / a[1].impressions : 0;
      const ctrB = b[1].impressions > 0 ? b[1].clicks / b[1].impressions : 0;
      return ctrB - ctrA;
    });
    const winner = sorted[0][0] === "emotional" ? "Emotional/Story-driven" : "Technical/Benefit-driven";
    parts.push(`\n**RECOMMENDATION:** The "${winner}" approach performed better. Prioritize this tone and style for the next campaign.`);
  }

  return parts.join("\n");
}
