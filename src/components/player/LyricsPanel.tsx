"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useAudio } from "@/components/providers/AudioProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { StevenSheetHeader } from "@/components/navigation/StevenSheetHeader";

interface LrcLine {
  time: number;
  text: string;
  endTime?: number;
}

function parseLrc(syncedLyrics: string): LrcLine[] {
  const lines = syncedLyrics.split("\n");
  const result: LrcLine[] = [];
  const regex = /^\[(\d+):(\d+)(?:\.(\d+))?\]\s*(.*)$/;
  for (const line of lines) {
    const m = line.match(regex);
    if (m) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const centi = m[3] ? parseInt(m[3].padEnd(2, "0").slice(0, 2), 10) : 0;
      const time = min * 60 + sec + centi / 100;
      const text = m[4]?.trim() ?? "";
      result.push({ time, text });
    }
  }
  const sorted = result.sort((a, b) => a.time - b.time);
  for (let i = 0; i < sorted.length; i++) {
    sorted[i].endTime = i < sorted.length - 1 ? sorted[i + 1].time : sorted[i].time + 5;
  }
  return sorted;
}

function KaraokeLineProgress({ line, progress }: { line: LrcLine; progress: number }) {
  const duration = (line.endTime ?? line.time + 3) - line.time;
  const elapsed = progress - line.time;
  const pct = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 1;
  return (
    <span className="relative inline-block">
      <span className="text-white/30">{line.text}</span>
      <span
        className="absolute inset-0 overflow-hidden text-white font-bold"
        style={{ width: `${pct * 100}%` }}
      >
        {line.text}
      </span>
    </span>
  );
}

