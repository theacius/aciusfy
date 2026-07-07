"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSettingsStore, type SettingsState } from "@/store/settingsStore";

export function SettingsHydration() {
  const { data: session, status } = useSession();
  const zoomLevel = useSettingsStore((s) => s.zoomLevel);
  const hydrateFromServer = useSettingsStore((s) => s.hydrateFromServer);

  const setPrefsSyncedFromServer = useSettingsStore((s) => s.setPrefsSyncedFromServer);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      setPrefsSyncedFromServer(false);
      return;
    }
    fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          hydrateFromServer(data as Partial<SettingsState>);
        }
      })
      .catch(() => {})
      .finally(() => setPrefsSyncedFromServer(true));
  }, [status, session?.user?.id, hydrateFromServer, setPrefsSyncedFromServer]);

  useEffect(() => {
    const root = document.documentElement;
    if (zoomLevel === 100) {
      root.style.fontSize = "";
    } else {
      root.style.fontSize = `${zoomLevel}%`;
    }
    return () => {
      root.style.fontSize = "";
    };
  }, [zoomLevel]);

  return null;
}
