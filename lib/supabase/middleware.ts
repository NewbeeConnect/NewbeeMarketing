import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Versioned cookie name — bump the suffix to flush stale caches.
const ROLE_COOKIE_NAME = "x-mkt-role-v1";
const ROLE_COOKIE_MAX_AGE = 10 * 60; // 10 minutes

/**
 * Normalize `get_my_roles()` RPC response into a flat string array.
 * Canonical shape is `[{role: "admin"}]` (RETURNS TABLE (role text)), but we
 * defensively accept other shapes in case of signature drift.
 */
function normalizeRolesResponse(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === "string") return [raw];
  if (Array.isArray(raw)) {
    return raw
      .map((r) => {
        if (typeof r === "string") return r;
        if (r && typeof r === "object" && "role" in r) {
          const v = (r as { role: unknown }).role;
          return typeof v === "string" ? v : null;
        }
        return null;
      })
      .filter((r): r is string => r !== null);
  }
  if (typeof raw === "object" && "role" in raw) {
    const v = (raw as { role: unknown }).role;
    return typeof v === "string" ? [v] : [];
  }
  return [];
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' ${supabaseUrl} https://*.supabase.co https://lh3.googleusercontent.com data: blob:`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseUrl} https://generativelanguage.googleapis.com https://accounts.google.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/download");

  // Unauthenticated — clear role cookie, redirect to /login for protected routes
  if (!user) {
    if (request.cookies.has(ROLE_COOKIE_NAME)) {
      supabaseResponse.cookies.delete(ROLE_COOKIE_NAME);
    }

    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      if (pathname !== "/" && isValidRedirect(pathname)) {
        url.searchParams.set("redirect", pathname + request.nextUrl.search);
      }
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Authenticated — verify admin role (cached 10 min in cookie)
  if (user && !isPublicRoute) {
    const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    const validCached = roleCookie === "admin";

    let isAdmin = false;

    if (validCached) {
      isAdmin = true;
    } else {
      if (roleCookie) {
        supabaseResponse.cookies.delete(ROLE_COOKIE_NAME);
      }

      const { data: rolesRaw, error: rolesError } =
        await supabase.rpc("get_my_roles");

      if (rolesError) {
        // RPC failure (cold start, network) — allow through, client-side hook will re-check
        console.warn(
          "[middleware] get_my_roles RPC errored, allowing through:",
          rolesError.message,
          "user:",
          user.id
        );
        return addSecurityHeaders(supabaseResponse);
      }

      const roleStrings = normalizeRolesResponse(rolesRaw);
      isAdmin = roleStrings.includes("admin");

      if (!isAdmin) {
        // Fallback: direct table query in case RPC drifted
        const { data: directRows, error: directError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");

        if (directError) {
          console.warn(
            "[middleware] role fallback query errored, allowing through:",
            directError.message,
            "user:",
            user.id
          );
          return addSecurityHeaders(supabaseResponse);
        }

        isAdmin = (directRows ?? []).length > 0;

        if (isAdmin) {
          console.error(
            "[middleware] get_my_roles returned no role but user_roles has admin. RPC drift likely. user:",
            user.id
          );
        } else {
          console.warn(
            "[middleware] user has no admin role. user:",
            user.id,
            "rpcRaw:",
            JSON.stringify(rolesRaw)
          );
        }
      }

      if (isAdmin) {
        supabaseResponse.cookies.set(ROLE_COOKIE_NAME, "admin", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: ROLE_COOKIE_MAX_AGE,
          path: "/",
        });
      }
    }

    if (!isAdmin) {
      supabaseResponse.cookies.delete(ROLE_COOKIE_NAME);
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "not_admin");
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Authenticated admin on /login → send to dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  return addSecurityHeaders(supabaseResponse);
}
