import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { listSocialAccounts, disconnectSocialAccount } from "@/lib/social/oauth-manager";
import { checkRateLimit } from "@/lib/rate-limit";

/** GET: List connected social accounts */
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return NextResponse.json({ error: rl.error }, { status: 429 });

    const accounts = await listSocialAccounts(serviceClient, user.id);

    return NextResponse.json({ accounts });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** DELETE: Disconnect a social account */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accountId } = await request.json();
    if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

    const serviceClient = createServiceClient();
    const result = await disconnectSocialAccount(serviceClient, user.id, accountId);

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
