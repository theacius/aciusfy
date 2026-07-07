"use client";

import { useState, useEffect, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { useSettingsStore } from "@/store/settingsStore";
import { SongType } from "@/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, PlusCircle, Sparkles, Loader2 } from "lucide-react";
import { SongContextMenu } from "@/components/ui/context-menu";
import { MagicCard } from "@/components/ui/magic-card";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

function SongGridCard({
  song,
  index,
  onPlay,
  onAddQueue,
  openModal,
}: {
  song: SongType;
  index: number;
  onPlay: () => void;
  onAddQueue: () => void;
  openModal: () => void;
}) {
  const { t } = useTranslation();
  return (
    <SongContextMenu song={song}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="group"
      >
        <MagicCard
          onClick={openModal}
          className="cursor-pointer overflow-hidden rounded-xl bg-card p-3 transition-all hover:bg-card-hover"
          imageUrl={proxiedImageUrl(song.coverImage, song.audioUrl) ?? undefined}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
              alt={song.title}
              fill
              sizes="200px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 shadow-lg"
              >
                <Play className="h-5 w-5 fill-black text-black" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onAddQueue(); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <PlusCircle className="h-4 w-4 text-white" />
              </motion.button>
            </div>
          </div>
          <div className="mt-2 min-w-0 overflow-hidden">
            <p className="truncate text-sm font-semibold text-white">{song.title}</p>
            <p className="truncate text-xs text-muted" title={song.artist?.name ?? t("unknown")}>
              {song.artist?.name ?? t("unknown")}
              {song.genre ? ` · ${song.genre.name}` : ""}
            </p>
          </div>
        </MagicCard>
      </motion.div>
    </SongContextMenu>
  );
}

export default function RecommendationsPage() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<SongType[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const openSongModal = useModalStore((s) => s.openSongModal);

  const playSong = useCallback((songs: SongType[], idx: number) => {
    if (idx < 0 || idx >= songs.length) return;
    const song = songs[idx];
    clearPlaylistPlayback();
    setActiveSong(song);
  }, [clearPlaylistPlayback, setActiveSong]);

  const addToQueueWithSimilar = useAddToQueueWithSimilar({ insertAfterCurrent: true });

  const allowExplicit = useSettingsStore((s) => s.allowExplicit);
  const refetchRecs = useCallback(
    (silent = false) => {
      if (!silent) setLoadingRecs(true);
      fetch("/api/recommendations")
        .then((r) => r.json())
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          const filtered = allowExplicit ? arr : arr.filter((s: { isExplicit?: boolean }) => !s.isExplicit);
          setRecommendations(filtered);
        })
        .catch(() => setRecommendations([]))
        .finally(() => !silent && setLoadingRecs(false));
    },
    [allowExplicit]
  );

  useEffect(() => {
    refetchRecs();
  }, [refetchRecs]);

  useRefreshInterval(() => refetchRecs(true), 5000, true);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("recommendations")}</h1>
        <p className="mt-1 text-muted">{t("recommendationsDesc")}</p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-bold text-white">{t("forYouRecommendations")}</h2>
        </div>
        {loadingRecs ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white/5 p-3">
                <div className="aspect-square rounded-lg bg-white/5" />
                <div className="mt-3 h-4 w-3/4 rounded bg-white/5" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-xl bg-white/[0.03] py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted/50" />
            <p className="mt-3 text-sm font-medium text-muted">{t("preparingRecommendations")}</p>
            <p className="mt-1 text-xs text-muted/70">{t("listenMoreForRecs")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recommendations.map((song, idx) => (
              <SongGridCard
                key={`rec-${idx}-${song.id}`}
                song={song}
                index={idx}
                onPlay={() => playSong(recommendations, idx)}
                onAddQueue={() => addToQueueWithSimilar(song)}
                openModal={() => openSongModal(song)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
