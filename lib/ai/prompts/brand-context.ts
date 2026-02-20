import type { BrandKit } from "@/types/database";

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
