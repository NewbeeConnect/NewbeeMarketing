import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { start } from "workflow/api";
import { abTestLifecycleWorkflow } from "@/workflows/ab-test-lifecycle";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  hypothesis: z.string().optional(),
  campaign_id: z.string().uuid().optional(),
  variant_count: z.number().min(2).max(5).optional(),
  allocation_strategy: z.enum(["equal", "thompson_sampling", "epsilon_greedy"]).optional(),
  success_metric: z.enum(["engagement_rate", "clicks", "impressions", "conversions", "ctr"]).optional(),
  confidence_level: z.number().min(0.8).max(0.99).optional(),
  max_duration_days: z.number().min(1).max(90).optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("mkt_ab_tests")
      .select("*, mkt_ab_test_variants(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tests: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const input = parsed.data;

    const { data: test, error } = await serviceClient
      .from("mkt_ab_tests")
      .insert({
        user_id: user.id,
        name: input.name,
        hypothesis: input.hypothesis ?? null,
        campaign_id: input.campaign_id ?? null,
        variant_count: input.variant_count ?? 2,
        allocation_strategy: input.allocation_strategy ?? "thompson_sampling",
        success_metric: input.success_metric ?? "engagement_rate",
        confidence_level: input.confidence_level ?? 0.95,
        max_duration_days: input.max_duration_days ?? 14,
        status: "draft" as const,
      })
      .select("id, user_id, name, status, created_at")
      .single();

    if (error || !test) return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });

    // Create variant placeholders
    const labels = ["A", "B", "C", "D", "E"].slice(0, input.variant_count ?? 2);
    const pct = 1 / labels.length;
    for (const label of labels) {
      await serviceClient.from("mkt_ab_test_variants").insert({
        ab_test_id: test.id,
        label,
        allocation_pct: pct,
      });
    }

    return NextResponse.json({ test }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
