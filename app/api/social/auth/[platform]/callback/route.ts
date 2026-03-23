import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForToken, saveSocialAccount, OAUTH_CONFIGS } from "@/lib/social/oauth-manager";
import type { SocialPlatform } from "@/lib/social/types";

type RouteContext = { params: Promise<{ platform: string }> };

/** GET: OAuth callback — exchange code for token and save account */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { platform } = await params;
    if (!(platform in OAUTH_CONFIGS)) {
      return NextResponse.redirect(new URL("/social/accounts?error=unsupported_platform", request.url));
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error || !code) {
      console.warn(`[OAuth] Failed for user ${user.id} on ${platform}: ${error ?? "no_code"}`);
      return NextResponse.redirect(new URL(`/social/accounts?error=${error ?? "no_code"}`, request.url));
    }

    // CSRF check — retrieve and immediately consume state cookie
    const state = url.searchParams.get("state");
    const storedState = request.cookies.get(`oauth_state_${platform}`)?.value;
    if (!state || state !== storedState) {
      console.warn(`[OAuth] CSRF mismatch for user ${user.id} on ${platform}`);
      return NextResponse.redirect(new URL("/social/accounts?error=csrf_mismatch", request.url));
    }

    // Retrieve PKCE verifier if stored (Twitter)
    const codeVerifier = request.cookies.get(`oauth_pkce_${platform}`)?.value;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const config = OAUTH_CONFIGS[platform as SocialPlatform];
    const redirectUri = `${appUrl}${config.callbackPath}`;

    // Exchange code for tokens (with PKCE verifier for Twitter)
    const tokens = await exchangeCodeForToken(
      platform as SocialPlatform, code, redirectUri, codeVerifier
    );

    // Get account info — tokens passed via Authorization header, NOT URL params
    const accountInfo = await getAccountInfo(platform as SocialPlatform, tokens.access_token);

    // Save to database
    const serviceClient = createServiceClient();
    const result = await saveSocialAccount(
      serviceClient,
      user.id,
      platform as SocialPlatform,
      accountInfo.name,
      accountInfo.id,
      tokens,
      {
        profileUrl: accountInfo.profileUrl,
        avatarUrl: accountInfo.avatarUrl,
        scopes: config.scopes,
      }
    );

    if (!result.success) {
      return NextResponse.redirect(new URL(`/social/accounts?error=${encodeURIComponent(result.error ?? "save_failed")}`, request.url));
    }

    // Clear all OAuth cookies and redirect to success
    const response = NextResponse.redirect(new URL("/social/accounts?success=true", request.url));
    response.cookies.delete(`oauth_state_${platform}`);
    response.cookies.delete(`oauth_pkce_${platform}`);
    return response;
  } catch (e) {
    console.error(`[OAuth Callback] Error:`, e);
    return NextResponse.redirect(new URL(`/social/accounts?error=exchange_failed`, request.url));
  }
}

/**
 * Get account info from platform.
 * SECURITY: Token is ALWAYS passed via Authorization header, never in URL params.
 */
async function getAccountInfo(platform: SocialPlatform, accessToken: string): Promise<{
  id: string; name: string; profileUrl?: string; avatarUrl?: string;
}> {
  const authHeaders = { "Authorization": `Bearer ${accessToken}` };

  switch (platform) {
    case "instagram":
    case "facebook": {
      // Meta Graph API — token in header, not URL
      const res = await fetch("https://graph.facebook.com/v22.0/me?fields=id,name,picture", {
        headers: authHeaders,
      });
      const data = await res.json() as { id: string; name: string; picture?: { data?: { url?: string } } };
      return { id: data.id, name: data.name, avatarUrl: data.picture?.data?.url };
    }
    case "tiktok": {
      const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
        headers: authHeaders,
      });
      const data = await res.json() as { data: { user: { open_id: string; display_name: string; avatar_url: string } } };
      return { id: data.data.user.open_id, name: data.data.user.display_name, avatarUrl: data.data.user.avatar_url };
    }
    case "youtube": {
      const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: authHeaders,
      });
      const data = await res.json() as { items: Array<{ id: string; snippet: { title: string; thumbnails?: { default?: { url: string } } } }> };
      const ch = data.items[0];
      return { id: ch?.id ?? "", name: ch?.snippet.title ?? "YouTube Channel", avatarUrl: ch?.snippet.thumbnails?.default?.url };
    }
    case "twitter": {
      const res = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url", {
        headers: authHeaders,
      });
      const data = await res.json() as { data: { id: string; name: string; username: string; profile_image_url?: string } };
      return { id: data.data.id, name: `@${data.data.username}`, profileUrl: `https://x.com/${data.data.username}`, avatarUrl: data.data.profile_image_url };
    }
    case "linkedin": {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: authHeaders,
      });
      const data = await res.json() as { sub: string; name: string; picture?: string };
      return { id: data.sub, name: data.name, avatarUrl: data.picture };
    }
    default:
      return { id: "unknown", name: platform };
  }
}
