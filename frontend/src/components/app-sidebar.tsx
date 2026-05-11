"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  ScanLine,
  Users,
  ClipboardCheck,
  Undo2,
  ShoppingCart,
  Building2,
  Wrench,
  Wallet,
  FileBarChart,
  ScrollText,
  Shield,
  Settings,
  Bell,
  ShieldCheck,
  Tags,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { assetflowService } from "@/services/assetflow.service";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("assetflow_access_token")) return;
    assetflowService
      .me()
      .then((res) => setPermissions(res.data.data?.permissions || []))
      .catch(() => setPermissions([]));
  }, []);

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
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-elegant)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-sidebar-foreground">AssetFlow</span>
              <span className="text-[10px] text-sidebar-foreground/60">Enterprise Suite</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50">{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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
    </Sidebar>
  );
}
