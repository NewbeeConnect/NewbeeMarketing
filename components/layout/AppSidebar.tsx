"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  FolderOpen,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/generate", label: "Generate", Icon: Sparkles },
  { href: "/library", label: "Library", Icon: FolderOpen },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
] as const;

/**
 * Collapsible sidebar matching the Newbee Marketing hub design:
 *  - Fixed "N" brand tile + wordmark at top
 *  - Three primary nav items (Generate / Library / Analytics) with active pill
 *  - Settings + user card + collapse toggle pinned to the footer
 *
 * Width toggles between 240px and 64px. State persists in localStorage so a
 * user who likes the compact sidebar keeps it across sessions.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate persisted collapse state + fetch user email on mount. We read
  // localStorage in an effect (not the useState initializer) to keep the
  // client/server render in sync — a brief unflashed-expanded moment is
  // fine; a hydration mismatch is not.
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      try {
        if (window.localStorage.getItem("nb_sidebar_collapsed") === "1") {
          // This setState is intentional — syncing persisted UI state from
          // localStorage on mount. Hydration mismatch risk is zero because
          // we gate on hydratedRef and the default matches the SSR render.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCollapsed(true);
        }
      } catch {
        /* ignore */
      }
    }
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(
        "nb_sidebar_collapsed",
        collapsed ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  const W = collapsed ? 64 : 240;
  const initials = email
    ? email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <aside
      className="shrink-0 border-r border-line bg-panel flex flex-col"
      style={{ width: W, transition: "width .18s" }}
    >
      {/* Brand header */}
      <div className="h-14 flex items-center gap-2.5 px-3 border-b border-line-2">
        <div
          className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-brand"
          aria-hidden
        >
          <span className="serif text-[18px] text-brand-ink font-medium">N</span>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-[13.5px] font-semibold ink">Newbee</div>
            <div className="text-[9.5px] uppercase tracking-[0.14em] ink-3 mt-0.5 whitespace-nowrap">
              Marketing Hub
            </div>
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] transition ${
                active
                  ? "bg-brand-soft text-brand-ink font-medium"
                  : "ink-2 hover:bg-soft"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: settings + user + collapse toggle */}
      <div className="px-2 py-3 border-t border-line-2 space-y-0.5">
        <Link
          href="/settings"
          className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[13px] transition ${
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-brand-soft text-brand-ink font-medium"
              : "ink-2 hover:bg-soft"
          }`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <div
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold text-brand-ink bg-brand-soft"
            aria-hidden
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium ink truncate">
                  Admin
                </div>
                <div className="text-[10px] ink-3 truncate">
                  {email ?? "—"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ink-3 hover:ink transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full h-8 flex items-center justify-center text-[11px] ink-3 hover:ink transition"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className="h-3.5 w-3.5"
            style={{ transform: collapsed ? "none" : "rotate(180deg)" }}
          />
        </button>
      </div>
    </aside>
  );
}
