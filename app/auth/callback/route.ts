import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidRedirect } from "@/lib/supabase/middleware";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("next") ?? searchParams.get("redirect") ?? "/dashboard";
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Verify admin role before granting access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: roles, error: rolesError } = await supabase.rpc("get_my_roles");

    if (!rolesError && roles) {
      const roleArr = roles as Array<{ role: string }>;
      const isAdmin = roleArr.some((r) => r.role === "admin");
      if (isAdmin) {
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
  }

  // Not an admin — sign out and bounce to login with error
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=not_admin`);
}
