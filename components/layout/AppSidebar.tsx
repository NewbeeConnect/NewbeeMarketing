"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  FolderOpen,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/generate", label: "Generate", Icon: Sparkles },
  { href: "/library", label: "Library", Icon: FolderOpen },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
] as const;

/**
 * Collapsible sidebar matching the Newbee Marketing hub design.
 *
 * Behavior adapts to viewport width:
 *   - ≥ md (768px): fixed-in-flow aside. 240px expanded or 64px collapsed.
 *     Collapse state persists in localStorage across sessions.
 *   - < md: hidden by default. A small "Menu" pill shows top-left; tapping
 *     it slides the full sidebar in as an overlay drawer with a backdrop.
 *     Backdrop click or Escape closes the drawer. Navigating closes it too.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate persisted collapse state + fetch user email on mount.
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      try {
        if (window.localStorage.getItem("nb_sidebar_collapsed") === "1") {
          // Intentional: syncing persisted UI state from localStorage.
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

  // Close mobile drawer whenever the user navigates. setState-in-effect
  // is the right pattern here — the drawer is a pure UI side-effect of
  // the route (persisted nowhere, no external system).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [pathname]);

  // Escape to close drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    await createClient().auth.signOut();
    router.push("/login");
  }, [router]);

  const initials = email
    ? email.split("@")[0].slice(0, 2).toUpperCase()
    : "AD";

  // Mobile drawer never collapses to mini — always full-width inside the
  // overlay. Desktop respects the collapse toggle.
  const widthDesktop = collapsed ? 64 : 240;

  // Plain function (not a nested component) — React treats each <Inner />
  // invocation as a new component type on every parent render and would
  // remount it. Calling renderInner(...) returns JSX directly, so the DOM
  // inside is stable across renders.
  const renderInner = (compact: boolean) => (
    <>
      {/* Brand header */}
      <div className="h-14 flex items-center gap-2.5 px-3 border-b border-line-2">
        <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden relative">
          <Image
            src="/newbee-logo.png"
            alt="Newbee"
            fill
            sizes="36px"
            priority
            className="object-cover"
          />
        </div>
        {!compact && (
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
              title={compact ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!compact && (
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
          title={compact ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!compact && <span>Settings</span>}
        </Link>

        <div
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${
            compact ? "justify-center" : ""
          }`}
        >
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold text-brand-ink bg-brand-soft"
            aria-hidden
          >
            {initials}
          </div>
          {!compact && (
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
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle is desktop-only; mobile drawer has an X in header. */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex w-full h-8 items-center justify-center text-[11px] ink-3 hover:ink transition"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className="h-3.5 w-3.5"
            style={{ transform: collapsed ? "none" : "rotate(180deg)" }}
          />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu trigger — hidden on md+ */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 h-9 px-3 rounded-lg inline-flex items-center gap-1.5 bg-panel border border-line text-[12.5px] ink shadow-card"
        aria-label="Open navigation"
      >
        <Menu className="h-3.5 w-3.5" />
        Menu
      </button>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 border-r border-line bg-panel flex-col"
        style={{ width: widthDesktop, transition: "width .18s" }}
      >
        {renderInner(collapsed)}
      </aside>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="flex-1"
            style={{ background: "rgba(30,20,10,.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="w-[260px] max-w-[85vw] bg-panel border-l border-line flex flex-col slideFade">
            <div className="flex justify-end px-2 pt-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-md inline-flex items-center justify-center ink-2 hover:bg-soft transition"
                aria-label="Close navigation"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderInner(false)}
          </aside>
        </div>
      )}
    </>
  );
}
