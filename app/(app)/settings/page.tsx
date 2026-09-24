"use client";

import { useEffect, useState } from "react";
import { Check, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChangePasswordSection } from "@/components/settings/ChangePasswordSection";
import { COPY } from "@/lib/i18n/copy";
import { WhatIsThis } from "@/components/ui/WhatIsThis";

/**
 * Hub-designed Settings: account status, password change, and a read-only
 * list of the server-side services. The old Google Ads / Meta Ads / GitHub
 * key forms were removed — nothing in the app consumed those keys, and they
 * were stored unencrypted (see CLAUDE.md, `mkt_api_keys`).
 */
export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setSupabaseOk(!!data.user);
        setUserEmail(data.user?.email ?? null);
      })
      .catch(() => {
        if (mounted) setSupabaseOk(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-[960px] mx-auto px-6 py-6">
      <div className="mb-5">
        <div className="serif text-[34px] ink">
          {COPY.settings.pageTitle}
        </div>
        <div className="text-[14.5px] ink-3 mt-0.5">
          {COPY.settings.pageSub}
        </div>
      </div>

      <div className="mb-4">
        <WhatIsThis
          title={COPY.settings.whatIsThis.title}
          body={COPY.settings.whatIsThis.body}
          bullets={COPY.settings.whatIsThis.bullets}
        />
      </div>

      {/* Account card */}
      <div className="rounded-xl border border-line bg-panel p-5 mb-4">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-soft text-brand-ink">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[16.5px] font-semibold ink">
              {COPY.settings.account.title}
            </div>
            <div className="text-[14px] ink-3 mt-0.5">
              {COPY.settings.account.signedInAs(
                userEmail ?? COPY.settings.account.signedInPlaceholder
              )}
            </div>
          </div>
          <div className="ml-auto">
            <StatusPill
              ok={supabaseOk === true}
              label={
                supabaseOk === null
                  ? COPY.settings.account.statusChecking
                  : supabaseOk
                  ? COPY.settings.account.statusAuthenticated
                  : COPY.settings.account.statusSignedOut
              }
            />
          </div>
        </div>
      </div>

      <ChangePasswordSection />

      {/* Services info */}
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-soft text-brand-ink">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[16.5px] font-semibold ink">
              {COPY.settings.services.title}
            </div>
            <div className="text-[14px] ink-3 mt-0.5">
              {COPY.settings.services.sub}
            </div>
          </div>
        </div>
        <ul className="space-y-2 text-[14.5px]">
          {COPY.settings.services.items.map((svc) => (
            <li key={svc.name} className="flex justify-between gap-3">
              <span className="ink">{svc.name}</span>
              <span className="ink-3 text-right">{svc.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Sub-primitives ────────────────────────────────────────────────────

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 h-6 text-[13px] rounded-md border"
      style={
        ok
          ? {
              background: "var(--nb-success-soft)",
              borderColor: "transparent",
              color: "var(--nb-success-ink)",
            }
          : {
              background: "var(--nb-soft)",
              borderColor: "var(--nb-line-2)",
              color: "var(--nb-ink-2)",
            }
      }
    >
      <Check className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
