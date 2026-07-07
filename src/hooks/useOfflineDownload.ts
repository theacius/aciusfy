"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useOfflineStore } from "@/store/offlineStore";
import {
  putOfflineAudio,
  removeOfflineAudio,
  getOfflineAudio,
} from "@/lib/offline-storage";
import type { SongType } from "@/types";

export function useOfflineDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const downloadQuality = useSettingsStore((s) => s.downloadQuality);
  const addDownloaded = useOfflineStore((s) => s.addDownloaded);
  const removeDownloaded = useOfflineStore((s) => s.removeDownloaded);
  const isDownloaded = useOfflineStore((s) => s.isDownloaded);

  const downloadForOffline = useCallback(
    async (song: SongType): Promise<boolean> => {
      if (!song?.id || downloading) return false;
      setDownloading(song.id);
      setError(null);
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
        if (!res.ok) throw new Error(data?.error ?? "İndirme başarısız");

        const streamUrl = data?.url;
        if (!streamUrl) throw new Error("URL alınamadı");

        const fullUrl =
          typeof window !== "undefined" && streamUrl.startsWith("/")
            ? `${window.location.origin}${streamUrl}`
            : streamUrl;

        const blobRes = await fetch(fullUrl);
        if (!blobRes.ok) throw new Error("Ses dosyası alınamadı");
        const blob = await blobRes.blob();
        if (!blob || blob.size < 1000) throw new Error("Geçersiz ses dosyası");

        await putOfflineAudio(song.id, blob, {
          songId: song.id,
          title: song.title,
          artist: song.artist?.name ?? null,
          coverImage: song.coverImage ?? null,
          duration: song.duration ?? 0,
        });
        addDownloaded(song.id);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "İndirme başarısız");
        return false;
      } finally {
        setDownloading(null);
      }
    },
    [downloading, downloadQuality, addDownloaded]
  );

  const removeFromOffline = useCallback(
    async (songId: string): Promise<void> => {
      await removeOfflineAudio(songId);
      removeDownloaded(songId);
    },
    [removeDownloaded]
  );

  const getOfflineBlobUrl = useCallback(async (songId: string): Promise<string | null> => {
    const blob = await getOfflineAudio(songId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, []);

  return {
    downloadForOffline,
    removeFromOffline,
    getOfflineBlobUrl,
    downloading,
    error,
    isDownloaded,
    clearError: () => setError(null),
  };
}
