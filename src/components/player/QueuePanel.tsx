"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQueueStore } from "@/store/queueStore";
import { usePlayerStore } from "@/store/playerStore";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Play, Trash2, GripVertical } from "lucide-react";
import Image from "next/image";
import { formatDuration, cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { useIsMobile } from "@/hooks/useIsMobile";
import { StevenSheetHeader } from "@/components/navigation/StevenSheetHeader";

function SongRow({
  song,
  index,
  isCurrent,
  onPlay,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
}: {
  song: { id: string; title: string; coverImage?: string | null; artist?: { name: string } | null; duration?: number };
  index: number;
  isCurrent?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
}) {
  const { t } = useTranslation();
  const inner = (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.05]",
        isDragOver && "border-t-2 border-purple-500/50 bg-purple-500/5"
      )}
      onClick={onPlay}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {draggable && (
        <div className="flex w-4 flex-shrink-0 cursor-grab items-center justify-center text-white/15 hover:text-white/40 active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex w-5 flex-shrink-0 items-center justify-center">
        <span className="text-xs text-muted group-hover:hidden">{index + 1}</span>
        <Play className="hidden h-3.5 w-3.5 text-white group-hover:block" />
      </div>
      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded">
        <Image
          src={proxiedImageUrl(song.coverImage) || "/images/placeholder-song.svg"}
          alt={song.title}
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", isCurrent ? "font-medium text-white" : "text-white/70")}>
          {song.title}
        </p>
        <p className="truncate text-xs text-muted">{song.artist?.name}</p>
      </div>
      {song.duration != null && (
        <span className="text-xs text-muted">{formatDuration(song.duration)}</span>
      )}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  if (draggable) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {inner}
    </motion.div>
  );
}

export function QueuePanel() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const queueSource = useQueueStore((s) => s.queueSource);
  const playlistPlayback = useQueueStore((s) => s.playlistPlayback);
  const isQueueOpen = useQueueStore((s) => s.isQueueOpen);
  const toggleQueueOpen = useQueueStore((s) => s.toggleQueueOpen);
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue);
  const reorderQueue = useQueueStore((s) => s.reorderQueue);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setQueue = useQueueStore((s) => s.setQueue);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const playlistUpcoming = playlistPlayback && playlistPlayback.playlistId !== "autoplay"
    ? playlistPlayback.songs.slice(playlistPlayback.currentIndex + 1)
    : [];
  const queueUpcoming = queueSource === "queue" ? queue.slice(currentIndex + 1) : queue;

  const handlePlayFromQueue = (idx: number) => {
    const song = queue[idx];
    if (!song) return;
    setQueue(queue, idx, "queue");
    setActiveSong(song);
  };

  const handlePlayFromPlaylist = (idx: number) => {
    if (!playlistPlayback) return;
    const song = playlistPlayback.songs[playlistPlayback.currentIndex + 1 + idx];
    if (!song) return;
    useQueueStore.setState({
      playlistPlayback: {
        ...playlistPlayback,
        currentIndex: playlistPlayback.currentIndex + 1 + idx,
      },
    });
    setActiveSong(song);
  };

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <>
          {isMobile && (
            <motion.div
              key="queue-backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[84] bg-black/55 lg:hidden"
              onClick={toggleQueueOpen}
            />
          )}
          <motion.div
            key="queue-panel"
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn(
              "premium-now-playing-shell fixed z-[var(--z-sheet)] flex flex-col shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-[var(--main-content-bottom-padding)] max-h-[min(72vh,560px)] w-full rounded-t-2xl border border-b-0 border-white/10"
                : "top-[var(--navbar-height)] bottom-[var(--player-height)] right-0 w-[380px] border-l border-white/[0.06]",
            )}
          >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <StevenSheetHeader
              icon={ListMusic}
              sectionIndex="( 01 )"
              label={t("queue")}
              onClose={toggleQueueOpen}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeSong && (
                <div className="border-b border-white/5 px-5 py-3">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {t("currentlyPlaying")}
                  </p>
                  <div className="flex items-center gap-3 rounded-lg bg-white/[0.05] p-2">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={proxiedImageUrl(activeSong.coverImage, activeSong.audioUrl) || "/images/placeholder-song.svg"}
                        alt={activeSong.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{activeSong.title}</p>
                      <p className="truncate text-xs text-muted">{activeSong.artist?.name}</p>
                    </div>
                    <span className="text-xs text-muted">{formatDuration(activeSong.duration)}</span>
                  </div>
                </div>
              )}

              {playlistUpcoming.length > 0 && (
                <div className="border-b border-white/5 px-5 py-3">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {t("upNext")} · {playlistUpcoming.length} {t("song")}
                  </p>
                  <div className="space-y-1">
                    {playlistUpcoming.map((song, idx) => (
                      <SongRow
                        key={`pl-${song.id}-${idx}`}
                        song={song}
                        index={idx}
                        onPlay={() => handlePlayFromPlaylist(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {queueUpcoming.length > 0 && (
                <div className="px-5 py-3">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {t("queue")} · {queueUpcoming.length} {t("song")}
                  </p>
                  <div className="space-y-1">
                    {queueUpcoming.map((song, idx) => {
                      const actualIdx = queueSource === "queue" ? currentIndex + 1 + idx : idx;
                      return (
                        <SongRow
                          key={`q-${song.id}-${idx}`}
                          song={song}
                          index={idx}
                          onPlay={() => handlePlayFromQueue(actualIdx)}
                          onRemove={() => removeFromQueue(actualIdx)}
                          draggable
                          isDragOver={dragOverIndex === actualIdx}
                          onDragStart={(e) => {
                            setDragIndex(actualIdx);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverIndex(actualIdx);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragIndex !== null && dragIndex !== actualIdx) {
                              reorderQueue(dragIndex, actualIdx);
                            }
                            setDragIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setDragOverIndex(null);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {playlistUpcoming.length === 0 && queueUpcoming.length === 0 && (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm text-muted">{t("queueEmpty")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
