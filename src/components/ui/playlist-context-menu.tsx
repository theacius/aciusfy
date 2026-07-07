"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2, ListMusic } from "lucide-react";
import type { PlaylistType } from "@/types";
import { showErrorToast } from "@/store/toastStore";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

interface PlaylistContextMenuProps {
  children: ReactNode;
  playlist: PlaylistType;
  onProfileVisibilityChange?: (showOnProfile: boolean) => void;
  onRemove?: () => void;
}

export function PlaylistContextMenu({
  children,
  playlist,
  onProfileVisibilityChange,
  onRemove,
}: PlaylistContextMenuProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const showOnProfile = playlist.showOnProfile ?? true;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const toggleProfileVisibility = async () => {
    const next = !showOnProfile;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnProfile: next }),
      });
      if (res.ok) {
        onProfileVisibilityChange?.(next);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        showErrorToast(data?.error || t("saveFailed"));
      }
    } catch {
      showErrorToast(t("saveFailed"));
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    if (!confirm(t("removeFromLibraryConfirm") ?? "Bu öğeyi kütüphaneden kaldırmak istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" });
      if (res.ok) {
        onRemove();
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
        router.push("/library");
      }
    } catch {}
  };

  const items: StevenActionItem[] = [
    {
      id: "open",
      icon: ListMusic,
      label: t("open") || "Aç",
      onClick: () => router.push(`/playlist/${playlist.id}`),
    },
  ];
  if (!playlist.isBuiltIn) {
    items.push({ id: "edit", icon: Pencil, label: t("edit"), onClick: () => router.push(`/playlist/${playlist.id}`) });
  }
  items.push({
    id: "visibility",
    icon: showOnProfile ? EyeOff : Eye,
    label: showOnProfile ? t("hideOnProfile") : t("showOnProfile"),
    onClick: toggleProfileVisibility,
  });
  if (onRemove) {
    items.push({ id: "div", label: "", divider: true });
    items.push({
      id: "remove",
      icon: Trash2,
      label: t("removeFromLibrary"),
      destructive: true,
      onClick: handleRemove,
    });
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      <StevenActionMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        title={t("playlist")}
        subtitle={playlist.title}
      />
    </div>
  );
}
