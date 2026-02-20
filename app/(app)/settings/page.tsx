"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Bell,
  Database,
  Cloud,
  CheckCircle,
  XCircle,
  ExternalLink,
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setSupabaseOk(!!data.user);
        setUserEmail(data.user?.email ?? null);
      })
      .catch(() => setSupabaseOk(false));
  }, []);

  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

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
