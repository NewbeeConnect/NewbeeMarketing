"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "./NotificationBell";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ title, breadcrumbs }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate ${isLast ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      ) : title ? (
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
