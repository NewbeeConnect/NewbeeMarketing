import { createNewbeeClient } from "@/lib/supabase/server";

export type NewbeeInsights = {
  totalUsers: number;
  activeUsers: number;
  topFeatures: string[];
  topCities: string[];
  upcomingEvents: number;
  totalEvents: number;
};

/**
 * Fetch marketing-relevant insights from Newbee's production database.
 * This uses a read-only client with the Newbee anon key.
 * Returns null if the Newbee Supabase is not configured.
 */
export async function fetchNewbeeInsights(): Promise<NewbeeInsights | null> {
  try {
    const newbeeUrl = process.env.NEWBEE_SUPABASE_URL;
    const newbeeKey = process.env.NEWBEE_SUPABASE_ANON_KEY;

    if (!newbeeUrl || !newbeeKey) {
      console.log("Newbee Supabase not configured, skipping insights");
      return null;
    }

    const supabase = createNewbeeClient();

    // Fetch user count
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch events count
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Fetch upcoming events
    const { count: upcomingEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("date", new Date().toISOString());

    return {
      totalUsers: totalUsers ?? 0,
      activeUsers: 0, // Would need analytics table
      topFeatures: ["Event Discovery", "Community Chat", "City Guides"],
      topCities: ["Berlin", "Munich", "Hamburg", "Frankfurt"],
      upcomingEvents: upcomingEvents ?? 0,
      totalEvents: totalEvents ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch Newbee insights:", error);
    return null;
  }
}
