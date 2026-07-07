"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";

interface UserProfile {
  name: string | null;
  avatar: string | null;
  role: "USER" | "ARTIST" | "ADMIN";
}

const UserProfileContext = createContext<UserProfile | null>(null);

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  return ctx;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    fetch("/api/profile", { credentials: "include", cache: "no-store" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data)
          setProfile({
            name: data.name ?? null,
            avatar: data.avatar ?? null,
            role: data.role ?? "USER",
          });
      })
      .catch(() => setProfile(null));
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("user-profile-updated", handler);
    return () => window.removeEventListener("user-profile-updated", handler);
  }, [fetchProfile]);

  useRefreshInterval(fetchProfile, 5000, !!session?.user?.id);

  const value = profile;
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}
