"use client";

import { Settings, Key, Bell, Palette } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const hasGoogleKey = !!process.env.NEXT_PUBLIC_APP_URL; // Placeholder check

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Google AI API Key</p>
                <p className="text-xs text-muted-foreground">
                  Used for Gemini, Veo, and Imagen
                </p>
              </div>
              <Badge variant="outline">
                Configured via environment variables
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Supabase</p>
                <p className="text-xs text-muted-foreground">
                  Database and storage
                </p>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification preferences will be available soon
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
