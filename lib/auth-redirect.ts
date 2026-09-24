/**
 * Post-login redirect targets. Pure (no server/client imports) so the proxy,
 * `/auth/callback` and the client-side login form share one validator.
 */

/**
 * Where a signed-in admin lands when no (valid) redirect target is given.
 * `/` redirects here too (`app/page.tsx`).
 */
export const HOME_ROUTE = "/generate";

const ALLOWED_REDIRECT_PREFIXES = [
  "/generate",
  "/library",
  "/analytics",
  "/settings",
];

export function isValidRedirect(path: string): boolean {
  if (!path || !path.startsWith("/")) return false;
  return ALLOWED_REDIRECT_PREFIXES.some((prefix) => path.startsWith(prefix));
}
