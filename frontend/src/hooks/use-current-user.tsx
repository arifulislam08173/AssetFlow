"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
type CurrentSession = {
  user: CurrentUser | null;
  permissions: string[];
  loading: boolean;
  profile: { displayName: string; email: string; roleName: string; initials: string };
};

const CurrentUserContext = createContext<CurrentSession | null>(null);

function roleName(role: RoleLike, fallback?: string) {
  return typeof role === "string" ? role : role?.name || role?.title || role?.code || fallback || "User";
}
function initials(name: string) {
  const words = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/** One authenticated /me request per app layout, not one request per table action. */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("assetflow_access_token")) {
      setLoading(false);
      return;
    }
    let active = true;
    assetflowService.me()
      .then((res) => {
        if (!active) return;
        const data = res.data.data || {};
        const current: CurrentUser = data.user || data;
        setUser(current);
        setPermissions(data.permissions || current.permissions || []);
      })
      .catch(() => {
        if (active) { setUser(null); setPermissions([]); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const profile = useMemo(() => {
    const displayName = user?.name || user?.fullName || user?.email?.split("@")[0] || "AssetFlow User";
    const email = user?.email || "";
    return { displayName, email, roleName: roleName(user?.role, user?.roleName), initials: initials(displayName) };
  }, [user]);

  return <CurrentUserContext.Provider value={{ user, permissions, loading, profile }}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentSession {
  const context = useContext(CurrentUserContext);
  if (!context) throw new Error("useCurrentUser must be called inside CurrentUserProvider");
  return context;
}
