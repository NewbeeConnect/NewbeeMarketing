import type { BrandKit, CampaignPerformance, CodeAnalysis } from "@/types/database";
import type { SummarizedContext } from "@/lib/scraping/context-summarizer";

/**
 * Default Newbee product context — injected automatically when product description
 * is missing or empty. This platform exclusively produces content for Newbee,
 * so this context ensures AI always has accurate product knowledge.
 */
export const NEWBEE_DEFAULT_PRODUCT_CONTEXT = `## Newbee Product Identity (Default Context)
App Name: Newbee — Living Abroad? Simplified.
Description: Newbee is the all-in-one mobile community app for immigrants and expats worldwide. It helps people navigate life in a new country by connecting them with local communities, events, and expert advice.

### Core Features
- **Event Discovery & Creation**: Browse and create local events (coffee chats, language practice, game nights, yoga, networking, city walks, etc.)
- **Interest-Based Communities**: Join or create communities around shared interests, nationalities, or neighborhoods
- **Expert Q&A**: Get answers from verified experienced expats on topics like visa, housing, banking, healthcare, culture
- **Real-Time Chat & Messaging**: Direct communication between users
- **Multilingual Support**: English, German, Turkish — with language-based matching
- **City-Based Discovery**: Geolocation-aware content and recommendations

### Target Audience
- Immigrants and expats relocating to a new country
- International students
- Digital nomads
- Anyone seeking community and local knowledge abroad

### Brand Identity
- **Colors**: Warm amber/yellow (#F5B800 primary) — represents optimism and new beginnings
- **Fonts**: Pacifico (headings, friendly accent), Inter (body, clean and modern)
- **Tone**: Warm, welcoming, inclusive, energetic, solutions-focused
- **Visual Style**: Modern, clean UI with warm amber accents, time-based contextual backgrounds

### Key Value Propositions
- "You're not alone in a new country"
- Find your tribe through shared interests and local events
- Get real answers from people who've been through it
- Simplify the complexity of living abroad

### Available Platforms
- iOS (App Store)
- Android (Google Play)
- Web (app.newbeeapp.com)

### App UI Description (for accurate video scenes)
- **Home Screen**: Clean white background with Newbee bee logo (top-left), city name shown prominently (e.g., "FRANKFURT"), contextual greeting banner with warm illustrations, search bar, three action buttons (Ask Question, Create Event, Start Community) in amber/yellow, Discover section with Events/Communities/Feed tabs, event cards with cover images showing date, venue and attendee count
- **Feed Screen**: Tabs for All/Expert/New, Top Experts carousel with profile photos and expertise badges (Tax & Finance, Insurance, etc.), social-style posts with Like/Comment/Share buttons, floating "Post" button in amber
- **Events Screen**: Tabs for All/Online, city-based filtering, Featured events section with large cover images, event cards showing date, time, location, price, remaining spots, "Add Event" button in amber
- **Communities Screen**: Tabs for All/My Communities, list view with community logos, WhatsApp integration badges, Local/Online tags, member counts, "Add Community" button in amber
- **Profile Screen**: User photo with Co-Founder/Experienced badges, city info showing "Originally from → Now in" journey, social links, About Me section
- **Overall UI Theme**: White background, amber/yellow (#F5B800) accent buttons and highlights, rounded corners, clean Inter font, warm and welcoming feel, bottom tab navigation (Home, Feed, Events, Communities, Profile)

### Marketing Angles
- Emotional: The loneliness of moving abroad → finding community → belonging
- Practical: Navigating bureaucracy, language barriers, cultural differences → expert help
- Social: Making friends in a new city → events and communities
- Discovery: Finding hidden gems, local tips, authentic experiences`;

/**
 * Returns Newbee product context when product description is missing.
 * Use this to ensure AI always has product knowledge.
 */
export function getDefaultProductContext(productDescription?: string | null): string {
  if (productDescription && productDescription.trim().length > 20) {
    return ""; // User provided sufficient description
  }
  return `\n${NEWBEE_DEFAULT_PRODUCT_CONTEXT}`;
}

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

export function buildCodeContext(analysis: CodeAnalysis | null): string {
  if (!analysis) return "";

  const parts: string[] = ["\n## App Codebase Analysis (for marketing accuracy)"];
  parts.push(`App: ${analysis.appName} (${analysis.appType})`);

  if (analysis.techStack.length > 0) {
    parts.push(`Tech Stack: ${analysis.techStack.join(", ")}`);
  }
  if (analysis.targetPlatforms.length > 0) {
    parts.push(`Platforms: ${analysis.targetPlatforms.join(", ")}`);
  }
  if (analysis.mainFeatures.length > 0) {
    parts.push(`Key Features:\n${analysis.mainFeatures.map((f) => `- ${f}`).join("\n")}`);
  }
  if (analysis.keyScreens.length > 0) {
    parts.push(`Key Screens/Views:\n${analysis.keyScreens.map((s) => `- ${s}`).join("\n")}`);
  }
  if (analysis.uiComponents.length > 0) {
    parts.push(`UI Patterns: ${analysis.uiComponents.join(", ")}`);
  }
  if (analysis.userFlows.length > 0) {
    parts.push(`User Flows:\n${analysis.userFlows.map((f) => `- ${f}`).join("\n")}`);
  }
  if (analysis.marketingAngles.length > 0) {
    parts.push(`Suggested Marketing Angles:\n${analysis.marketingAngles.map((a) => `- ${a}`).join("\n")}`);
  }
  if (analysis.monetization && analysis.monetization !== "unknown") {
    parts.push(`Monetization: ${analysis.monetization}`);
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