export function LyricsPanel() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const progress = usePlayerStore((s) => s.progress);
  const { seekTo } = useAudio();
  const isOpen = usePlayerStore((s) => s.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const activeLineRef = useRef<HTMLButtonElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const isProgrammaticScrollRef = useRef(false);
  const scrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLyricsScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    setAutoScrollEnabled(false);
    if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
    scrollResumeTimerRef.current = setTimeout(() => {
      setAutoScrollEnabled(true);
      scrollResumeTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && activeSong) setAutoScrollEnabled(true);
  }, [activeSong?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeSong) {
      setLyrics(null);
      setSyncedLyrics(null);
      return;
    }

    const artistName = activeSong.artist?.name;
    if (!artistName) return;

    setLoading(true);
    setLyrics(null);
    setSyncedLyrics(null);

    let url = `/api/lyrics?artist=${encodeURIComponent(artistName)}&title=${encodeURIComponent(activeSong.title)}`;
    if (activeSong.duration) url += `&duration=${Math.round(activeSong.duration)}`;
    if (activeSong.album?.title) url += `&album=${encodeURIComponent(activeSong.album.title)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setLyrics(data.lyrics ?? null);
        setSyncedLyrics(data.syncedLyrics ?? null);
      })
      .catch(() => setLyrics(null))
      .finally(() => setLoading(false));
  }, [isOpen, activeSong?.id]);

  const lrcLines = useMemo(() => syncedLyrics ? parseLrc(syncedLyrics) : null, [syncedLyrics]);
  const currentLineIndex =
    lrcLines && activeSong
      ? (() => {
          let idx = -1;
          for (let i = 0; i < lrcLines.length; i++) {
            if (lrcLines[i].time <= progress) idx = i;
            else break;
          }
          return idx;
        })()
      : -1;

  const hasSyncedLyrics = !!lrcLines && lrcLines.length > 0;
  const coverUrl = proxiedImageUrl(activeSong?.coverImage, activeSong?.audioUrl);

  useEffect(() => {
    if (!autoScrollEnabled || !activeLineRef.current || !lrcLines) return;
    isProgrammaticScrollRef.current = true;
    activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 150);
    return () => clearTimeout(t);
  }, [currentLineIndex, lrcLines, autoScrollEnabled]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              key="lyrics-backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[84] bg-black/55 lg:hidden"
              onClick={() => setLyricsOpen(false)}
            />
          )}
          <motion.div
            key="lyrics-panel"
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn(
              "fixed flex flex-col shadow-2xl",
              karaokeMode
                ? "inset-0 z-[var(--z-overlay)] bg-black/95 backdrop-blur-2xl"
                : "premium-now-playing-shell z-[var(--z-sheet)]",
              !karaokeMode && isMobile
                ? "inset-x-0 bottom-[var(--main-content-bottom-padding)] max-h-[min(72vh,560px)] w-full rounded-t-2xl border border-b-0 border-white/10"
                : !karaokeMode && "top-[var(--navbar-height)] bottom-[var(--player-height)] right-0 w-[380px] border-l border-white/[0.06]",
            )}
            style={karaokeMode && coverUrl ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.92)), url(${coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : undefined}
          >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <StevenSheetHeader
              icon={Mic2}
              sectionIndex="( 02 )"
              label={karaokeMode ? t("karaokeMode") : t("lyricsNav")}
              onClose={() => setLyricsOpen(false)}
            >
              {hasSyncedLyrics && (
                <button
                  onClick={() => setKaraokeMode(!karaokeMode)}
                  className={cn(
                    "rounded-full p-1.5 transition-colors hover:bg-white/[0.06]",
                    karaokeMode ? "text-white" : "text-white/40 hover:text-white",
                  )}
                  title={t("karaokeMode")}
                >
                  {karaokeMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
            </StevenSheetHeader>

            <div
              ref={lyricsScrollRef}
              onScroll={handleLyricsScroll}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
            >
              {!activeSong ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted">{t("noSongSelected")}</p>
                </div>
              ) : loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted" />
                </div>
              ) : lyrics ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <h3 className="mb-4 text-lg font-bold text-white">{activeSong.title}</h3>
                  <p className="mb-6 text-sm text-muted">{activeSong.artist?.name}</p>
                  {lrcLines ? (
                    lrcLines.map((line, i) => {
                      const isActive = i === currentLineIndex;
                      const isPast = i < currentLineIndex;
                      const isNear = Math.abs(i - currentLineIndex) <= 2;
                      return (
                        <button
                          key={`${line.time}-${i}`}
                          ref={isActive ? activeLineRef : undefined}
                          type="button"
                          onClick={() => seekTo(line.time)}
                          className={cn(
                            "w-full text-left transition-all duration-300",
                            karaokeMode ? "text-xl leading-[2.5] py-1" : "text-[15px] leading-8",
                            !line.text && "h-4 cursor-default",
                            line.text && "cursor-pointer",
                            line.text && isActive && !karaokeMode && "text-white text-base font-semibold",
                            line.text && isActive && karaokeMode && "text-2xl font-bold scale-105 origin-left",
                            line.text && !isActive && isPast && "text-white/30",
                            line.text && !isActive && !isPast && (isNear ? "text-white/50" : "text-white/25"),
                          )}
                          style={
                            isActive && !karaokeMode
                              ? { textShadow: "0 0 16px rgba(255,255,255,0.9), 0 0 32px rgba(255,255,255,0.5)" }
                              : undefined
                          }
                        >
                          {isActive && karaokeMode && line.text ? (
                            <KaraokeLineProgress line={line} progress={progress} />
                          ) : (
                            line.text
                          )}
                        </button>
                      );
                    })
                  ) : (
                    lyrics.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={`text-[15px] leading-8 transition-colors ${
                          line.trim() ? "text-white/80 hover:text-white" : "h-4"
                        }`}
                      >
                        {line}
                      </p>
                    ))
                  )}
                </motion.div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Mic2 className="h-10 w-10 text-muted/30" />
                  <p className="text-sm text-muted">{t("lyricsNotFound")}</p>
                  <p className="text-xs text-muted/50">
                    {t("lyricsNotAvailableFor").replace("{title}", activeSong.title || "")}
                  </p>
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
