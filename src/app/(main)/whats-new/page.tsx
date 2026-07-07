"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Disc3, Play, Music2, Clock } from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import type { SongType } from "@/types";

export default function WhatsNewPage() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<SongType[]>([]);
  const [loading, setLoading] = useState(true);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setQueue = useQueueStore((s) => s.setQueue);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);

  const fetchSongs = useCallback(() => {
    fetch("/api/whats-new")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSongs(Array.isArray(data) ? data : []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const playAll = () => {
    if (songs.length === 0) return;
    clearPlaylistPlayback();
    setQueue(songs, 0, "queue");
    setActiveSong(songs[0]);
  };

  const playSong = (index: number) => {
    clearPlaylistPlayback();
    setQueue(songs, index, "queue");
    setActiveSong(songs[index]);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-0">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
              <Disc3 className="h-7 w-7 text-purple-400" />
              {t("whatsNew")}
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {t("whatsNewSubtitle")}
            </p>
          </motion.div>

          {songs.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playAll}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            >
              <Play className="h-4 w-4" fill="white" />
              Tümünü Çal
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-purple-400" />
          </div>
        ) : songs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16"
          >
            <Music2 className="h-12 w-12 text-white/20" />
            <p className="text-white/40">{t("noNewReleases")}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => playSong(index)}
                className="group flex cursor-pointer items-center gap-4 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
              >
                <span className="w-6 text-center text-sm text-white/20 group-hover:hidden">
                  {index + 1}
                </span>
                <Play className="hidden h-4 w-4 text-white group-hover:block w-6" />

                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {proxiedImageUrl(song.coverImage, song.audioUrl) ? (
                    <Image
                      src={proxiedImageUrl(song.coverImage, song.audioUrl)!}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music2 className="h-5 w-5 text-white/20" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-white/35">
                    {song.artist ? (
                      <Link
                        href={`/artist/${song.artist.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-purple-400 hover:underline"
                      >
                        {song.artist.name}
                      </Link>
                    ) : (
                      "Bilinmeyen"
                    )}
                  </p>
                </div>

                <div className="hidden items-center gap-2 text-xs text-white/25 sm:flex">
                  <Clock className="h-3 w-3" />
                  {formatDate(song.createdAt)}
                </div>

                {song.duration != null && (
                  <span className="text-xs text-white/25">
                    {formatDuration(song.duration)}
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
