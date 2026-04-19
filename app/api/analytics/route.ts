import { NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/analytics
 *
 * Team-wide usage + cost rollup for the last 12 months. Uses the service-
 * role client so every admin sees the same numbers (same philosophy as the
 * shared library). Admin gating is handled by the middleware upstream.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const since = twelveMonthsAgo.toISOString();

    const [{ data: usageLogs, error: usageError }, { data: generations, error: genError }] =
      await Promise.all([
        serviceClient
          .from("mkt_usage_logs")
          .select("api_service, estimated_cost_usd, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5000),
        serviceClient
          .from("mkt_generations")
          .select("type, status")
          .gte("created_at", since)
          .limit(5000),
      ]);

    if (usageError) throw usageError;
    if (genError) throw genError;

    const logs = usageLogs ?? [];
    const gens = generations ?? [];

    const costByService: Record<"gemini" | "veo" | "imagen" | "tts", number> = {
      gemini: 0,
      veo: 0,
      imagen: 0,
      tts: 0,
    };
    let totalSpent = 0;
    const monthlyMap = new Map<string, number>();

    for (const log of logs) {
      const cost = log.estimated_cost_usd ?? 0;
      totalSpent += cost;
      const service = log.api_service as keyof typeof costByService;
      if (service in costByService) costByService[service] += cost;
      const createdAt = log.created_at ?? "";
      if (createdAt) {
        const month = createdAt.substring(0, 7);
        monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + cost);
      }
    }

    const monthlySpend = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      totalSpent,
      costByService,
      generationStats: {
        total: gens.length,
        completed: gens.filter((g) => g.status === "completed").length,
        failed: gens.filter((g) => g.status === "failed").length,
        videoCount: gens.filter((g) => g.type === "video").length,
        imageCount: gens.filter((g) => g.type === "image").length,
      },
      monthlySpend,
    });
  } catch (err) {
    console.error("[analytics] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analytics failed" },
      { status: 500 }
    );
  }
}
