"use client";

import { useState, useEffect, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { SongType } from "@/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, PlusCircle, Clock, Loader2, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { SongContextMenu } from "@/components/ui/context-menu";

const ITEMS_PER_PAGE = 20;

function SongRow({
  song,
  index,
  onPlay,
  onAddQueue,
  openModal,
}: {
  song: SongType & { playedAt?: string };
  index: number;
  onPlay: () => void;
  onAddQueue: () => void;
  openModal: () => void;
}) {
  const { t } = useTranslation();
  return (
    <SongContextMenu song={song}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={openModal}
        className="group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.06]"
      >
        <span className="w-6 text-center text-sm text-muted">{index + 1}</span>
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
          {proxiedImageUrl(song.coverImage) ? (
            <Image src={proxiedImageUrl(song.coverImage)!} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-6 w-6 text-white/40" />
            </div>
          )}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
          >
            <Play className="h-6 w-6 fill-white text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{song.title}</p>
          <p className="truncate text-xs text-muted">{song.artist?.name ?? t("unknown")}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onAddQueue(); }}
          className="rounded-full p-2 text-muted opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
        >
          <PlusCircle className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </SongContextMenu>
  );
}

export default function RecentlyPlayedPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<(SongType & { playedAt?: string })[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const openSongModal = useModalStore((s) => s.openSongModal);

  const canPrev = page > 0;
  const canNext = hasNextPage;

  const playSong = useCallback((songs: SongType[], idx: number) => {
    if (idx < 0 || idx >= songs.length) return;
    const song = songs[idx];
    clearPlaylistPlayback();
    setActiveSong(song);
  }, [clearPlaylistPlayback, setActiveSong]);

  const addToQueueWithSimilar = useAddToQueueWithSimilar({ insertAfterCurrent: true });

  const refetchHistory = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      const offset = page * ITEMS_PER_PAGE;
      fetch(`/api/history?limit=${ITEMS_PER_PAGE + 1}&offset=${offset}`)
        .then((r) => r.json())
        .then((data) => {
          const items = Array.isArray(data) ? data : [];
          setHasNextPage(items.length > ITEMS_PER_PAGE);
          setHistory(items.slice(0, ITEMS_PER_PAGE));
        })
        .catch(() => setHistory([]))
        .finally(() => !silent && setLoading(false));
    },
    [page]
  );

  useEffect(() => {
    refetchHistory();
  }, [refetchHistory]);

  useRefreshInterval(() => refetchHistory(true), 5000, true);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("recentlyPlayed")}</h1>
        <p className="mt-1 text-muted">{t("historyWillAppear")}</p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-white">{t("recentlyListened")}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl bg-white/[0.03] py-16 text-center">
            <Music className="mx-auto h-12 w-12 text-muted/50" />
            <p className="mt-3 text-sm font-medium text-muted">{t("noHistoryYet")}</p>
            <p className="mt-1 text-xs text-muted/70">{t("historyWillAppear")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {history.map((song, idx) => (
                <SongRow
                  key={`${song.id}-${page * ITEMS_PER_PAGE + idx}`}
                  song={song}
                  index={page * ITEMS_PER_PAGE + idx}
                  onPlay={() => playSong(history, idx)}
                  onAddQueue={() => addToQueueWithSimilar(song)}
                  openModal={() => openSongModal(song)}
                />
              ))}
            </div>
            {(canPrev || canNext) && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!canPrev}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("previous")}
                </button>
                <span className="text-sm text-muted">
                  {t("page")} {page + 1}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!canNext}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10"
                >
                  {t("next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
