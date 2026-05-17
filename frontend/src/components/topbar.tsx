"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, LogOut, Search, Settings, Shield, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { assetflowService } from "@/services/assetflow.service";
import { useCurrentUser } from "@/hooks/use-current-user";

export function Topbar() {
  const router = useRouter();
  const { profile } = useCurrentUser();

  const signOut = async () => {
    try {
      await assetflowService.logout();
    } catch {
      // Local logout should still happen even if the refresh cookie/session is already gone.
    } finally {
      localStorage.removeItem("assetflow_access_token");
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/82 px-4 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/72">
      <SidebarTrigger className="h-10 w-10 rounded-2xl border border-primary/15 bg-primary/8 text-foreground shadow-sm hover:bg-primary/12" />

      <div className="hidden min-w-0 flex-1 md:block">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets, employees, serials, vendors..."
            className="h-10 rounded-2xl border-border/60 bg-card/80 pl-9 shadow-sm focus-visible:bg-background"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary lg:flex">
          <Sparkles className="h-3.5 w-3.5" />
          Premium workspace
        </div>

        <Button variant="ghost" size="icon" className="hidden rounded-2xl sm:inline-flex">
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Button asChild variant="ghost" size="icon" className="relative rounded-2xl">
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 gap-2 rounded-2xl border border-border/70 bg-card/70 px-2 shadow-sm hover:bg-card">
              <Avatar className="h-8 w-8 rounded-2xl ring-2 ring-primary/15">
                <AvatarFallback className="rounded-2xl bg-primary text-xs font-black text-primary-foreground">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden max-w-44 text-left leading-tight md:block">
                <p className="truncate text-xs font-bold">{profile.displayName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{profile.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
            <DropdownMenuLabel className="p-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-2xl ring-2 ring-primary/15">
                  <AvatarFallback className="rounded-2xl bg-primary text-xs font-black text-primary-foreground">
                    {profile.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profile.displayName}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <div className="mx-2 mb-2 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {profile.roleName}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/users">
                <Shield className="mr-2 h-4 w-4" />
                Users & Roles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="rounded-xl text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
