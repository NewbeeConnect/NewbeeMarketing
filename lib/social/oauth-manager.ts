/**
 * Social Platform OAuth Manager
 *
 * Manages OAuth tokens for social media platforms.
 * Extends the existing key-store pattern (AES-256-GCM encryption).
 * Tokens are stored in mkt_social_accounts table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SocialPlatform, SocialOAuthTokens } from "./types";
import { encryptJson, decryptJson, isEncryptionConfigured } from "@/lib/encryption";
import { randomBytes, createHash } from "crypto";

// ─── PKCE Helpers (for Twitter OAuth 2.0) ───────────────────────────────────

/** Generate cryptographically random PKCE code verifier (43-128 chars, URL-safe) */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** Derive S256 code challenge from verifier */
export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

type ServiceClient = SupabaseClient<Database>;

// ─── OAuth Configuration per Platform ───────────────────────────────────────

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
  scopes: string[];
  callbackPath: string;
}

export const OAUTH_CONFIGS: Record<SocialPlatform, OAuthConfig> = {
  instagram: {
    authorizationUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
    clientIdEnvVar: "META_APP_ID",
    clientSecretEnvVar: "META_APP_SECRET",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
    ],
    callbackPath: "/api/social/auth/instagram/callback",
  },
  facebook: {
    authorizationUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
    clientIdEnvVar: "META_APP_ID",
    clientSecretEnvVar: "META_APP_SECRET",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_read_user_content",
    ],
    callbackPath: "/api/social/auth/facebook/callback",
  },
  tiktok: {
    authorizationUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnvVar: "TIKTOK_CLIENT_KEY",
    clientSecretEnvVar: "TIKTOK_CLIENT_SECRET",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    callbackPath: "/api/social/auth/tiktok/callback",
  },
  youtube: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnvVar: "YOUTUBE_CLIENT_ID",
    clientSecretEnvVar: "YOUTUBE_CLIENT_SECRET",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    callbackPath: "/api/social/auth/youtube/callback",
  },
  twitter: {
    authorizationUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    clientIdEnvVar: "TWITTER_CLIENT_ID",
    clientSecretEnvVar: "TWITTER_CLIENT_SECRET",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    callbackPath: "/api/social/auth/twitter/callback",
  },
  linkedin: {
    authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnvVar: "LINKEDIN_CLIENT_ID",
    clientSecretEnvVar: "LINKEDIN_CLIENT_SECRET",
    scopes: ["openid", "profile", "w_member_social"],
    callbackPath: "/api/social/auth/linkedin/callback",
  },
};

// ─── Build Authorization URL ────────────────────────────────────────────────

export function buildAuthorizationUrl(
  platform: SocialPlatform,
  state: string,
  redirectUri: string
): { url: string; codeVerifier?: string } {
  const config = OAUTH_CONFIGS[platform];
  const clientId = process.env[config.clientIdEnvVar];

  if (!clientId) {
    throw new Error(`Missing environment variable: ${config.clientIdEnvVar}`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(platform === "tiktok" ? "," : " "),
    response_type: "code",
    state,
  });

  let codeVerifier: string | undefined;

  // Twitter requires PKCE with S256 challenge
  if (platform === "twitter") {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  if (platform === "tiktok") {
    // TikTok uses client_key instead of client_id
    params.delete("client_id");
    params.set("client_key", clientId);
  }

  return { url: `${config.authorizationUrl}?${params.toString()}`, codeVerifier };
}

// ─── Exchange Code for Token ────────────────────────────────────────────────

export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<SocialOAuthTokens> {
  const config = OAUTH_CONFIGS[platform];
  const clientId = process.env[config.clientIdEnvVar];
  const clientSecret = process.env[config.clientSecretEnvVar];

  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${platform}`);
  }

  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  };

  // Platform-specific token exchange params
  if (platform === "tiktok") {
    body.client_key = clientId;
    body.client_secret = clientSecret;
  } else if (platform === "twitter") {
    body.client_id = clientId;
    if (codeVerifier) body.code_verifier = codeVerifier;
  } else {
    body.client_id = clientId;
    body.client_secret = clientSecret;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Twitter uses Basic auth header
  if (platform === "twitter") {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed for ${platform}: ${response.status} ${errorText}`);
  }

  return (await response.json()) as SocialOAuthTokens;
}

// ─── Store Social Account Tokens ────────────────────────────────────────────

export async function saveSocialAccount(
  serviceClient: ServiceClient,
  userId: string,
  platform: SocialPlatform,
  accountName: string,
  accountId: string,
  tokens: SocialOAuthTokens,
  extra?: {
    profileUrl?: string;
    avatarUrl?: string;
    scopes?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isEncryptionConfigured()) {
    return { success: false, error: "Encryption is not configured. Set ENCRYPTION_KEY." };
  }

  const tokensEncrypted = encryptJson(tokens);
  const tokenExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error } = await serviceClient
    .from("mkt_social_accounts")
    .upsert(
      {
        user_id: userId,
        platform,
        account_name: accountName,
        account_id: accountId,
        tokens_encrypted: tokensEncrypted,
        token_expires_at: tokenExpiresAt,
        scopes: extra?.scopes ?? [],
        profile_url: extra?.profileUrl ?? null,
        avatar_url: extra?.avatarUrl ?? null,
        metadata: (extra?.metadata ?? {}) as Database["public"]["Tables"]["mkt_social_accounts"]["Insert"]["metadata"],
        is_active: true,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,account_id" }
    );

  if (error) {
    console.error(`[OAuthManager] Failed to save ${platform} account:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Retrieve Social Account Tokens ─────────────────────────────────────────

export async function getSocialAccountTokens(
  serviceClient: ServiceClient,
  userId: string,
  platform: SocialPlatform
): Promise<SocialOAuthTokens | null> {
  const { data, error } = await serviceClient
    .from("mkt_social_accounts")
    .select("tokens_encrypted, token_expires_at, is_active")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  if (!isEncryptionConfigured()) {
    console.error("[OAuthManager] ENCRYPTION_KEY not configured.");
    return null;
  }

  try {
    return decryptJson<SocialOAuthTokens>(data.tokens_encrypted);
  } catch (e) {
    console.error(`[OAuthManager] Failed to decrypt ${platform} tokens:`, e);
    return null;
  }
}

// ─── List Connected Accounts ────────────────────────────────────────────────

export async function listSocialAccounts(
  serviceClient: ServiceClient,
  userId: string
) {
  const { data, error } = await serviceClient
    .from("mkt_social_accounts")
    .select("id, platform, account_name, account_id, profile_url, avatar_url, is_active, scopes, last_synced_at, token_expires_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[OAuthManager] Failed to list accounts:", error);
    return [];
  }

  return data ?? [];
}

// ─── Disconnect Account ─────────────────────────────────────────────────────

export async function disconnectSocialAccount(
  serviceClient: ServiceClient,
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await serviceClient
    .from("mkt_social_accounts")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", accountId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Check if Token is Expired ──────────────────────────────────────────────

export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now() - 5 * 60 * 1000; // 5 min buffer
}
