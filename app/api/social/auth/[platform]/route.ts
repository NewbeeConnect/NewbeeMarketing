import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { buildAuthorizationUrl, OAUTH_CONFIGS } from "@/lib/social/oauth-manager";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { SocialPlatform } from "@/lib/social/types";
import { randomBytes } from "crypto";

type RouteContext = { params: Promise<{ platform: string }> };

/** GET: Redirect to platform OAuth authorization page */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { platform } = await params;

    if (!(platform in OAUTH_CONFIGS)) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit OAuth initiation
    const serviceClient = createServiceClient();
    const rl = await checkRateLimit(serviceClient, user.id, "api-general");
    if (!rl.allowed) return rateLimitResponse(rl);

    const state = randomBytes(32).toString("hex");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const config = OAUTH_CONFIGS[platform as SocialPlatform];
    const redirectUri = `${appUrl}${config.callbackPath}`;

    const { url: authUrl, codeVerifier } = buildAuthorizationUrl(
      platform as SocialPlatform, state, redirectUri
    );

    const response = NextResponse.redirect(authUrl);

    // Store state in cookie for CSRF protection
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      sameSite: "lax",
    });

    // Store PKCE verifier for Twitter
    if (codeVerifier) {
      response.cookies.set(`oauth_pkce_${platform}`, codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 600,
        sameSite: "lax",
      });
    }

    return response;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
