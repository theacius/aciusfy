"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Library, MessageCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { MobileMoreNavSheet } from "@/components/layout/MobileMoreNavSheet";

function isMoreRoutesActive(pathname: string): boolean {
  const roots = [
    "/radio",
    "/lyrics",
    "/friends",
    "/blend",
    "/podcasts",
    "/stats",
    "/whats-new",
    "/shop",
    "/rewards",
    "/downloads",
    "/settings",
    "/dashboard",
    "/admin",
  ];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isArtist, setIsArtist] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsAdmin(false);
      setIsArtist(false);
      return;
    }
    let cancelled = false;
    fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setIsAdmin(d.role === "ADMIN");
        setIsArtist(d.role === "ARTIST");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const tabs: {
    key: string;
    href?: string;
    label: string;
    icon: typeof Home;
    match: (p: string) => boolean;
    onClick?: () => void;
  }[] = [
    { key: "home", href: "/home", label: t("mainMenu"), icon: Home, match: (p) => p === "/home" || p === "/" },
    { key: "search", href: "/search", label: t("browse"), icon: Compass, match: (p) => p.startsWith("/search") },
    {
      key: "library",
      href: "/library",
      label: t("yourLibrary"),
      icon: Library,
      match: (p) => p.startsWith("/library") || p.startsWith("/playlist") || p.startsWith("/section"),
    },
    {
      key: "messages",
      href: session?.user?.id ? "/messages" : "/login",
      label: t("navMessages"),
      icon: MessageCircle,
      match: (p) => p.startsWith("/messages"),
    },
    {
      key: "more",
      label: t("navMore"),
      icon: Menu,
      match: (p) => isMoreRoutesActive(p),
      onClick: () => setMoreOpen(true),
    },
  ];

  return (
    <>
      <nav
        className="mobile-nav-safe-bottom fixed bottom-3 left-3 right-3 z-[60] flex flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[#09090b]/88 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden"
        style={{ height: "var(--bottom-nav-total)" }}
        aria-label={t("mainMenu")}
      >
        <div
          className="grid flex-1 grid-cols-5 items-center gap-0 px-0.5"
          style={{ height: "var(--bottom-nav-row)" }}
        >
          {tabs.map(({ key, href, label, icon: Icon, match, onClick }) => {
            const active = match(pathname);
            if (onClick) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  aria-expanded={moreOpen}
                  aria-label={label}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors",
                    active || moreOpen ? "text-foreground" : "text-muted hover:text-foreground/70"
                  )}
                >
                  <Icon className={cn("h-[22px] w-[22px] shrink-0", (active || moreOpen) && "text-foreground")} />
                  <span className="max-w-full truncate px-0.5 text-[9px] font-medium uppercase leading-none tracking-[0.12em]">
                    {label}
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={key}
                href={href!}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors",
                  active ? "text-foreground" : "text-muted hover:text-foreground/70"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-[22px] w-[22px] shrink-0", active && "text-foreground")} />
                <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-none tracking-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <MobileMoreNavSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isAdmin={isAdmin}
        isArtist={isArtist}
      />
    </>
  );
}
