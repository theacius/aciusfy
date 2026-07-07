"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSettingsStore } from "@/store/settingsStore";

export function PresenceBroadcaster() {
  const { data: session, status } = useSession();
  const enabled = useSettingsStore((s) => s.onlinePresenceEnabled ?? true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      await fetch("/api/me/presence", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    void ping();
    intervalRef.current = setInterval(() => void ping(), 25_000);

    const onVis = () => {
      if (document.visibilityState === "visible") void ping();
    };
    const onFocus = () => void ping();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, ping, session?.user?.id, status]);

  return null;
}
