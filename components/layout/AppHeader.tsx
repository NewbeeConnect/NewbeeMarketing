"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "./NotificationBell";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      {title && (
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
