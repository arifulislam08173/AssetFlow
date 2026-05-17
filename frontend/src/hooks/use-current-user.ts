"use client";

import { useEffect, useMemo, useState } from "react";
import { assetflowService } from "@/services/assetflow.service";

type RoleLike = string | { name?: string; title?: string; code?: string } | null | undefined;

export type CurrentUser = {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: RoleLike;
  roleName?: string;
  permissions?: string[];
};

function getRoleName(role: RoleLike, fallback?: string) {
  if (typeof role === "string") return role;
  return role?.name || role?.title || role?.code || fallback || "User";
}

function getDisplayName(user: CurrentUser | null) {
  return user?.name || user?.fullName || user?.email?.split("@")[0] || "AssetFlow User";
}

function initialsFrom(name: string, email?: string) {
  const source = name || email || "AF";
  const words = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase();
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("assetflow_access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    assetflowService
      .me()
      .then((res) => {
        if (!active) return;
        const data = res.data.data || {};
        const currentUser = data.user || data;
        setUser(currentUser);
        setPermissions(data.permissions || currentUser.permissions || []);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setPermissions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const profile = useMemo(() => {
    const displayName = getDisplayName(user);
    const email = user?.email || "admin@assetflow.com";
    const roleName = getRoleName(user?.role, user?.roleName);

    return {
      displayName,
      email,
      roleName,
      initials: initialsFrom(displayName, email),
    };
  }, [user]);

  return { user, permissions, profile, loading };
}
