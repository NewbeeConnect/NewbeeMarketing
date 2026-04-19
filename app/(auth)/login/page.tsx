"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { COPY } from "@/lib/i18n/copy";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "not_admin") {
      toast.error(COPY.login.errors.notAdmin);
    } else if (error === "auth_failed") {
      toast.error(COPY.login.errors.authFailed);
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
      toast.error(COPY.login.errors.generic);
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
          <div className="serif text-[30px] ink">{COPY.login.brand}</div>
          <div className="text-[14.5px] ink-3 mt-1 whitespace-nowrap">
            {COPY.login.subBrand}
          </div>
        </div>

        <div className="bg-panel rounded-xl border border-line p-6 shadow-card">
          <div className="text-[16.5px] font-semibold ink">
            {COPY.login.cardTitle}
          </div>
          <div className="text-[14px] ink-3 mt-0.5">{COPY.login.cardSub}</div>

          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="login-email"
                className="text-[14px] font-medium ink-2"
              >
                {COPY.login.emailLabel}
              </label>
              <input
                id="login-email"
                type="email"
                placeholder={COPY.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-9 px-3 mt-1 rounded-md border border-line bg-panel text-[15px] ink outline-none focus:border-brand"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="text-[14px] font-medium ink-2"
              >
                {COPY.login.passwordLabel}
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-9 px-3 mt-1 rounded-md border border-line bg-panel text-[15px] ink outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg btn-primary w-full"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 nb-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {loading ? COPY.login.signingIn : COPY.login.signIn}
            </button>
          </form>
        </div>

        <div className="text-center text-[13px] ink-3 mt-6">
          {COPY.login.requestAccess}{" "}
          <a className="text-brand-ink underline" href="mailto:admin@newbee.app">
            {COPY.login.requestAccessLink}
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
