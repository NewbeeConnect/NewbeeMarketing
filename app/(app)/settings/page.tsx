"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Cloud,
  Eye,
  EyeOff,
  Github,
  Key,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  useApiKeys,
  useDeleteApiKeys,
  useSaveApiKeys,
} from "@/hooks/useApiKeys";
import { ChangePasswordSection } from "@/components/settings/ChangePasswordSection";
import { COPY } from "@/lib/i18n/copy";
import { WhatIsThis } from "@/components/ui/WhatIsThis";

/**
 * Hub-designed Settings. Three tabs at the top (API keys / Billing / Team)
 * — only API keys is wired for now. Cards wrap each integration section.
 * Input fields sit on bg-panel with border-line and a brand focus ring.
 */
export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const saveKeys = useSaveApiKeys();
  const deleteKeys = useDeleteApiKeys();

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

  const googleFormDefault = useMemo(() => {
    const gk = apiKeys?.find((k) => k.platform === "google_ads");
    if (gk?.keys_encrypted) {
      const keys = gk.keys_encrypted as Record<string, string>;
      return {
        client_id: keys.client_id || "",
        client_secret: keys.client_secret || "",
        developer_token: keys.developer_token || "",
        refresh_token: keys.refresh_token || "",
      };
    }
    return {
      client_id: "",
      client_secret: "",
      developer_token: "",
      refresh_token: "",
    };
  }, [apiKeys]);

  const metaFormDefault = useMemo(() => {
    const mk = apiKeys?.find((k) => k.platform === "meta_ads");
    if (mk?.keys_encrypted) {
      const keys = mk.keys_encrypted as Record<string, string>;
      return {
        app_id: keys.app_id || "",
        app_secret: keys.app_secret || "",
        access_token: keys.access_token || "",
        ad_account_id: keys.ad_account_id || "",
        page_id: keys.page_id || "",
        instagram_account_id: keys.instagram_account_id || "",
      };
    }
    return {
      app_id: "",
      app_secret: "",
      access_token: "",
      ad_account_id: "",
      page_id: "",
      instagram_account_id: "",
    };
  }, [apiKeys]);

  const githubFormDefault = useMemo(() => {
    const gk = apiKeys?.find((k) => k.platform === "github");
    const keys =
      (gk?.keys_encrypted as Record<string, string> | undefined) ?? {};
    return { personal_access_token: keys.personal_access_token || "" };
  }, [apiKeys]);

  const [googleForm, setGoogleForm] = useState(googleFormDefault);
  const [metaForm, setMetaForm] = useState(metaFormDefault);
  const [githubForm, setGithubForm] = useState(githubFormDefault);

  // These effects resync the form state when the underlying API-key query
  // returns fresh data. setState-in-effect is the idiomatic way to handle
  // external-data rehydration; the rule is disabled here on purpose.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => setGoogleForm(googleFormDefault), [googleFormDefault]);
  useEffect(() => setMetaForm(metaFormDefault), [metaFormDefault]);
  useEffect(() => setGithubForm(githubFormDefault), [githubFormDefault]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const googleOk = apiKeys?.some((k) => k.platform === "google_ads");
  const metaOk = apiKeys?.some((k) => k.platform === "meta_ads");
  const githubOk = apiKeys?.some((k) => k.platform === "github");

  return (
    <div className="max-w-[760px] mx-auto px-6 py-6">
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

      {/* Google Ads */}
      <SettingsSection
        title={COPY.settings.googleAds.title}
        hint={COPY.settings.googleAds.hint}
        loading={keysLoading}
        ok={!!googleOk}
        help={
          <WhatIsThis
            title={COPY.settings.googleAds.whatIsThis.title}
            body={COPY.settings.googleAds.whatIsThis.body}
            bullets={COPY.settings.googleAds.whatIsThis.bullets}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <LabelledInput
            label={COPY.settings.googleAds.fields.clientId}
            value={googleForm.client_id}
            onChange={(v) =>
              setGoogleForm((p) => ({ ...p, client_id: v }))
            }
            placeholder={COPY.settings.googleAds.placeholders.clientId}
          />
          <LabelledInput
            label={COPY.settings.googleAds.fields.clientSecret}
            value={googleForm.client_secret}
            onChange={(v) =>
              setGoogleForm((p) => ({ ...p, client_secret: v }))
            }
            placeholder={COPY.settings.googleAds.placeholders.clientSecret}
            secret
          />
          <LabelledInput
            label={COPY.settings.googleAds.fields.developerToken}
            value={googleForm.developer_token}
            onChange={(v) =>
              setGoogleForm((p) => ({ ...p, developer_token: v }))
            }
            placeholder={COPY.settings.googleAds.placeholders.developerToken}
            secret
          />
          <LabelledInput
            label={COPY.settings.googleAds.fields.refreshToken}
            value={googleForm.refresh_token}
            onChange={(v) =>
              setGoogleForm((p) => ({ ...p, refresh_token: v }))
            }
            placeholder={COPY.settings.googleAds.placeholders.refreshToken}
            secret
          />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          {googleOk && (
            <GhostButton
              onClick={async () => {
                await deleteKeys.mutateAsync("google_ads");
                setGoogleForm({
                  client_id: "",
                  client_secret: "",
                  developer_token: "",
                  refresh_token: "",
                });
                toast.success(COPY.settings.googleAds.removeSuccess);
              }}
            >
              <Trash2 className="h-3 w-3" /> {COPY.settings.buttons.remove}
            </GhostButton>
          )}
          <PrimaryButton
            loading={saveKeys.isPending}
            onClick={async () => {
              if (!googleForm.client_id || !googleForm.developer_token) {
                toast.error(COPY.settings.googleAds.errorRequired);
                return;
              }
              await saveKeys.mutateAsync({
                platform: "google_ads",
                keys: googleForm,
              });
              toast.success(COPY.settings.googleAds.saveSuccess);
            }}
          >
            {COPY.settings.buttons.save}
          </PrimaryButton>
        </div>
      </SettingsSection>

      {/* Meta Ads */}
      <SettingsSection
        title={COPY.settings.metaAds.title}
        hint={COPY.settings.metaAds.hint}
        loading={keysLoading}
        ok={!!metaOk}
        help={
          <WhatIsThis
            title={COPY.settings.metaAds.whatIsThis.title}
            body={COPY.settings.metaAds.whatIsThis.body}
            bullets={COPY.settings.metaAds.whatIsThis.bullets}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <LabelledInput
            label={COPY.settings.metaAds.fields.appId}
            value={metaForm.app_id}
            onChange={(v) => setMetaForm((p) => ({ ...p, app_id: v }))}
            placeholder={COPY.settings.metaAds.placeholders.appId}
          />
          <LabelledInput
            label={COPY.settings.metaAds.fields.appSecret}
            value={metaForm.app_secret}
            onChange={(v) => setMetaForm((p) => ({ ...p, app_secret: v }))}
            placeholder={COPY.settings.metaAds.placeholders.appSecret}
            secret
          />
          <div className="sm:col-span-2">
            <LabelledInput
              label={COPY.settings.metaAds.fields.accessToken}
              value={metaForm.access_token}
              onChange={(v) =>
                setMetaForm((p) => ({ ...p, access_token: v }))
              }
              placeholder={COPY.settings.metaAds.placeholders.accessToken}
              secret
            />
          </div>
          <LabelledInput
            label={COPY.settings.metaAds.fields.adAccountId}
            value={metaForm.ad_account_id}
            onChange={(v) =>
              setMetaForm((p) => ({ ...p, ad_account_id: v }))
            }
            placeholder={COPY.settings.metaAds.placeholders.adAccountId}
          />
          <LabelledInput
            label={COPY.settings.metaAds.fields.pageId}
            value={metaForm.page_id}
            onChange={(v) => setMetaForm((p) => ({ ...p, page_id: v }))}
            placeholder={COPY.settings.metaAds.placeholders.pageId}
          />
          <div className="sm:col-span-2">
            <LabelledInput
              label={COPY.settings.metaAds.fields.instagramAccountId}
              value={metaForm.instagram_account_id}
              onChange={(v) =>
                setMetaForm((p) => ({ ...p, instagram_account_id: v }))
              }
              placeholder={
                COPY.settings.metaAds.placeholders.instagramAccountId
              }
            />
          </div>
        </div>
        <p className="text-[13.5px] ink-3 mt-3">
          {COPY.settings.metaAds.hintRow}
        </p>
        <div className="flex gap-2 justify-end mt-4">
          {metaOk && (
            <GhostButton
              onClick={async () => {
                await deleteKeys.mutateAsync("meta_ads");
                setMetaForm({
                  app_id: "",
                  app_secret: "",
                  access_token: "",
                  ad_account_id: "",
                  page_id: "",
                  instagram_account_id: "",
                });
                toast.success(COPY.settings.metaAds.removeSuccess);
              }}
            >
              <Trash2 className="h-3 w-3" /> {COPY.settings.buttons.remove}
            </GhostButton>
          )}
          <PrimaryButton
            loading={saveKeys.isPending}
            onClick={async () => {
              if (
                !metaForm.app_id ||
                !metaForm.access_token ||
                !metaForm.ad_account_id ||
                !metaForm.page_id ||
                !metaForm.instagram_account_id
              ) {
                toast.error(COPY.settings.metaAds.errorRequired);
                return;
              }
              await saveKeys.mutateAsync({
                platform: "meta_ads",
                keys: metaForm,
              });
              toast.success(COPY.settings.metaAds.saveSuccess);
            }}
          >
            {COPY.settings.buttons.save}
          </PrimaryButton>
        </div>
      </SettingsSection>

      {/* GitHub */}
      <SettingsSection
        title={COPY.settings.github.title}
        hint={COPY.settings.github.hint}
        loading={keysLoading}
        ok={!!githubOk}
        IconOverride={Github}
        help={
          <WhatIsThis
            title={COPY.settings.github.whatIsThis.title}
            body={COPY.settings.github.whatIsThis.body}
            bullets={COPY.settings.github.whatIsThis.bullets}
          />
        }
      >
        <LabelledInput
          label={COPY.settings.github.fields.token}
          value={githubForm.personal_access_token}
          onChange={(v) => setGithubForm({ personal_access_token: v })}
          placeholder={COPY.settings.github.placeholders.token}
          secret
        />
        <div className="flex gap-2 justify-end mt-4">
          {githubOk && (
            <GhostButton
              onClick={async () => {
                await deleteKeys.mutateAsync("github");
                setGithubForm({ personal_access_token: "" });
                toast.success(COPY.settings.github.removeSuccess);
              }}
            >
              <Trash2 className="h-3 w-3" /> {COPY.settings.buttons.remove}
            </GhostButton>
          )}
          <PrimaryButton
            loading={saveKeys.isPending}
            onClick={async () => {
              if (!githubForm.personal_access_token) {
                toast.error(COPY.settings.github.errorRequired);
                return;
              }
              await saveKeys.mutateAsync({
                platform: "github",
                keys: githubForm,
              });
              toast.success(COPY.settings.github.saveSuccess);
            }}
          >
            {COPY.settings.buttons.save}
          </PrimaryButton>
        </div>
      </SettingsSection>

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

function SettingsSection({
  title,
  hint,
  help,
  children,
  loading,
  ok,
  IconOverride,
}: {
  title: string;
  hint: string;
  /** Optional WhatIsThis card rendered under the header. */
  help?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  ok?: boolean;
  IconOverride?: React.ComponentType<{ className?: string }>;
}) {
  const Icon = IconOverride ?? Key;
  return (
    <div className="rounded-xl border border-line bg-panel p-5 mb-4">
      <div className="flex items-start gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-soft text-brand-ink">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16.5px] font-semibold ink">{title}</div>
          <div className="text-[14px] ink-3 mt-0.5">{hint}</div>
        </div>
        {!loading && ok != null && (
          <StatusPill
            ok={ok}
            label={
              ok
                ? COPY.settings.buttons.connected
                : COPY.settings.buttons.notConfigured
            }
          />
        )}
      </div>
      {help && <div className="mb-4">{help}</div>}
      {children}
    </div>
  );
}

function LabelledInput({
  label,
  value,
  onChange,
  placeholder,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-[13.5px] font-medium ink-2">{label}</label>
      <div className="relative">
        <input
          type={secret && !revealed ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-9 px-3 rounded-md border border-line bg-panel text-[14.5px] ink outline-none focus:border-brand ${
            secret ? "pr-10 mono" : ""
          }`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 ink-3 hover:ink transition"
            aria-label={revealed ? "Hide" : "Show"}
          >
            {revealed ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[15px] font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {loading && <Loader2 className="h-3 w-3 nb-spin" />}
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-line bg-panel ink text-[15px] hover:bg-soft transition"
    >
      {children}
    </button>
  );
}

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
