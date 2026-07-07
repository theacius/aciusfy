"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useStartRadio } from "@/hooks/useStartRadio";
import { useSettingsStore } from "@/store/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { SongType } from "@/types";
import {
  Play, ListPlus, Radio, Heart, Share2, User, Disc3,
  PlusCircle, Download, WifiOff,
} from "lucide-react";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import { useModalStore } from "@/store/modalStore";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

interface ContextMenuProps {
  children: ReactNode;
  song: SongType;
}

export function SongContextMenu({ children, song }: ContextMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const startRadio = useStartRadio();
  const downloadQuality = useSettingsStore((s) => s.downloadQuality);
  const { downloadForOffline, removeFromOffline, downloading, isDownloaded } = useOfflineDownload();
  const openAddToPlaylistModal = useModalStore((s) => s.openAddToPlaylistModal);
  const openSongModal = useModalStore((s) => s.openSongModal);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const items: StevenActionItem[] = [
    { id: "play", icon: Play, label: t("playNow"), onClick: () => setActiveSong(song) },
    { id: "queue", icon: PlusCircle, label: t("addToQueue"), onClick: () => addToQueueWithSimilar(song) },
    { id: "div1", label: "", divider: true },
    { id: "radio", icon: Radio, label: t("startRadio"), onClick: () => startRadio(song) },
    {
      id: "like",
      icon: Heart,
      label: t("like"),
      onClick: async () => {
        await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: song.id }),
        });
      },
    },
    { id: "playlist", icon: ListPlus, label: t("addToPlaylist"), onClick: () => openAddToPlaylistModal(song) },
    {
      id: "download",
      icon: Download,
      label: t("download"),
      onClick: async () => {
        try {
          const res = await fetch("/api/audio/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              songId: song.id,
              artist: song.artist?.name,
              title: song.title,
              downloadQuality,
            }),
          });
          const data = await res.json();
          if (data?.url) {
            const url = data.url.startsWith("/") ? `${window.location.origin}${data.url}` : data.url;
            const a = document.createElement("a");
            a.href = url;
            a.download = `${song.title}.mp3`;
            a.target = "_blank";
            a.click();
          }
        } catch {}
      },
    },
    isDownloaded(song.id)
      ? {
          id: "offline-remove",
          icon: WifiOff,
          label: t("removeFromOffline"),
          onClick: () => removeFromOffline(song.id),
        }
      : {
          id: "offline-add",
          icon: WifiOff,
          label: downloading === song.id ? "..." : t("downloadForOffline"),
          onClick: () => downloadForOffline(song),
        },
    { id: "div2", label: "", divider: true },
    ...(song.artistId
      ? [{ id: "artist", icon: User, label: t("goToArtist"), onClick: () => router.push(`/artist/${song.artistId}`) }]
      : []),
    ...(song.albumId
      ? [{ id: "album", icon: Disc3, label: t("goToAlbum"), onClick: () => router.push(`/album/${song.albumId}`) }]
      : []),
    { id: "div3", label: "", divider: true },
    {
      id: "share",
      icon: Share2,
      label: t("share"),
      onClick: () => {
        navigator.clipboard?.writeText(`${window.location.origin}/search?q=${encodeURIComponent(song.title)}`);
      },
    },
    {
      id: "detail",
      icon: Play,
      label: t("nowPlaying") || "Detay",
      onClick: () => openSongModal(song),
    },
  ];

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      <StevenActionMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        title={t("song")}
        subtitle={song.title}
      />
    </div>
  );
}
