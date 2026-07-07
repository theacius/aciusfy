"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";
import { ElectronWindowChromeGroup } from "@/components/layout/ElectronWindowChromeGroup";
import { useIsAciusfyDesktop } from "@/hooks/useIsAciusfyDesktop";
import { AnimatedButton } from "@/components/landing/animated-button";
import { StevenClockStrip } from "@/components/navigation/StevenClockStrip";
import { StevenFullScreenMenu, type StevenMenuItem } from "@/components/navigation/StevenFullScreenMenu";
import { StevenProfileMenu } from "@/components/navigation/StevenProfileMenu";
import { useLenis, scrollWithLenis } from "@/components/providers/LenisProvider";

export type PremiumSiteNavVariant = "landing" | "marketing" | "discord";

function scrollToHash(href: string, lenis: ReturnType<typeof useLenis>) {
  if (!href.startsWith("#")) return;
  const id = href.slice(1);
  if (id === "" || id === "top") {
    scrollWithLenis(lenis, 0);
    return;
  }
  const el = document.getElementById(id);
  if (el) scrollWithLenis(lenis, el);
}

export function PremiumSiteNav({ variant = "landing" }: { variant?: PremiumSiteNavVariant }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const profile = useUserProfile();
  const { t } = useTranslation();
  const lenis = useLenis();
  const isAciusfyDesktop = useIsAciusfyDesktop();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = !!session?.user;
  const isSiteAdmin =
    profile?.role === "ADMIN" ||
    (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const showDiscordAdminLink = variant === "discord" && isSiteAdmin;
  const showHashScroll = variant === "landing";

  const displayName = profile?.name ?? session?.user?.name;
  const displayAvatar = profile?.avatar ?? session?.user?.image;
  const profileHref = session?.user?.id
    ? `/profile/${(session.user as { username?: string | null }).username || session.user.id}`
    : "/home";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const onHashNavigate = useCallback(
    (href: string) => scrollToHash(href, lenis),
    [lenis],
  );

  const menuItems: StevenMenuItem[] = [
    {
      id: "home",
      label: t("landingNavHome"),
      href: variant === "landing" ? "#top" : "/",
      onNavigate: showHashScroll ? () => onHashNavigate(variant === "landing" ? "#top" : "/") : undefined,
    },
    {
      id: "features",
      label: t("landingNavFeatures"),
      href: "#features",
      onNavigate: showHashScroll ? () => onHashNavigate("#features") : undefined,
    },
    {
      id: "explore",
      label: t("landingNavExplore"),
      href: "#categories",
      onNavigate: showHashScroll ? () => onHashNavigate("#categories") : undefined,
    },
    {
      id: "pricing",
      label: t("landingPricingEyebrow"),
      href: "#pricing",
      onNavigate: showHashScroll ? () => onHashNavigate("#pricing") : undefined,
    },
    {
      id: "faq",
      label: t("landingFaqEyebrow"),
      href: "#faq",
      onNavigate: showHashScroll ? () => onHashNavigate("#faq") : undefined,
    },
    {
      id: "discord",
      label: t("landingDiscordBotNav"),
      href: "/discord-bot",
    },
    {
      id: "download",
      label: t("landingNavDownload"),
      href: "/download",
    },
  ].filter((item) => {
    if (!showHashScroll && item.href.startsWith("#")) return false;
    return true;
  });

  const menuFooter = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {showDiscordAdminLink ? (
        <Link
          href="/discord-bot/admin"
          className="inline-flex items-center gap-2 text-sm text-amber-200/90 transition-colors hover:text-amber-100"
        >
          <Shield className="h-4 w-4" aria-hidden />
          {t("discordBotNavAdminPanel")}
        </Link>
      ) : (
        <span className="text-xs uppercase tracking-[0.16em] text-muted">© {new Date().getFullYear()} Aciusfy</span>
      )}
      {!isLoggedIn ? (
        <div className="flex flex-wrap gap-3">
          <AnimatedButton href="/login" variant="secondary" size="sm">
            {t("landingLogin")}
          </AnimatedButton>
          <AnimatedButton href="/register" size="sm">
            {t("landingRegister")}
          </AnimatedButton>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <header
        className={cn(
          "premium-nav-bar landing-header-safe fixed left-0 right-0 top-0 z-[var(--z-chrome)]",
          "flex items-center justify-between gap-3 px-4 pb-4 sm:px-6 sm:pb-5",
          isAciusfyDesktop && "aciusfy-electron-titlebar",
        )}
      >
        <Link
          href="/"
          className="aciusfy-electron-chrome relative z-10 flex shrink-0 items-center gap-2"
        >
          <AciusfyLandingWordmark variant="navbar" />
        </Link>

        <StevenClockStrip className="absolute left-1/2 hidden -translate-x-1/2 lg:flex" />

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {showDiscordAdminLink ? (
            <Link
              href="/discord-bot/admin"
              className="aciusfy-electron-chrome hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200/90 transition-colors hover:border-amber-500/45 hover:bg-amber-500/15 sm:inline-flex"
            >
              <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{t("discordBotNavAdminPanel")}</span>
            </Link>
          ) : null}

          {!isLoggedIn ? (
            <div className="aciusfy-electron-chrome hidden items-center gap-2 md:flex">
              <AnimatedButton href="/login" variant="ghost" size="sm">
                {t("landingLogin")}
              </AnimatedButton>
              <AnimatedButton href="/register" size="sm">
                {t("landingRegister")}
              </AnimatedButton>
            </div>
          ) : (
            <StevenProfileMenu
              displayName={displayName}
              displayAvatar={displayAvatar}
              profileHref={profileHref}
              isArtist={profile?.role === "ARTIST"}
            />
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMenuOpen(true)}
            className="aciusfy-electron-chrome rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground/85 transition-colors hover:border-white/16 hover:bg-white/[0.07] hover:text-foreground"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            {t("landingMenuTitle")}
          </motion.button>

          {isAciusfyDesktop ? (
            <ElectronWindowChromeGroup withLeftBorder className="aciusfy-electron-chrome hidden sm:flex" />
          ) : null}
        </div>
      </header>

      <StevenFullScreenMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        footer={menuFooter}
        title={t("landingMenuTitle")}
      />
    </>
  );
}

export function LandingNavbar() {
  return <PremiumSiteNav variant="landing" />;
}
