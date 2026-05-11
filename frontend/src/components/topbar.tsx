"use client";

import Link from "next/link";
import { Bell, Search, HelpCircle, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/78 px-4 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/68">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden flex-1 md:block">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search assets, employees, serials, vendors..." className="h-10 rounded-2xl border-border/60 bg-card/70 pl-9 shadow-sm focus-visible:bg-background" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary lg:flex">
          <Sparkles className="h-3.5 w-3.5" /> Premium workspace
        </div>
        <Button variant="ghost" size="icon" className="hidden rounded-2xl sm:inline-flex"><HelpCircle className="h-4 w-4" /></Button>
        <Button asChild variant="ghost" size="icon" className="relative rounded-2xl"><Link href="/notifications"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" /></Link></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-2xl px-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/15"><AvatarFallback className="bg-primary text-primary-foreground text-xs">AF</AvatarFallback></Avatar>
              <div className="hidden text-left leading-tight md:block"><p className="text-xs font-semibold">Super Admin</p><p className="text-[10px] text-muted-foreground">admin@assetflow.com</p></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>My Account</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/users">Users & Roles</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/login">Sign out</Link></DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
