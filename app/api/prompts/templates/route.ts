import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  template_text: z.string().min(10),
  platform: z.string().optional().nullable(),
  content_format: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  few_shot_examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("mkt_prompt_templates")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("performance_score", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("mkt_prompt_templates")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        template_text: parsed.data.template_text,
        platform: parsed.data.platform ?? null,
        content_format: parsed.data.content_format ?? null,
        variables: parsed.data.variables ?? [],
        few_shot_examples: parsed.data.few_shot_examples ?? [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
