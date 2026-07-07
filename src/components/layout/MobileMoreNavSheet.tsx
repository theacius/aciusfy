"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { StevenFullScreenMenu, type StevenMenuItem } from "@/components/navigation/StevenFullScreenMenu";

type Props = {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isArtist: boolean;
};

export function MobileMoreNavSheet({ open, onClose, isAdmin, isArtist }: Props) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const items: StevenMenuItem[] = [
    { id: "radio", label: t("smartRadio"), href: "/radio" },
    { id: "lyrics", label: t("lyricsNav"), href: "/lyrics" },
    { id: "friends", label: t("friends"), href: "/friends" },
    { id: "blend", label: t("blendTitle"), href: "/blend" },
    { id: "podcasts", label: t("podcasts"), href: "/podcasts" },
    { id: "stats", label: t("stats"), href: "/stats" },
    { id: "whats-new", label: t("whatsNew"), href: "/whats-new" },
    { id: "shop", label: t("shop"), href: "/shop" },
    { id: "rewards", label: t("dailyQuestsNav"), href: "/rewards" },
    { id: "downloads", label: t("downloads"), href: "/downloads" },
    { id: "settings", label: t("settings"), href: "/settings" },
    ...(isArtist && session?.user?.id
      ? [{ id: "artist", label: t("artistPanel"), href: "/dashboard" }]
      : []),
    ...(isAdmin ? [{ id: "admin", label: t("admin"), href: "/admin" }] : []),
  ];

  return (
    <StevenFullScreenMenu
      open={open}
      onClose={onClose}
      items={items}
      title={t("mobileMoreMenuTitle")}
      footer={
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {session?.user?.name || session?.user?.email || "Aciusfy"}
        </p>
      }
    />
  );
}
