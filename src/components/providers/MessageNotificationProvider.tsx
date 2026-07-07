"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useNotificationStore } from "@/store/notificationStore";

const POLL_INTERVAL = 8000;

export function MessageNotificationProvider() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const hydrateMuted = useNotificationStore((s) => s.hydrateMuted);
  const lastKnownRef = useRef<Map<string, string>>(new Map());
  const seededRef = useRef(false);

  useEffect(() => {
    hydrateMuted();
  }, [hydrateMuted]);

  const poll = useCallback(() => {
    if (!session?.user?.id) return;
    if (pathname === "/messages") return;

    fetch("/api/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const convos = data?.conversations ?? [];
        if (!seededRef.current) {
          for (const c of convos) {
            const otherId = c.user?.id;
            if (otherId && c.lastAt) lastKnownRef.current.set(otherId, c.lastAt);
          }
          seededRef.current = true;
          return;
        }
        for (const c of convos) {
          const otherId = c.user?.id;
          if (!otherId) continue;
          const lastMsg = c.lastMessage as string | undefined;
          const lastWasImage = c.lastWasImage === true;
          const lastWasShare = c.lastWasShare === true;
          const lastAt = c.lastAt;
          const unread = c.unreadCount ?? 0;
          if ((!lastMsg && !lastWasImage && !lastWasShare) || !lastAt || unread === 0) continue;

          const prevLastAt = lastKnownRef.current.get(otherId);
          const lastAtTime = new Date(lastAt).getTime();
          if (prevLastAt != null && lastAtTime <= new Date(prevLastAt).getTime()) continue;
          lastKnownRef.current.set(otherId, lastAt);

          addNotification({
            id: `${otherId}-${lastAt}`,
            senderId: otherId,
            senderName: c.user.name ?? null,
            senderAvatar: c.user.avatar ?? null,
            senderUsername: c.user.username ?? null,
            content:
              lastMsg ||
              (lastWasImage ? "Fotoğraf" : lastWasShare ? "Paylaşım" : ""),
            createdAt: lastAt,
          });
        }
      })
      .catch(() => {});
  }, [session?.user?.id, pathname, addNotification]);

  useEffect(() => {
    if (!session?.user?.id || pathname === "/messages") return;
    poll();
    const t = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [session?.user?.id, pathname, poll]);

  return null;
}
