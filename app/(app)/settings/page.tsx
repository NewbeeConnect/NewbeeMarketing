"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiKeys, useSaveApiKeys, useDeleteApiKeys } from "@/hooks/useApiKeys";
import { toast } from "sonner";
import {
  Key,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  ExternalLink,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-red-50 text-red-700 border-red-300"
      }
    >
      {ok ? (
        <CheckCircle className="h-3 w-3 mr-1" />
      ) : (
        <XCircle className="h-3 w-3 mr-1" />
      )}
      {label ?? (ok ? "Connected" : "Not configured")}
    </Badge>
  );
}

export default function SettingsPage() {
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const saveKeys = useSaveApiKeys();
  const deleteKeys = useDeleteApiKeys();

  const googleFormDefault = useMemo(() => {
    const gk = apiKeys?.find((k) => k.platform === "google_ads");
    if (gk?.keys_encrypted) {
      const keys = gk.keys_encrypted as Record<string, string>;
      return { client_id: keys.client_id || "", client_secret: keys.client_secret || "", developer_token: keys.developer_token || "", refresh_token: keys.refresh_token || "" };
    }
    return { client_id: "", client_secret: "", developer_token: "", refresh_token: "" };
  }, [apiKeys]);

  const metaFormDefault = useMemo(() => {
    const mk = apiKeys?.find((k) => k.platform === "meta_ads");
    if (mk?.keys_encrypted) {
      const keys = mk.keys_encrypted as Record<string, string>;
      return { app_id: keys.app_id || "", app_secret: keys.app_secret || "", access_token: keys.access_token || "" };
    }
    return { app_id: "", app_secret: "", access_token: "" };
  }, [apiKeys]);

  const [googleForm, setGoogleForm] = useState(googleFormDefault);
  const [metaForm, setMetaForm] = useState(metaFormDefault);

  // Sync form state when API keys load
  useEffect(() => { setGoogleForm(googleFormDefault); }, [googleFormDefault]);
  useEffect(() => { setMetaForm(metaFormDefault); }, [metaFormDefault]);

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
    return () => { mounted = false; };
  }, []);

  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const googleConfigured = apiKeys?.some((k) => k.platform === "google_ads");
  const metaConfigured = apiKeys?.some((k) => k.platform === "meta_ads");

  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your Marketing Hub
          </p>
        </div>

        {/* User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Logged in as</p>
                <p className="text-xs text-muted-foreground">
                  {userEmail ?? "Loading..."}
                </p>
              </div>
              <StatusBadge
                ok={supabaseOk === true}
                label={supabaseOk === null ? "Checking..." : supabaseOk ? "Authenticated" : "Not signed in"}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigRow
              title="Supabase"
              description="Database, auth, and file storage"
              ok={hasSupabaseUrl}
            />
            <ConfigRow
              title="Google AI API Key"
              description="Gemini, Veo 3.1, Imagen 4 (server-side env)"
              ok={null}
              label="Server-side only"
            />
            <ConfigRow
              title="Google Cloud Project"
              description="Cloud TTS, Cloud Run workers"
              ok={null}
              label="Server-side only"
            />
            <ConfigRow
              title="Newbee Supabase"
              description="Read-only access for marketing insights"
              ok={null}
              label="Optional"
            />
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4" />
              Connected Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ServiceRow
              title="Gemini 2.5 Pro / Flash"
              description="Strategy, scenes, prompt optimization, captions"
            />
            <ServiceRow
              title="Veo 3.1"
              description="AI video generation (async)"
            />
            <ServiceRow
              title="Imagen 4"
              description="AI image and thumbnail generation"
            />
            <ServiceRow
              title="Google Cloud TTS"
              description="Text-to-speech voiceover (Studio/Neural2 voices)"
            />
          </CardContent>
        </Card>

        {/* Ad Platform API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google Ads API Keys
                </CardTitle>
                <CardDescription>Enter your own keys to publish real campaigns</CardDescription>
              </div>
              {!keysLoading && (
                <StatusBadge ok={!!googleConfigured} label={googleConfigured ? "Connected" : "Simulation mode"} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Client ID *</Label>
                <Input size={1} placeholder="Client ID" value={googleForm.client_id} onChange={(e) => setGoogleForm((p) => ({ ...p, client_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client Secret</Label>
                <Input size={1} type="password" placeholder="Client Secret" value={googleForm.client_secret} onChange={(e) => setGoogleForm((p) => ({ ...p, client_secret: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Developer Token *</Label>
                <Input size={1} type="password" placeholder="Developer Token" value={googleForm.developer_token} onChange={(e) => setGoogleForm((p) => ({ ...p, developer_token: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Refresh Token</Label>
                <Input size={1} type="password" placeholder="Refresh Token" value={googleForm.refresh_token} onChange={(e) => setGoogleForm((p) => ({ ...p, refresh_token: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {googleConfigured && (
                <Button variant="outline" size="sm" onClick={async () => { await deleteKeys.mutateAsync("google_ads"); setGoogleForm({ client_id: "", client_secret: "", developer_token: "", refresh_token: "" }); toast.success("Google Ads keys removed"); }}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              )}
              <Button size="sm" onClick={async () => { if (!googleForm.client_id || !googleForm.developer_token) { toast.error("Client ID and Developer Token required"); return; } await saveKeys.mutateAsync({ platform: "google_ads", keys: googleForm }); toast.success("Google Ads keys saved"); }} disabled={saveKeys.isPending}>
                {saveKeys.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Meta Ads API Keys
                </CardTitle>
                <CardDescription>Facebook &amp; Instagram ad publishing</CardDescription>
              </div>
              {!keysLoading && (
                <StatusBadge ok={!!metaConfigured} label={metaConfigured ? "Connected" : "Simulation mode"} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">App ID *</Label>
                <Input size={1} placeholder="Meta App ID" value={metaForm.app_id} onChange={(e) => setMetaForm((p) => ({ ...p, app_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">App Secret</Label>
                <Input size={1} type="password" placeholder="App Secret" value={metaForm.app_secret} onChange={(e) => setMetaForm((p) => ({ ...p, app_secret: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Access Token *</Label>
                <Input size={1} type="password" placeholder="Long-lived Access Token" value={metaForm.access_token} onChange={(e) => setMetaForm((p) => ({ ...p, access_token: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {metaConfigured && (
                <Button variant="outline" size="sm" onClick={async () => { await deleteKeys.mutateAsync("meta_ads"); setMetaForm({ app_id: "", app_secret: "", access_token: "" }); toast.success("Meta Ads keys removed"); }}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              )}
              <Button size="sm" onClick={async () => { if (!metaForm.app_id || !metaForm.access_token) { toast.error("App ID and Access Token required"); return; } await saveKeys.mutateAsync({ platform: "meta_ads", keys: metaForm }); toast.success("Meta Ads keys saved"); }} disabled={saveKeys.isPending}>
                {saveKeys.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">App URL</p>
                <p className="text-xs text-muted-foreground">
                  {process.env.NEXT_PUBLIC_APP_URL ?? "Not set"}
                </p>
              </div>
              <StatusBadge ok={hasAppUrl} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Framework</p>
                <p className="text-xs text-muted-foreground">
                  Next.js 16 + React 19 + TypeScript 5
                </p>
              </div>
              <Badge variant="outline">Production Ready</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Vercel Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              Vercel Deployment Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>
                Connect GitHub repo{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  NewbeeConnect/NewbeeMarketing
                </code>
              </li>
              <li>
                Set environment variables in Vercel dashboard:
                <ul className="ml-5 mt-1 space-y-0.5 list-disc">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY</li>
                  <li>GOOGLE_API_KEY</li>
                  <li>GOOGLE_CLOUD_PROJECT</li>
                  <li>NEXT_PUBLIC_APP_URL (your Vercel domain)</li>
                </ul>
              </li>
              <li>
                Add Vercel domain to Supabase Auth redirect URLs
              </li>
              <li>Deploy and verify auth callback works</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ConfigRow({
  title,
  description,
  ok,
  label,
}: {
  title: string;
  description: string;
  ok: boolean | null;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {ok !== null ? (
        <StatusBadge ok={ok} label={label} />
      ) : (
        <Badge variant="outline">{label ?? "Unknown"}</Badge>
      )}
    </div>
  );
}

function ServiceRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary" className="text-xs">
        Google Cloud
      </Badge>
    </div>
  );
}
