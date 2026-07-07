"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { StevenActionMenu } from "@/components/navigation/StevenActionMenu";
import { formatPlayCount, formatDuration, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, PlusCircle, ChevronDown,
  Play, Disc3, MoreHorizontal,
  Eye, ListMusic, Mic2,
} from "lucide-react";
import type { SongType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { showErrorToast } from "@/store/toastStore";
import { NowPlayingIdleCanvas } from "@/components/player/NowPlayingIdleCanvas";

const PANEL_WIDTH = 340;

export function NowPlayingSidebar() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isOpen = usePlayerStore((s) => s.isNowPlayingOpen);
  const setNowPlayingOpen = usePlayerStore((s) => s.setNowPlayingOpen);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const playlistPlayback = useQueueStore((s) => s.playlistPlayback);

  const [isLiked, setIsLiked] = useState(false);
  const [artistSongs, setArtistSongs] = useState<SongType[]>([]);
  const [showArtist, setShowArtist] = useState(true);
  const [channelSubscribers, setChannelSubscribers] = useState<number | null>(null);
  const [hoveredSongId, setHoveredSongId] = useState<string | null>(null);
  const [npMenuOpen, setNpMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);
  const toggleQueueOpen = useQueueStore((s) => s.toggleQueueOpen);

  const headerTitle = playlistPlayback?.playlistTitle || t("nowPlaying");

  useEffect(() => {
    if (!activeSong) return;
    fetch(`/api/likes/check?songId=${encodeURIComponent(activeSong.id)}`)
      .then((r) => r.json())
      .then((d) => setIsLiked(!!d.liked))
      .catch(() => {});
  }, [activeSong?.id]);

  useEffect(() => {
    setChannelSubscribers(null);
    const artistId = activeSong?.artistId;
    if (artistId?.startsWith("yt_channel_")) {
      const channelId = artistId.replace("yt_channel_", "");
      fetch(`/api/youtube/channel-stats?channelId=${encodeURIComponent(channelId)}`)
        .then((r) => r.json())
        .then((d) => setChannelSubscribers(d.subscriberCount ?? null))
        .catch(() => {});
    }
  }, [activeSong?.artistId]);

  useEffect(() => {
    if (!activeSong?.artistId || activeSong.artistId.startsWith("yt_channel_")) {
      setArtistSongs([]);
      return;
    }
    const artistId = activeSong.artistId;
    const ctrl = new AbortController();
    fetch(`/api/songs?artistId=${encodeURIComponent(artistId)}&limit=8`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const filtered = data
          .filter((s: SongType) => s.id !== activeSong.id && s.artistId === artistId)
          .slice(0, 5);
        setArtistSongs(filtered);
      })
      .catch(() => setArtistSongs([]));
    return () => ctrl.abort();
  }, [activeSong?.artistId, activeSong?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeSong?.id]);

  const handleLike = async () => {
    if (!activeSong) return;
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: activeSong.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showErrorToast(typeof d.error === "string" ? d.error : t("loadError"));
        return;
      }
      setIsLiked(!!d.liked);
    } catch {
      showErrorToast(t("loadError"));
    }
  };

  const upcoming = playlistPlayback
    ? playlistPlayback.songs.slice(playlistPlayback.currentIndex + 1, playlistPlayback.currentIndex + 6)
    : queue.slice(currentIndex + 1, currentIndex + 6);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const renderHeader = (showClose: boolean) => (
    <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">( 03 )</span>
        <span className="truncate text-sm font-medium tracking-tight text-white">{headerTitle}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setNpMenuOpen(true)}
          className="rounded-full p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Seçenekler"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {showClose && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setNowPlayingOpen(false)}
            className="rounded-full p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (!activeSong) {
      return (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full min-h-0 flex-col px-1 pb-2 pt-0.5"
        >
          <NowPlayingIdleCanvas />
        </motion.div>
      );
    }

    const listeners = activeSong.artist?.monthlyListeners ?? channelSubscribers ?? 0;

    return (
      <motion.div
        key={activeSong.id}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
      >
        
        <div className="px-3 pt-2">
          <motion.div
            key={activeSong.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="group relative aspect-square w-full overflow-hidden rounded-xl border border-white/[0.08]"
          >
            <Image
              src={proxiedImageUrl(activeSong.coverImage, activeSong.audioUrl) || "/images/placeholder-song.svg"}
              alt={activeSong.title}
              fill
              sizes={`${PANEL_WIDTH}px`}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
              <motion.div
                className="h-full bg-white/70"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </motion.div>
        </div>

        
        <div className="px-3 pt-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-bold leading-tight text-white">
                {activeSong.title}
              </h3>
              <Link
                href={`/artist/${activeSong.artistId}`}
                className="inline text-[13px] text-white/50 transition-colors hover:text-white hover:underline"
              >
                {activeSong.artist?.name || t("unknownArtist")}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-0">
              <button
                onClick={handleLike}
                className={cn(
                  "rounded-full p-1.5 transition-all",
                  isLiked ? "text-green-400" : "text-white/30 hover:text-white/60"
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              </button>
              <button className="rounded-full p-1.5 text-white/30 transition-all hover:text-white/60">
                <PlusCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        
        {(activeSong.album || activeSong.genre) && (
          <div className="mx-3 mt-2 flex flex-wrap items-center gap-1.5">
            {activeSong.album && (
              <Link
                href={`/album/${activeSong.albumId}`}
                className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                <Disc3 className="h-3 w-3" />
                {activeSong.album.title}
              </Link>
            )}
            {activeSong.genre && (
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/10">
                {activeSong.genre.name}
              </span>
            )}
          </div>
        )}

        
        {activeSong.playCount > 0 && (
          <div className="mx-3 mt-2 flex items-center gap-1.5 text-[10px] text-white/30">
            <Eye className="h-3 w-3" />
            <span>{formatPlayCount(activeSong.playCount)} {t("playbackCount")}</span>
          </div>
        )}

        
        {upcoming.length > 0 && (
          <div className="mx-3 mt-4">
            <p className="mb-1.5 text-[11px] font-bold text-white/50">
              {t("upNext")}
            </p>
            <div className="space-y-0.5">
              {upcoming.map((song, i) => (
                <button
                  key={`${song.id}-${i}`}
                  onMouseEnter={() => setHoveredSongId(`up-${song.id}-${i}`)}
                  onMouseLeave={() => setHoveredSongId(null)}
                  onClick={() => {
                    if (playlistPlayback) {
                      const newIdx = playlistPlayback.currentIndex + 1 + i;
                      useQueueStore.setState({
                        playlistPlayback: { ...playlistPlayback, currentIndex: newIdx },
                      });
                    } else {
                      useQueueStore.setState({ currentIndex: currentIndex + 1 + i });
                    }
                    setActiveSong(song);
                  }}
                  className="group/q flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-all hover:bg-white/[0.06]"
                >
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
                      alt={song.title}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                    {hoveredSongId === `up-${song.id}-${i}` && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Play className="h-3 w-3 fill-white text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-white/70 group-hover/q:text-white">
                      {song.title}
                    </p>
                    <p className="truncate text-[10px] text-white/30">{song.artist?.name}</p>
                  </div>
                  <span className="text-[10px] text-white/20">{formatDuration(song.duration ?? 0)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        
        <div className="mx-3 mt-4">
          <button
            onClick={() => setShowArtist(!showArtist)}
            className="mb-1 flex w-full items-center justify-between"
          >
            <span className="text-[11px] font-bold text-white/50">{t("artist")}</span>
            <motion.div animate={{ rotate: showArtist ? 180 : 0 }}>
              <ChevronDown className="h-3 w-3 text-white/30" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showArtist && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {(() => {
                  const isYt = activeSong.artistId.startsWith("yt_channel_");
                  const ytUrl = isYt
                    ? `https://www.youtube.com/channel/${activeSong.artistId.replace("yt_channel_", "")}`
                    : null;
                  const Wrapper = isYt && ytUrl
                    ? ({ children: c }: { children: React.ReactNode }) => <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="block">{c}</a>
                    : ({ children: c }: { children: React.ReactNode }) => <Link href={`/artist/${activeSong.artistId}`} className="block">{c}</Link>;

                  return (
                    <Wrapper>
                      <div className="group/artist overflow-hidden rounded-lg bg-white/[0.04] transition-colors hover:bg-white/[0.07]">
                        <div className="relative h-20 w-full overflow-hidden">
                          <Image
                            src={proxiedImageUrl(activeSong.artist?.profileImage || activeSong.coverImage) || "/images/placeholder-song.svg"}
                            alt={activeSong.artist?.name || t("artist")}
                            fill
                            sizes={`${PANEL_WIDTH}px`}
                            className="object-cover transition-transform duration-500 group-hover/artist:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            <p className="text-[13px] font-bold text-white">
                              {activeSong.artist?.name || t("artist")}
                            </p>
                            {listeners > 0 && (
                              <p className="text-[10px] text-white/50">
                                {t("monthlyListeners")}: {formatPlayCount(listeners)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-[11px] text-white/40">{t("goToArtistPage")}</span>
                          <span className="rounded-full border border-white/20 px-3 py-0.5 text-[10px] font-semibold text-white transition-colors hover:border-white/40">
                            {t("follow")}
                          </span>
                        </div>
                      </div>
                    </Wrapper>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        {artistSongs.length > 0 && (
          <div className="mx-3 mt-4">
            <p className="mb-1.5 text-[11px] font-bold text-white/50">
              {t("popularSongs")}
            </p>
            <div className="space-y-0.5">
              {artistSongs.map((song, idx) => (
                <button
                  key={`${song.id}-${idx}`}
                  onMouseEnter={() => setHoveredSongId(song.id)}
                  onMouseLeave={() => setHoveredSongId(null)}
                  onClick={() => setActiveSong(song)}
                  className="group/song flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-all hover:bg-white/[0.06]"
                >
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
                      alt={song.title}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                    {hoveredSongId === song.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Play className="h-3 w-3 fill-white text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-white/70 group-hover/song:text-white">
                      {song.title}
                    </p>
                    <p className="truncate text-[10px] text-white/30">
                      {song.artist?.name}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/20">{formatDuration(song.duration ?? 0)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
      </motion.div>
    );
  };

  const showDesktop = !isMobile;
  const showMobile = isMobile && isOpen;

  if (!showDesktop && !showMobile) return null;

  return (
    <>
      {showMobile && (
        <AnimatePresence>
          <motion.div
            key="nowplaying-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[84] bg-black/55 lg:hidden"
            onClick={() => setNowPlayingOpen(false)}
          />
        </AnimatePresence>
      )}

      {showMobile ? (
        <AnimatePresence>
          <motion.div
            key="nowplaying-panel-mobile"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-[var(--main-content-bottom-padding)] z-[var(--z-sheet)] flex max-h-[min(75vh,640px)] w-full flex-col rounded-t-2xl border border-b-0 border-white/10 premium-now-playing-shell shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="flex min-h-0 max-h-full flex-1 flex-col overflow-hidden">
              {renderHeader(true)}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
              >
                <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="premium-now-playing-shell fixed top-[var(--navbar-height)] bottom-[var(--player-height)] right-0 z-[var(--z-now-playing)] hidden flex-col lg:flex"
          style={{ width: PANEL_WIDTH }}
        >
          <div className="mx-2 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {renderHeader(false)}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
            >
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      <StevenActionMenu
        open={npMenuOpen}
        onClose={() => setNpMenuOpen(false)}
        title={t("nowPlaying")}
        subtitle={activeSong?.title}
        closeLabel="Kapat"
        items={[
          {
            id: "queue",
            label: t("queue"),
            icon: ListMusic,
            onClick: () => {
              toggleQueueOpen();
              setNpMenuOpen(false);
            },
          },
          {
            id: "lyrics",
            label: t("lyricsNav"),
            icon: Mic2,
            onClick: () => {
              toggleLyrics();
              setNpMenuOpen(false);
            },
          },
          ...(activeSong?.artistId
            ? [
                {
                  id: "artist",
                  label: "Sanatçı sayfası",
                  icon: Disc3,
                  href: `/artist/${activeSong.artistId}`,
                  onNavigate: () => setNpMenuOpen(false),
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
