import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Database, Json } from "@/types/database";

type AutopilotConfigInsert = Database["public"]["Tables"]["mkt_autopilot_config"]["Insert"];

const configSchema = z.object({
  is_enabled: z.boolean().optional(),
  auto_generate: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly"]).optional(),
  target_platforms: z.array(z.string()).optional(),
  brand_kit_id: z.string().uuid().optional().nullable(),
  monthly_budget_usd: z.number().min(0).max(10000).optional(),
  content_types: z.array(z.string()).optional(),
  preferred_posting_times: z.record(z.string(), z.array(z.string())).optional(),
  style_preferences: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("mkt_autopilot_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ config: data ?? null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = configSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const serviceClient = createServiceClient();

    const { preferred_posting_times, style_preferences, ...rest } = parsed.data;
    const upsertData: AutopilotConfigInsert = {
      user_id: user.id,
      ...rest,
      ...(preferred_posting_times !== undefined && { preferred_posting_times: preferred_posting_times as Json }),
      ...(style_preferences !== undefined && { style_preferences: style_preferences as Json }),
    };

    const { data, error } = await serviceClient
      .from("mkt_autopilot_config")
      .upsert(upsertData, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ config: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
