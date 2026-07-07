"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 8000;

export type AppNotificationRow = {
  id: string;
  kind: "USER_FOLLOW" | "ADMIN_ANNOUNCEMENT" | "BADGE_EARNED";
  title: string | null;
  body: string | null;
  meta: string | null;
  readAt: string | null;
  createdAt: string;
};

export function useAppNotifications() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    try {
      const r = await fetch("/api/notifications?limit=50", { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json();
      setUnreadCount(typeof data?.unreadCount === "number" ? data.unreadCount : 0);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch {}
  }, [session?.user?.id]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [status, session?.user?.id, refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      void refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    void refresh();
  }, [refresh]);

  return { unreadCount, notifications, refresh, markRead, markAllRead };
}
