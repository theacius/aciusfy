"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Settings, User, LayoutDashboard, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

type ProfileExtraItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
};

type StevenProfileMenuProps = {
  displayName?: string | null;
  displayAvatar?: string | null;
  profileHref: string;
  isArtist?: boolean;
  className?: string;
  extraItems?: ProfileExtraItem[];
};

export function StevenProfileMenu({
  displayName,
  displayAvatar,
  profileHref,
  isArtist,
  className,
  extraItems = [],
}: StevenProfileMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const items: StevenActionItem[] = [
    { id: "home", icon: Music, label: "Uygulamaya Dön", href: "/home" },
    { id: "profile", icon: User, label: t("profile"), href: profileHref },
    ...(isArtist
      ? [{ id: "artist", icon: LayoutDashboard, label: t("artistPanel"), href: "/dashboard" }]
      : []),
    { id: "settings", icon: Settings, label: t("settings"), href: "/settings" },
    ...extraItems.map((item) => ({
      id: item.id,
      icon: item.icon,
      label: item.label,
      href: item.href,
      onClick: item.onClick,
    } satisfies StevenActionItem)),
    { id: "divider-signout", label: "", divider: true },
    {
      id: "signout",
      icon: LogOut,
      label: t("signOut"),
      destructive: true,
      onClick: async () => {
        await signOut({ redirect: false });
        if (typeof window !== "undefined") {
          window.location.href = `${window.location.origin}/`;
        }
      },
    },
  ];

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className={cn(
          "aciusfy-electron-chrome flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-0.5 pr-3 transition-colors hover:border-white/16 hover:bg-white/[0.07] sm:min-h-[2rem]",
          className,
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={displayName || t("profile")}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold text-foreground ring-1 ring-white/10">
          {displayAvatar ? (
            <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            displayName?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <span className="hidden max-w-[8rem] truncate text-xs font-medium text-foreground/80 sm:block sm:text-sm">
          {displayName || t("profile")}
        </span>
      </motion.button>

      <StevenActionMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        title={t("profile")}
        subtitle={displayName || undefined}
      />
    </>
  );
}
