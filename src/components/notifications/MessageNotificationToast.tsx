"use client";

import { useNotificationStore, type MessageNotification } from "@/store/notificationStore";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

const AUTO_DISMISS_MS = 5000;
const MAX_NOTIFICATIONS = 5;

function ToastItem({ n }: { n: MessageNotification }) {
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  useEffect(() => {
    const t = setTimeout(() => removeNotification(n.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [n.id, removeNotification]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="pointer-events-auto relative flex min-h-[114px] w-full max-w-[270px] flex-shrink-0 overflow-hidden rounded-2xl bg-[#09090b] shadow-lg ring-1 ring-white/[0.08]"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeNotification(n.id);
        }}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-foreground"
        aria-label="Kapat"
      >
        <X className="h-5 w-5" />
      </button>
      <Link
        href={`/messages?userId=${n.senderId}`}
        onClick={() => removeNotification(n.id)}
        className="flex min-h-[114px] min-w-0 flex-1 items-center gap-3 px-4 py-3 pr-12"
      >
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
          {n.senderAvatar ? (
            <Image
              src={n.senderAvatar}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized={
                n.senderAvatar.startsWith("/uploads/") ||
                n.senderAvatar.startsWith("data:")
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
              {n.senderName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground transition-colors">
            {n.senderName ?? "Kullanıcı"}
          </p>
          <p className="mt-1 line-clamp-3 text-sm text-muted">
            {n.content.length > 80 ? `${n.content.slice(0, 80)}...` : n.content}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function MessageNotificationToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notifications = useNotificationStore((s) => s.notifications);
  const markOpened = useNotificationStore((s) => s.markOpened);

  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const isNowPlayingOpen = usePlayerStore((s) => s.isNowPlayingOpen);
  const isQueueOpen = useQueueStore((s) => s.isQueueOpen);

  const openedUserId = pathname === "/messages" ? searchParams.get("userId") : null;

  useEffect(() => {
    if (openedUserId) markOpened(openedUserId);
  }, [openedUserId, markOpened]);


  const rightOffset =
    isNowPlayingOpen ? 400 : isLyricsOpen || isQueueOpen ? 380 : 0;

  if (pathname === "/messages")
    return null;

  return (
    <div
      className="fixed bottom-[calc(var(--main-content-bottom-padding)+0.75rem)] z-50 flex flex-col gap-3 max-lg:inset-x-3 lg:left-auto lg:right-4"
      style={rightOffset ? { right: `${rightOffset + 16}px`, left: "auto" } : undefined}
    >
      <AnimatePresence>
        {notifications.slice(-MAX_NOTIFICATIONS).map((n) => (
          <ToastItem key={n.id} n={n} />
        ))}
      </AnimatePresence>
    </div>
  );
}
