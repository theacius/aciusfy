"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Music, Play, Trash2 } from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { useTranslation } from "@/hooks/useTranslation";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn, formatDuration } from "@/lib/utils";
import {
  listOfflineSongsWithMeta,
  removeOfflineAudio,
  getOfflineStorageSize,
  clearAllOfflineAudio,
  type OfflineSongMeta,
} from "@/lib/offline-storage";
import { useOfflineStore } from "@/store/offlineStore";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import type { SongType } from "@/types";

function formatStorageSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${Math.max(0, bytes / 1024).toFixed(1)} KB`;
}

function metaToSong(m: OfflineSongMeta): SongType {
  return {
    id: m.songId,
    title: m.title,
    artistId: "",
    albumId: null,
    genreId: null,
    duration: m.duration,
    audioUrl: "",
    coverImage: m.coverImage ?? null,
    previewVideoUrl: null,
    playCount: 0,
    isPublished: true,
    createdAt: new Date(),
    artist: m.artist
      ? {
          id: "",
          userId: "",
          name: m.artist,
          bio: null,
          profileImage: null,
          bannerImage: null,
          verified: false,
          monthlyListeners: 0,
          createdAt: new Date(),
        }
      : undefined,
  };
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg px-4 py-3">
      <div className="h-9 w-9 flex-shrink-0 rounded-full bg-white/5" />
      <div className="relative h-10 w-10 flex-shrink-0 rounded bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-white/5" />
        <div className="h-3 w-1/5 rounded bg-white/5" />
      </div>
      <div className="h-3 w-10 rounded bg-white/5" />
      <div className="h-8 w-8 rounded bg-white/5" />
    </div>
  );
}

export default function DownloadsPage() {
  const { t } = useTranslation();
  const [metaList, setMetaList] = useState<OfflineSongMeta[]>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const setDownloadedIds = useOfflineStore((s) => s.setDownloadedIds);
  const removeDownloaded = useOfflineStore((s) => s.removeDownloaded);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setPlaylistPlayback = useQueueStore((s) => s.setPlaylistPlayback);

  const songs = useMemo(() => metaList.map(metaToSong), [metaList]);

  const refresh = useCallback(async () => {
    try {
      const [meta, size] = await Promise.all([
        listOfflineSongsWithMeta(),
        getOfflineStorageSize(),
      ]);
      const sorted = [...meta].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
      setMetaList(sorted);
      setStorageBytes(size);
      setDownloadedIds(sorted.map((m) => m.songId));
    } catch {
      setMetaList([]);
      setStorageBytes(0);
      setDownloadedIds([]);
    } finally {
      setLoading(false);
    }
  }, [setDownloadedIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handlePlay = (index: number) => {
    if (index < 0 || index >= songs.length) return;
    const song = songs[index];
    setPlaylistPlayback("downloads", songs, index, t("downloads"));
    setActiveSong(song);
  };

  const handleDelete = async (songId: string) => {
    try {
      await removeOfflineAudio(songId);
      removeDownloaded(songId);
      setMetaList((prev) => prev.filter((m) => m.songId !== songId));
      setStorageBytes(await getOfflineStorageSize());
    } catch {
      void refresh();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t("confirmClearAll"))) return;
    setClearing(true);
    try {
      await clearAllOfflineAudio();
      setDownloadedIds([]);
      setMetaList([]);
      setStorageBytes(0);
    } catch {
      void refresh();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <h1 className="text-3xl font-bold text-foreground">{t("downloads")}</h1>
        <p className="mt-1 text-sm text-muted">{t("offlineDesc")}</p>
      </ScrollReveal>

      <ScrollReveal delay={0.08}>
        <div
          className={cn(
            "flex flex-col gap-4 rounded-2xl border border-white/5 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
              <Download className="h-6 w-6 text-muted" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {t("storageUsed")}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {formatStorageSize(storageBytes)}
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={metaList.length === 0 || clearing}
            onClick={() => void handleClearAll()}
            className={cn(
              "rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition-colors",
              "hover:bg-red-500/20 disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            {t("clearAllDownloads")}
          </motion.button>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.16}>
        {loading ? (
          <div className="space-y-1 rounded-xl border border-white/5 bg-card/50 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : metaList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-card/30 px-6"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Download className="h-8 w-8 text-muted" />
            </div>
            <p className="text-center text-lg font-semibold text-foreground">
              {t("downloadsEmpty")}
            </p>
            <p className="mt-1 max-w-md text-center text-sm text-muted">
              {t("noOfflineSongsSubtitle")}
            </p>
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-card/50">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 border-b border-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted sm:gap-4 sm:px-4">
              <span className="w-10 sm:w-12" aria-hidden />
              <span className="min-w-0">{t("title")}</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Music className="h-3.5 w-3.5 shrink-0" />
                {t("duration")}
              </span>
              <span className="w-10 text-center sm:w-12" aria-hidden />
            </div>
            <div className="divide-y divide-white/5">
              {metaList.map((m, index) => (
                <motion.div
                  key={m.songId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.04,
                    duration: 0.35,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 sm:gap-4"
                >
                  <div className="flex w-10 justify-center sm:w-12">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handlePlay(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent shadow-lg transition-opacity"
                      aria-label={t("play")}
                    >
                      <Play className="h-4 w-4 fill-white text-white" />
                    </motion.button>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white/5">
                      {proxiedImageUrl(m.coverImage) ? (
                        <Image
                          src={proxiedImageUrl(m.coverImage)!}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music className="h-4 w-4 text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                      <p className="truncate text-xs text-muted">
                        {m.artist ?? t("unknownArtist")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-muted">
                    {formatDuration(m.duration)}
                  </span>
                  <div className="flex w-10 justify-center sm:w-12">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => void handleDelete(m.songId)}
                      className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-red-400"
                      title={t("deleteDownload")}
                      aria-label={t("deleteDownload")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
