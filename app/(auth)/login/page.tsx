"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "not_admin") {
      toast.error("Access denied. This portal is for admins only.");
    } else if (error === "auth_failed") {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const redirectTo = searchParams.get("redirect") ?? "/generate";
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-app flex items-center justify-center p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 10%, oklch(0.96 0.045 85) 0%, transparent 40%), radial-gradient(circle at 80% 90%, oklch(0.97 0.04 75) 0%, transparent 40%)",
      }}
    >
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden relative mb-3 shadow-card">
            <Image
              src="/newbee-logo.png"
              alt="Newbee"
              fill
              sizes="64px"
              priority
              className="object-cover"
            />
          </div>
          <div className="serif text-[24px] ink">Newbee Marketing Hub</div>
          <div className="text-[12.5px] ink-3 mt-1 whitespace-nowrap">
            Admin access only
          </div>
        </div>

        <div className="bg-panel rounded-xl border border-line p-6 shadow-card">
          <div className="text-[14px] font-semibold ink">Sign in</div>
          <div className="text-[12px] ink-3 mt-0.5">
            Admin credentials only. No public sign-up.
          </div>

          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="login-email"
                className="text-[12px] font-medium ink-2"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@newbee.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 px-3 mt-1 rounded-md border border-line bg-panel text-[13px] ink outline-none focus:border-brand"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="text-[12px] font-medium ink-2"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-9 px-3 mt-1 rounded-md border border-line bg-panel text-[13px] ink outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg inline-flex items-center justify-center gap-1.5 text-[13.5px] font-semibold bg-brand text-brand-ink hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 nb-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] ink-3 mt-6">
          Not an admin?{" "}
          <a className="text-brand-ink underline" href="mailto:admin@newbee.app">
            Request access
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
