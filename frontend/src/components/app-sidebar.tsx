"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Bell,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  ScanLine,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tags,
  Undo2,
  Users,
  Wallet,
  Wrench,
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      { title: "Notifications", url: "/notifications", icon: Bell, permission: "notifications.view" },
    ],
  },
  {
    label: "Asset Operations",
    items: [
      { title: "Assets", url: "/assets", icon: Boxes, permission: "assets.view" },
      { title: "Categories", url: "/categories", icon: Tags, permission: "categories.view" },
      { title: "Scanner", url: "/scanner", icon: ScanLine, permission: "scanner.use" },
      { title: "Assignments", url: "/assignments", icon: ClipboardCheck, permission: "assignments.view" },
      { title: "Returns & Clearance", url: "/returns", icon: Undo2, permission: "returns.view" },
      { title: "Repairs", url: "/repairs", icon: Wrench, permission: "repairs.view" },
    ],
  },
  {
    label: "People & Procurement",
    items: [
      { title: "Employees", url: "/employees", icon: Users, permission: "employees.view" },
      { title: "Vendors", url: "/vendors", icon: Building2, permission: "vendors.view" },
      { title: "Purchases", url: "/purchases", icon: ShoppingCart, permission: "purchases.view" },
    ],
  },
  {
    label: "Finance & Insights",
    items: [
      { title: "Depreciation", url: "/finance", icon: Wallet, permission: "finance.view" },
      { title: "Reports", url: "/reports", icon: FileBarChart, permission: "reports.view" },
      { title: "Audit Logs", url: "/audit-logs", icon: ScrollText, permission: "audit_logs.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Companies", url: "/companies", icon: Building2, permission: "companies.view" },
      { title: "Users & Roles", url: "/users", icon: Shield, permission: "users.view" },
      { title: "Settings", url: "/settings", icon: Settings, permission: "settings.view" },
    ],
  },
];

function canAccess(permissions: string[], permission: string) {
  const namespace = permission.split(".")[0];
  return (
    permissions.includes("*") ||
    permissions.includes(permission) ||
    permissions.includes(`${namespace}.*`)
  );
}

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const { permissions, profile } = useCurrentUser();

  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canAccess(permissions, item.permission)),
        }))
        .filter((group) => group.items.length > 0),
    [permissions],
  );

  return (
    <Sidebar collapsible="icon" className="assetflow-sidebar-shell border-0">
      <SidebarHeader className="border-b border-white/10 p-3">
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
          <Link
            href="/dashboard"
            className={cn(
              "group flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-white/7",
              collapsed && "justify-center",
            )}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/15 text-emerald-100 shadow-[0_16px_36px_rgba(16,185,129,0.16)] transition group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-black tracking-wide text-white">AssetFlow</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
                </div>
                {/* <span className="block truncate text-[11px] font-medium text-slate-300/70">Enterprise Command Center</span> */}
              </div>
            )}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-9 w-9 rounded-2xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white",
              collapsed && "relative overflow-visible",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {collapsed && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="assetflow-sidebar-content gap-1 px-2 py-3">
        {visibleGroups.map((g) => (
          <SidebarGroup key={g.label} className="px-1 py-1">
            {!collapsed && (
              <SidebarGroupLabel className="mb-1 h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400/70">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {g.items.map((item) => {
                  const active = isActivePath(pathname, item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "assetflow-nav-item h-11 rounded-2xl border border-transparent px-3 text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8 hover:text-white",
                          active && "assetflow-nav-item-active border-emerald-400/30 bg-emerald-400/16 font-semibold text-white shadow-[0_12px_28px_rgba(16,185,129,0.12)]",
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {!collapsed && active && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <Avatar className="h-10 w-10 rounded-2xl ring-2 ring-emerald-400/20">
              <AvatarFallback className="rounded-2xl bg-emerald-400/15 text-xs font-black text-emerald-100">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-xl ring-2 ring-emerald-400/20">
                <AvatarFallback className="rounded-xl bg-emerald-400/15 text-sm font-black text-emerald-100">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{profile.displayName}</p>
                <p className="truncate text-[11px] text-slate-300/70">{profile.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              {profile.roleName}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
