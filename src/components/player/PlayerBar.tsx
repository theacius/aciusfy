"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn, formatDuration } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useAudio } from "@/components/providers/AudioProvider";
import { useQueueStore } from "@/store/queueStore";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
  Moon,
  PictureInPicture2,
  RefreshCw,
  X,
} from "lucide-react";
import { useSleepTimerStore } from "@/store/sleepTimerStore";
import { showErrorToast } from "@/store/toastStore";
import { usePipStore } from "@/store/pipStore";
import { ListenTogetherButton } from "@/components/listen-together/ListenTogetherButton";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

export function PlayerBar() {
  const { t } = useTranslation();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isDownloading = usePlayerStore((s) => s.isDownloading);
  const volume = usePlayerStore((s) => s.volume);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const streamError = usePlayerStore((s) => s.streamError);
  const setStreamError = usePlayerStore((s) => s.setStreamError);
  const { seekTo, unlockAndPlay } = useAudio();

  const handlePlayPause = useCallback(() => {
    if (activeSong && !isPlaying) unlockAndPlay();
    else togglePlay();
  }, [activeSong, isPlaying, togglePlay, unlockAndPlay]);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const isNowPlayingOpen = usePlayerStore((s) => s.isNowPlayingOpen);
  const toggleNowPlaying = usePlayerStore((s) => s.toggleNowPlaying);
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);

  const queue = useQueueStore((s) => s.queue);
  const queueSource = useQueueStore((s) => s.queueSource);
  const setQueue = useQueueStore((s) => s.setQueue);
  const nextSong = useQueueStore((s) => s.nextSong);
  const prevSong = useQueueStore((s) => s.prevSong);
  const isQueueOpen = useQueueStore((s) => s.isQueueOpen);
  const toggleQueueOpen = useQueueStore((s) => s.toggleQueueOpen);

  const isPipOpen = usePipStore((s) => s.isPipOpen);
  const setPipOpen = usePipStore((s) => s.setPipOpen);

  const peekNextSong = useQueueStore((s) => s.peekNextSong);
  const playlistPlayback = useQueueStore((s) => s.playlistPlayback);
  const peekNext = peekNextSong();
  const nextSongInQueue = peekNext;

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const clearSleepTimer = useSleepTimerStore((s) => s.clearSleepTimer);
  const wasPlayingRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasPlayingRef.current === null) {
      wasPlayingRef.current = isPlaying;
      return;
    }
    if (wasPlayingRef.current && !isPlaying) clearSleepTimer();
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, clearSleepTimer]);

  useEffect(() => {
    if (!activeSong) return;
    fetch(`/api/likes/check?songId=${encodeURIComponent(activeSong.id)}`)
      .then((r) => r.json())
      .then((data) => setIsLiked(!!data.liked))
      .catch(() => {});
  }, [activeSong?.id]);

  const handleLike = useCallback(async () => {
    if (!activeSong || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: activeSong.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showErrorToast(typeof data.error === "string" ? data.error : t("loadError"));
        return;
      }
      setIsLiked(!!data.liked);
    } catch {
      showErrorToast(t("loadError"));
    }
    setLikeLoading(false);
  }, [activeSong, likeLoading, t]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleToggleNowPlaying = () => {
    if (isQueueOpen) toggleQueueOpen();
    toggleNowPlaying();
  };

  const handleToggleLyrics = () => {
    if (isQueueOpen) toggleQueueOpen();
    toggleLyrics();
  };

  const handleToggleQueue = () => {
    if (isNowPlayingOpen) usePlayerStore.getState().setNowPlayingOpen(false);
    if (isLyricsOpen) usePlayerStore.getState().setLyricsOpen(false);
    toggleQueueOpen();
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <>
      {streamError && (
        <div
          className="fixed left-0 right-0 z-[60] flex items-center justify-between gap-2 border-b border-amber-500/25 bg-amber-950/50 px-3 py-2 text-xs text-amber-100/95 shadow-lg backdrop-blur-md sm:text-sm"
          style={{
            bottom: "calc(var(--player-height) + var(--player-bottom-offset, 0px))",
          }}
          role="status"
        >
          <span className="min-w-0 flex-1 truncate">{streamError}</span>
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setStreamError(null);
                if (activeSong) unlockAndPlay();
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 font-medium text-amber-50 transition hover:bg-amber-500/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("playbackRetry")}
            </button>
            <button
              type="button"
              onClick={() => setStreamError(null)}
              className="rounded p-1 text-amber-200/80 hover:bg-white/10 hover:text-white"
              aria-label={t("dismissError")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    <footer
      data-aciusfy-player-bar
      className="fixed bottom-[calc(var(--player-bottom-offset)+6px)] left-2 right-2 z-[var(--z-player)] h-[var(--player-height)] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/60 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:left-4 sm:right-4 lg:left-6 lg:right-6"
    >
      <div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-x-1.5 px-1.5 max-lg:gap-x-2 max-lg:px-2 max-lg:py-0 sm:gap-x-3 sm:px-4 sm:py-0 lg:grid-cols-[1fr_minmax(0,min(100%,722px))_1fr]">
        
        <div className="flex min-w-0 items-center justify-self-start gap-2 pl-0.5 sm:gap-3 sm:pl-0">
          <AnimatePresence mode="wait">
            {activeSong ? (
              <motion.div
                key={activeSong.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <button
                  onClick={handleToggleNowPlaying}
                  className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded shadow-lg transition-opacity hover:opacity-80 sm:h-14 sm:w-14"
                >
                  <Image
                    src={proxiedImageUrl(activeSong.coverImage, activeSong.audioUrl) || "/images/placeholder-song.svg"}
                    alt={activeSong.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-end justify-center gap-[2px] bg-black/30 pb-1">
                      <span className="aciusfy-eq-bar" />
                      <span className="aciusfy-eq-bar" />
                      <span className="aciusfy-eq-bar" />
                    </div>
                  )}
                </button>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white hover:underline sm:text-sm">
                    {isDownloading ? t("searching") : activeSong.title}
                  </p>
                  <p className="truncate text-[10px] text-muted hover:text-white hover:underline sm:text-[11px]">
                    {activeSong.artist?.name || t("unknownArtist")}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={cn(
                    "ml-0.5 flex-shrink-0 transition-colors sm:ml-1",
                    isLiked ? "text-emerald-400" : "text-white/30 hover:text-white"
                  )}
                  title={isLiked ? t("removeLike") : t("like")}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                </motion.button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded bg-white/5 sm:h-14 sm:w-14" />
                <p className="text-xs text-muted sm:text-sm">{t("noSongSelected")}</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        
        <div className="flex min-w-0 w-full flex-col items-center justify-center gap-1.5 overflow-hidden max-lg:gap-2 sm:gap-1.5">
          <div className="flex w-full max-w-full items-center justify-center gap-3 sm:gap-5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={cn(
                "hidden transition-colors hover:text-white md:flex",
                isShuffled ? "text-foreground" : "text-white/30"
              )}
              title={t("shuffle")}
            >
              <Shuffle className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const prev = prevSong();
                if (prev) usePlayerStore.getState().setActiveSong(prev);
              }}
              className="text-muted transition-colors hover:text-white"
              title={t("previous")}
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              disabled={!activeSong}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:opacity-40 lg:h-8 lg:w-8"
              title={isPlaying ? t("pause") : t("play")}
            >
              {isPlaying ? (
                <Pause className="h-[18px] w-[18px] fill-current lg:h-4 lg:w-4" />
              ) : (
                <Play className="h-[18px] w-[18px] translate-x-[1px] fill-current lg:h-4 lg:w-4" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const next = nextSong();
                if (next) usePlayerStore.getState().setActiveSong(next);
              }}
              className="text-muted transition-colors hover:text-white"
              title={t("next")}
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleRepeat}
              className={cn(
                "relative hidden transition-colors hover:text-white md:flex",
                repeatMode !== "off" ? "text-foreground" : "text-white/30"
              )}
              title={
                repeatMode === "off"
                  ? t("repeat")
                  : repeatMode === "all"
                    ? t("repeatAll")
                    : t("repeatOne")
              }
            >
              {repeatMode === "one" ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
              {repeatMode !== "off" && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground" />
              )}
            </motion.button>
          </div>

          
          <div className="flex w-full items-center gap-2 max-lg:mt-0.5">
            <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-muted sm:w-10 sm:text-[11px]">
              {formatDuration(Math.floor(progress))}
            </span>
            <div className="group relative h-1 flex-1 rounded-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-foreground transition-colors group-hover:bg-foreground/80"
                style={{ width: `${progressPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleProgressChange}
                className="absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{ cursor: "pointer" }}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>
            <span className="w-9 shrink-0 text-[10px] tabular-nums text-muted sm:w-10 sm:text-[11px]">
              {duration > 0
                ? `-${formatDuration(Math.floor(duration - progress))}`
                : "0:00"}
            </span>
          </div>
        </div>

        
        <div className="flex min-w-0 items-center justify-end justify-self-end gap-1 pr-0.5 max-lg:gap-1.5 max-lg:pr-1 sm:gap-1.5">
          {nextSongInQueue && (
            <button
              onClick={() => {
                const next = nextSong();
                if (next) {
                  usePlayerStore.getState().setActiveSong(next);
                } else if (queue.length > 0 && queueSource !== "queue" && !playlistPlayback) {
                  setQueue(queue, 0, "queue");
                  usePlayerStore.getState().setActiveSong(queue[0]);
                }
              }}
              className="group relative z-10 hidden max-w-[140px] items-center gap-2 overflow-hidden rounded-xl bg-white/[0.03] px-2 py-1.5 ring-1 ring-white/[0.04] transition-all hover:bg-white/[0.06] xl:flex"
              title={`${t("upNext")}: ${nextSongInQueue.title}`}
            >
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                <Image
                  src={proxiedImageUrl(nextSongInQueue.coverImage, nextSongInQueue.audioUrl) || "/images/placeholder-song.svg"}
                  alt={nextSongInQueue.title}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-snug">
                <p className="truncate text-[11px] font-medium text-white/60 group-hover:text-purple-400">
                  {t("upNext")}
                </p>
                <p className="truncate text-[10px] text-muted">
                  {nextSongInQueue.title}
                </p>
              </div>
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleLyrics}
            className={cn("p-1.5 transition-colors hover:text-white sm:p-2", isLyricsOpen ? "text-purple-400" : "text-white/30")}
            title={t("lyricsNav")}
          >
            <Mic2 className="h-4 w-4" />
          </motion.button>

          <div className="hidden lg:block">
            <ListenTogetherButton />
          </div>

          <SleepTimerButton />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleQueue}
            className={cn("p-1.5 transition-colors hover:text-white sm:p-2", isQueueOpen ? "text-purple-400" : "text-white/30")}
            title={t("queue")}
          >
            <ListMusic className="h-4 w-4" />
          </motion.button>

          <div className="hidden items-center gap-1 lg:flex">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-1 text-muted transition-colors hover:text-white"
            >
              <VolumeIcon className="h-4 w-4" />
            </motion.button>
            <div className="group relative h-1 w-24 rounded-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-foreground transition-colors group-hover:bg-foreground/80"
                style={{ width: `${volumePercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0"
                style={{ cursor: "pointer" }}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
                style={{ left: `calc(${volumePercent}% - 6px)` }}
              />
            </div>
          </div>

          {activeSong && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPipOpen(!isPipOpen)}
              className={cn(
                "flex shrink-0 p-1.5 transition-colors hover:text-white sm:p-2",
                isPipOpen ? "text-purple-400" : "text-white/30",
              )}
              title={isPipOpen ? t("closeMiniPlayer") : t("openMiniPlayer")}
              aria-label={isPipOpen ? t("closeMiniPlayer") : t("openMiniPlayer")}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleNowPlaying}
            className={cn(
              "flex shrink-0 p-1.5 transition-colors hover:text-white sm:p-2",
              isNowPlayingOpen ? "text-purple-400" : "text-white/30",
            )}
            title={t("nowPlaying")}
            aria-label={t("nowPlaying")}
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </footer>
    </>
  );
}

