"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, Megaphone, UserPlus, Check, Inbox, Award, X } from "lucide-react";
import { formatNinePlusStyleBadge } from "@/lib/badge-format";
import { useAppNotifications, type AppNotificationRow } from "@/hooks/useAppNotifications";
import { StevenClockStrip } from "@/components/navigation/StevenClockStrip";

const ease = [0.16, 1, 0.3, 1] as const;

function parseFollowMeta(meta: string | null): {
  followerId: string;
  followerName: string | null;
  followerUsername: string | null;
  followerAvatar: string | null;
} | null {
  if (!meta) return null;
  try {
    const o = JSON.parse(meta) as Record<string, unknown>;
    const followerId = typeof o.followerId === "string" ? o.followerId : "";
    if (!followerId) return null;
    return {
      followerId,
      followerName: typeof o.followerName === "string" ? o.followerName : null,
      followerUsername: typeof o.followerUsername === "string" ? o.followerUsername : null,
      followerAvatar: typeof o.followerAvatar === "string" ? o.followerAvatar : null,
    };
  } catch {
    return null;
  }
}

function parseBadgeMeta(meta: string | null): {
  badgeName: string;
  badgeIcon: string;
} | null {
  if (!meta) return null;
  try {
    const o = JSON.parse(meta) as Record<string, unknown>;
    const badgeName = typeof o.badgeName === "string" ? o.badgeName : "";
    if (!badgeName) return null;
    return {
      badgeName,
      badgeIcon: typeof o.badgeIcon === "string" ? o.badgeIcon : "Award",
    };
  } catch {
    return null;
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "Az önce";
    if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} dk önce`;
    if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))} sa önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function NotificationRow({
  n,
  onRead,
  onNavigate,
}: {
  n: AppNotificationRow;
  onRead: (id: string) => void;
  onNavigate: () => void;
}) {
  const follow = n.kind === "USER_FOLLOW" ? parseFollowMeta(n.meta) : null;
  const badgeMeta = n.kind === "BADGE_EARNED" ? parseBadgeMeta(n.meta) : null;
  const href =
    follow != null ? `/profile/${follow.followerUsername || follow.followerId}` : null;
  const unread = !n.readAt;

  const inner = (
    <div
      className={`relative flex gap-3 rounded-2xl px-4 py-3 transition-colors ${
        unread
          ? "bg-white/[0.06] ring-1 ring-white/[0.08]"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      {unread && (
        <span className="absolute left-2 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-white/40" />
      )}
      <div className="relative z-[1] flex-shrink-0 pl-1">
        {n.kind === "BADGE_EARNED" ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            <Award className="h-5 w-5 text-amber-200/90" />
          </div>
        ) : n.kind === "ADMIN_ANNOUNCEMENT" ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            <Megaphone className="h-5 w-5 text-white/70" />
          </div>
        ) : follow?.followerAvatar ? (
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <Image
              src={follow.followerAvatar}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            <UserPlus className="h-5 w-5 text-white/70" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {n.kind === "BADGE_EARNED" ? (
          <>
            <p className="text-[13px] font-medium leading-snug text-white">{n.title ?? "Yeni Rozet!"}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              <span className="text-white/80">{badgeMeta?.badgeName ?? ""}</span>
              {" "}rozetini kazandın.
            </p>
          </>
        ) : n.kind === "ADMIN_ANNOUNCEMENT" ? (
          <>
            <p className="text-[13px] font-medium leading-snug text-white">{n.title ?? "Duyuru"}</p>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/50">{n.body}</p>
          </>
        ) : follow ? (
          <p className="text-[13px] leading-snug text-white/90">
            <span className="font-medium text-white">
              {follow.followerName || follow.followerUsername || "Bir kullanıcı"}
            </span>{" "}
            <span className="text-white/50">seni takip etti</span>
          </p>
        ) : (
          <p className="text-[13px] text-white/70">Yeni takip bildirimi</p>
        )}
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">
          {formatTime(n.createdAt)}
        </p>
      </div>
    </div>
  );

  const className =
    "block w-full rounded-2xl text-left transition-opacity hover:opacity-90 active:opacity-80";

  if (href && n.kind === "USER_FOLLOW") {
    return (
      <Link
        href={href}
        onClick={() => {
          if (!n.readAt) onRead(n.id);
          onNavigate();
        }}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!n.readAt) onRead(n.id);
      }}
    >
      {inner}
    </button>
  );
}

export function NotificationBell() {
  const { data: session } = useSession();
  const { unreadCount, notifications, refresh, markRead, markAllRead } = useAppNotifications();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session?.user?.id) return null;

  const badge = formatNinePlusStyleBadge(unreadCount);

  const panel =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Bildirimler"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35, ease }}
                className="fixed inset-0 z-[var(--z-overlay)] flex flex-col bg-[#09090b]/98 backdrop-blur-xl"
                style={{
                  paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-8">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
                      ( Bildirimler )
                    </p>
                    <h2 className="mt-2 text-2xl font-medium tracking-tight text-white sm:text-3xl">
                      Bildirimler
                    </h2>
                    <p className="mt-1 text-sm text-white/45">
                      {unreadCount > 0 ? `${unreadCount} okunmamış` : "Güncel"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StevenClockStrip />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-white/[0.08] p-2.5 text-white/50 transition-colors hover:border-white/14 hover:text-white"
                      aria-label="Kapat"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div className="border-b border-white/[0.06] px-5 py-3 sm:px-8">
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/14 hover:text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Tümünü okundu işaretle
                    </button>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-8">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                        <Inbox className="h-8 w-8 text-white/25" />
                      </div>
                      <p className="text-sm font-medium text-white/60">Henüz bildirim yok</p>
                      <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-white/35">
                        Takip ve duyurular burada görünecek.
                      </p>
                    </div>
                  ) : (
                    <ul className="mx-auto max-w-lg space-y-2">
                      {notifications.map((n, i) => (
                        <motion.li
                          key={n.id}
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3), ease }}
                        >
                          <NotificationRow
                            n={n}
                            onRead={(id) => void markRead(id)}
                            onNavigate={() => setOpen(false)}
                          />
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen(true);
          void refresh();
        }}
        className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all ${
          unreadCount > 0
            ? "bg-white/[0.08] text-white ring-1 ring-white/[0.12]"
            : "bg-white/[0.05] text-white/60 ring-1 ring-white/[0.06] hover:bg-white/10 hover:text-white"
        }`}
        aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-[#09090b] ring-2 ring-[#09090b]"
            aria-hidden
          >
            {badge}
          </span>
        )}
      </motion.button>
      {panel}
    </>
  );
}
