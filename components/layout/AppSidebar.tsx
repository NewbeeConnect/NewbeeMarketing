"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  Megaphone,
  Film,
  Images,
  FileStack,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";

const NAV_GROUPS = [
  {
    label: "Home",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Create",
    items: [
      { title: "Projects", url: "/projects", icon: Film, showBadge: true },
      { title: "Brand Kit", url: "/brand", icon: Palette },
    ],
  },
  {
    label: "Distribute",
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone },
      { title: "Calendar", url: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Library",
    items: [
      { title: "Gallery", url: "/gallery", icon: Images },
      { title: "Templates", url: "/templates", icon: FileStack },
    ],
  },
] as const;

const footerItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: projects } = useProjects();

  const activeProjectCount =
    projects?.filter((p) => p.status !== "completed").length ?? 0;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            N
          </div>
          <div>
            <p className="text-sm font-semibold">Newbee Marketing</p>
            <p className="text-xs text-muted-foreground">Hub</p>
          </div>
        </Link>
        <Button asChild size="sm" className="w-full">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      (item.url !== "/dashboard" &&
                        pathname.startsWith(item.url));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {"showBadge" in item &&
                          item.showBadge &&
                          activeProjectCount > 0 && (
                            <SidebarMenuBadge>
                              {activeProjectCount}
                            </SidebarMenuBadge>
                          )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url || pathname.startsWith(item.url)}
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