function SleepTimerButton() {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const isActive = useSleepTimerStore((s) => s.isActive);
  const remainingMs = useSleepTimerStore((s) => s.remainingMs);
  const mode = useSleepTimerStore((s) => s.mode);
  const setSleepTimer = useSleepTimerStore((s) => s.setSleepTimer);
  const setSleepMode = useSleepTimerStore((s) => s.setSleepMode);
  const clearSleepTimer = useSleepTimerStore((s) => s.clearSleepTimer);
  const tick = useSleepTimerStore((s) => s.tick);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isActive || mode !== "timer") return;
    const interval = setInterval(() => {
      tick();
      const { remainingMs: r, isActive: a } = useSleepTimerStore.getState();
      if (!a && r <= 0 && isPlaying) {
        togglePlay();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, mode, tick, togglePlay, isPlaying]);

  const options = [5, 10, 15, 30, 45, 60, 90];

  const formatRemaining = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusLabel = isActive
    ? mode === "endOfTrack"
      ? t("sleepEndOfTrack")
      : mode === "endOfPlaylist"
        ? t("sleepEndOfPlaylist")
        : formatRemaining(remainingMs)
    : null;

  const items: StevenActionItem[] = [
    ...options.map((min) => ({
      id: `timer-${min}`,
      icon: Moon,
      label: `${min} dk`,
      onClick: () => setSleepTimer(min),
    })),
    { id: "div1", label: "", divider: true },
    {
      id: "end-track",
      icon: Moon,
      label: t("sleepEndOfTrack"),
      onClick: () => setSleepMode("endOfTrack"),
    },
    {
      id: "end-playlist",
      icon: Moon,
      label: t("sleepEndOfPlaylist"),
      onClick: () => setSleepMode("endOfPlaylist"),
    },
  ];
  if (isActive) {
    items.push({ id: "div2", label: "", divider: true });
    items.push({
      id: "cancel",
      icon: Moon,
      label: t("cancel"),
      destructive: true,
      onClick: () => clearSleepTimer(),
    });
  }

  return (
    <div className="relative hidden sm:block">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(true)}
        className={cn("p-2 transition-colors hover:text-foreground", isActive ? "text-foreground" : "text-muted")}
        title={t("sleepTimer")}
      >
        <Moon className="h-4 w-4" />
        {isActive && statusLabel ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-foreground px-1 text-[8px] font-bold text-background">
            {statusLabel}
          </span>
        ) : null}
      </motion.button>
      <StevenActionMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        items={items}
        title={t("sleepTimer")}
        subtitle={statusLabel || undefined}
      />
    </div>
  );
}
