"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMessageBadgeCount, useMessageUnreadTotal } from "@/hooks/useMessageUnreadTotal";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { YoutubeSuggestNavLink } from "@/components/layout/YoutubeSuggestNavLink";
import { DesktopWindowControls } from "@/components/layout/DesktopWindowControls";
import { StevenClockStrip } from "@/components/navigation/StevenClockStrip";
import { StevenProfileMenu } from "@/components/navigation/StevenProfileMenu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, ExternalLink, MessageCircle } from "lucide-react";

export function TopNavbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const messageUnreadTotal = useMessageUnreadTotal();
  const profile = useUserProfile();
  const displayName = profile?.name ?? session?.user?.name;
  const displayAvatar = profile?.avatar ?? session?.user?.image;
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  const profileHref = session?.user?.id
    ? `/profile/${(session.user as { username?: string | null }).username || session.user.id}`
    : "/home";

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && !!window.aciusfyDesktop);
  }, []);

  useEffect(() => {
    if (pathname === "/search") {
      const urlQ = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : "";
      if (urlQ && !query) setQuery(urlQ);
    } else {
      setQuery("");
    }
  }, [pathname, query]);

  useEffect(() => {
    const container = document.querySelector("main > div:last-child");
    if (!container) return;
    const handleScroll = () => setScrolled(container.scrollTop > 20);
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const submitSearch = () => {
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <motion.div
      className={cn(
        "premium-app-topbar z-[var(--z-chrome)] flex w-full min-h-[var(--navbar-height)] items-center gap-3 px-4 py-3 transition-all duration-500 sm:gap-5 sm:px-8 lg:px-10",
        scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.2)]" : "",
        isElectron && "aciusfy-electron-titlebar",
      )}
    >
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted transition-all hover:border-white/20 hover:text-foreground"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.forward()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted transition-all hover:border-white/20 hover:text-foreground"
          aria-label="Forward"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {pathname !== "/search" ? (
        <div className="relative min-w-0 flex-1 max-w-none">
          <button
            type="button"
            onClick={submitSearch}
            className="absolute left-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            aria-label={t("searchPlaceholder")}
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitSearch();
              }
            }}
            placeholder={t("searchPlaceholder")}
            className="relative w-full max-w-xl border-0 border-b border-white/10 bg-transparent py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-white/30 focus:outline-none"
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1" aria-hidden />
      )}

      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        <StevenClockStrip />
        <YoutubeSuggestNavLink />
        {session?.user?.id ? <NotificationBell /> : null}
        {session?.user?.id ? (
          <Link
            href="/messages"
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-muted transition-all hover:border-white/20 hover:text-foreground"
            aria-label={
              messageUnreadTotal > 0
                ? `Mesajlar, ${messageUnreadTotal} okunmamış`
                : "Mesajlar"
            }
          >
            <MessageCircle className="h-5 w-5" />
            {messageUnreadTotal > 0 ? (
              <span
                className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#09090b]"
                aria-hidden
              >
                {formatMessageBadgeCount(messageUnreadTotal)}
              </span>
            ) : null}
          </Link>
        ) : null}

        <div
          className={cn(
            "flex min-w-0 shrink-0 items-stretch gap-1.5 sm:gap-2",
            isElectron && "aciusfy-electron-chrome border-l border-white/10 pl-1.5 sm:pl-2",
          )}
        >
          {session?.user ? (
            <StevenProfileMenu
              displayName={displayName}
              displayAvatar={displayAvatar}
              profileHref={profileHref}
              isArtist={profile?.role === "ARTIST"}
              extraItems={[
                {
                  id: "landing",
                  icon: ExternalLink,
                  label: t("landingPage"),
                  onClick: () => {
                    window.location.href = "/";
                  },
                },
              ]}
            />
          ) : null}
          {isElectron ? <DesktopWindowControls className="ml-0.5 sm:ml-1" /> : null}
        </div>
      </div>
    </motion.div>
  );
}
