"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { formatNinePlusStyleBadge } from "@/lib/badge-format";

const POLL_MS = 8000;

export function useMessageUnreadTotal(): number {
  const { data: session, status } = useSession();
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setTotal(0);
      return;
    }
    try {
      const r = await fetch("/api/messages", { credentials: "include" });
      const data = await r.json();
      const convos = data?.conversations ?? [];
      const sum = convos.reduce(
        (acc: number, c: { unreadCount?: number }) => acc + (c.unreadCount ?? 0),
        0
      );
      setTotal(sum);
    } catch {}
  }, [session?.user?.id]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setTotal(0);
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

  return total;
}

export function formatMessageBadgeCount(total: number): string {
  return formatNinePlusStyleBadge(total);
}
