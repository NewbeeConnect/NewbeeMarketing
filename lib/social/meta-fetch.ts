/**
 * Shared Meta Graph API fetch utility
 *
 * Used by both Instagram and Facebook adapters to avoid duplication.
 * Wraps fetch() with auth headers and error handling for Meta API v22.0.
 */

export const META_API_BASE = "https://graph.facebook.com/v22.0";

export async function metaFetch<T>(
  path: string,
  token: string,
  platform: "Instagram" | "Facebook",
  options?: RequestInit
): Promise<T> {
  const url = path.startsWith("http") ? path : `${META_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${platform} API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Exchange a short-lived Meta token for a long-lived one.
 * Shared by both Instagram and Facebook refreshToken implementations.
 */
export async function refreshMetaToken(
  currentToken: string,
  platform: "Instagram" | "Facebook"
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(`${META_API_BASE}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: currentToken,
    }),
  });
  if (!res.ok) throw new Error(`${platform} token refresh failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}
