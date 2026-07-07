"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useModalStore } from "@/store/modalStore";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useStartRadio } from "@/hooks/useStartRadio";
import { useSettingsStore } from "@/store/settingsStore";
import { formatDuration, formatPlayCount } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  Play, Pause, Heart, PlusCircle, Share2, Music, Clock, Disc3, Radio,
  Loader2, ChevronDown, Download, WifiOff, CheckCircle,
} from "lucide-react";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import type { SongType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { ShareCardModal } from "@/components/modals/ShareCardModal";
import { CinematicLabel } from "@/components/cinematic";
import { useGsapEntrance } from "@/hooks/useGsapReveal";
import { useState, useCallback } from "react";

const SongDetailThreeHero = dynamic(
  () => import("@/components/premium/SongDetailThreeHero").then((m) => m.SongDetailThreeHero),
  { ssr: false },
);

export function SongDetailModal() {
  const { t } = useTranslation();
  const { selectedSong, isModalOpen, closeSongModal } = useModalStore();
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const startRadio = useStartRadio();

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [artistSongs, setArtistSongs] = useState<typeof selectedSong[]>([]);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const downloadQuality = useSettingsStore((s) => s.downloadQuality);
  const { downloadForOffline, removeFromOffline, downloading, isDownloaded } = useOfflineDownload();
  const panelRef = useGsapEntrance<HTMLDivElement>(0.05);

  const isCurrentSong = activeSong?.id === selectedSong?.id;

  useEffect(() => {
    if (!selectedSong) return;
    fetch(`/api/likes/check?songId=${selectedSong.id}`)
      .then((r) => r.json())
      .then((d) => setIsLiked(!!d.liked))
      .catch(() => {});
  }, [selectedSong?.id]);

  useEffect(() => {
    if (!selectedSong?.artistId) return;
    setLoadingArtist(true);
    fetch(`/api/songs?artistId=${selectedSong.artistId}&limit=5`)
      .then((r) => r.json())
      .then((data) => setArtistSongs(Array.isArray(data) ? data.filter((s: { id: string }) => s.id !== selectedSong.id).slice(0, 4) : []))
      .catch(() => setArtistSongs([]))
      .finally(() => setLoadingArtist(false));
  }, [selectedSong?.artistId, selectedSong?.id]);

  const handleLike = useCallback(async () => {
    if (!selectedSong || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: selectedSong.id }),
      });
      const d = await res.json();
      setIsLiked(!!d.liked);
    } catch {}
    setLikeLoading(false);
  }, [selectedSong, likeLoading]);

  const handlePlay = () => {
    if (!selectedSong) return;
    if (isCurrentSong) {
      togglePlay();
    } else {
      clearPlaylistPlayback();
      setActiveSong(selectedSong);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!selectedSong || downloadLoading) return;
    setDownloadLoading(true);
    try {
      const res = await fetch("/api/audio/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: selectedSong.id,
          artist: selectedSong.artist?.name,
          title: selectedSong.title,
          downloadQuality,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        const url = data.url.startsWith("/") ? `${window.location.origin}${data.url}` : data.url;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedSong.title}.mp3`;
        a.target = "_blank";
        a.click();
      }
    } catch {}
    setDownloadLoading(false);
  }, [selectedSong, downloadLoading, downloadQuality]);

  if (!selectedSong) return null;

  const cover =
    proxiedImageUrl(selectedSong.coverImage, selectedSong.audioUrl) ||
    "/images/placeholder-song.svg";

  const iconBtn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-foreground";

  return (
    <>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center bg-[#09090b]/90 backdrop-blur-xl sm:items-center"
            onClick={closeSongModal}
          >
            <motion.div
              ref={panelRef}
              initial={{ y: "100%", opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] border border-white/[0.08] bg-[#09090b]/98 shadow-[0_40px_120px_rgba(0,0,0,0.55)] sm:max-w-lg sm:rounded-[2rem]"
              style={{ maxHeight: "92vh" }}
            >
              <div className="flex flex-1 flex-col overflow-y-auto" style={{ maxHeight: "92vh" }}>
                <div className="relative min-h-[52vh] w-full flex-shrink-0 overflow-hidden sm:min-h-[48vh]">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 512px"
                    className="object-cover object-center opacity-30 blur-2xl scale-110"
                    aria-hidden
                  />
                  <SongDetailThreeHero coverUrl={cover} />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/40 to-[#09090b]"
                    aria-hidden
                  />

                  <button
                    onClick={closeSongModal}
                    className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/40 p-2.5 text-foreground backdrop-blur-md"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col p-6 pb-8" data-entrance>
                    <CinematicLabel>{t("song")}</CinematicLabel>
                    <h2 className="mt-2 font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
                      {selectedSong.title}
                    </h2>
                    <Link
                      href={`/artist/${selectedSong.artistId}`}
                      onClick={closeSongModal}
                      className="mt-2 text-sm uppercase tracking-[0.14em] text-muted transition hover:text-foreground"
                    >
                      {selectedSong.artist?.name || t("unknownArtist")}
                    </Link>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleLike} disabled={likeLoading} className={iconBtn} aria-label="Like">
                          <Heart className={`h-5 w-5 ${isLiked ? "fill-foreground text-foreground" : ""}`} />
                        </button>
                        <button type="button" onClick={() => addToQueueWithSimilar(selectedSong)} className={iconBtn} title={t("addToQueue")}>
                          <PlusCircle className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => setShareCardOpen(true)} className={iconBtn} title="Paylaş">
                          <Share2 className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={handleDownload} disabled={downloadLoading} className={iconBtn}>
                          {downloadLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { startRadio(selectedSong); closeSongModal(); }}
                          className={iconBtn}
                        >
                          <Radio className="h-5 w-5" />
                        </button>
                        {isDownloaded(selectedSong.id) ? (
                          <button type="button" onClick={() => removeFromOffline(selectedSong.id)} className={iconBtn}>
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          </button>
                        ) : (
                          <button type="button" onClick={() => downloadForOffline(selectedSong)} disabled={downloading === selectedSong.id} className={iconBtn}>
                            {downloading === selectedSong.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <WifiOff className="h-5 w-5" />}
                          </button>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.04 }}
                        onClick={handlePlay}
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                      >
                        {isCurrentSong && isPlaying ? (
                          <Pause className="h-7 w-7" />
                        ) : (
                          <Play className="h-7 w-7 translate-x-0.5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                <div className="relative flex flex-1 flex-col px-6 pt-8 pb-8" data-entrance>
                  <div className="mb-6 space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted" />
                      <span className="text-xs uppercase tracking-[0.12em] text-muted">Süre</span>
                      <span className="ml-auto text-sm text-foreground">{formatDuration(selectedSong.duration)}</span>
                    </div>
                    {selectedSong.album && (
                      <div className="flex items-center gap-3">
                        <Disc3 className="h-4 w-4 text-muted" />
                        <span className="text-xs uppercase tracking-[0.12em] text-muted">{t("album")}</span>
                        <Link href={`/album/${selectedSong.albumId}`} onClick={closeSongModal} className="ml-auto truncate text-sm text-foreground hover:underline">
                          {selectedSong.album.title}
                        </Link>
                      </div>
                    )}
                    {selectedSong.genre && (
                      <div className="flex items-center gap-3">
                        <Music className="h-4 w-4 text-muted" />
                        <span className="text-xs uppercase tracking-[0.12em] text-muted">Tür</span>
                        <span className="ml-auto text-sm text-foreground">{selectedSong.genre.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Play className="h-4 w-4 text-muted" />
                      <span className="text-xs uppercase tracking-[0.12em] text-muted">Dinlenme</span>
                      <span className="ml-auto text-sm text-foreground">{formatPlayCount(selectedSong.playCount)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/artist/${selectedSong.artistId}`}
                    onClick={closeSongModal}
                    className="group mb-6 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                      <Image
                        src={proxiedImageUrl(selectedSong.artist?.profileImage) || cover}
                        alt={selectedSong.artist?.name || t("artist")}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-display text-base text-foreground group-hover:underline">{selectedSong.artist?.name}</p>
                      <p className="text-xs uppercase tracking-[0.1em] text-muted">
                        {selectedSong.artist?.monthlyListeners
                          ? `${formatPlayCount(selectedSong.artist.monthlyListeners)} ${t("monthlyListeners")}`
                          : t("artist")}
                      </p>
                    </div>
                  </Link>

                  {artistSongs.length > 0 && (
                    <div>
                      <CinematicLabel className="mb-4">{t("artistOtherSongs")}</CinematicLabel>
                      <div className="space-y-1">
                        {artistSongs.map((song: SongType | null, i: number) =>
                          song ? (
                            <button
                              key={`${song.id}-${i}`}
                              type="button"
                              onClick={() => { setActiveSong(song); closeSongModal(); }}
                              className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-white/10 hover:bg-white/[0.04]"
                            >
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                                <Image src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"} alt={song.title} fill sizes="48px" className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-foreground">{song.title}</p>
                                <p className="truncate text-xs text-muted">{formatPlayCount(song.playCount)} dinlenme</p>
                              </div>
                              <Play className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100" />
                            </button>
                          ) : null,
                        )}
                      </div>
                    </div>
                  )}
                  {loadingArtist ? (
                    <div className="mt-4 flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted" />
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ShareCardModal isOpen={shareCardOpen} onClose={() => setShareCardOpen(false)} song={selectedSong} />
    </>
  );
}
