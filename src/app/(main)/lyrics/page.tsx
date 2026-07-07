"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useAudio } from "@/components/providers/AudioProvider";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { StevenAutocompletePanel } from "@/components/ui/StevenAutocompletePanel";
import { Mic2, Search, Loader2, Music2 } from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

function parseLrc(syncedLyrics: string): { time: number; text: string }[] {
  const lines = syncedLyrics.split("\n");
  const result: { time: number; text: string }[] = [];
  const regex = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
  for (const line of lines) {
    const first = line.match(regex)?.[0];
    if (!first) continue;
    const m = first.match(/\[(\d+):(\d+)(?:\.(\d+))?\]/);
    if (m) {
      const time =
        parseInt(m[1], 10) * 60 +
        parseInt(m[2], 10) +
        (m[3] ? parseInt(m[3].padEnd(2, "0").slice(0, 2), 10) / 100 : 0);
      const text = line.replace(/\[[\d:.]+\]/g, "").trim();
      result.push({ time, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export default function LyricsPage() {
  const { t } = useTranslation();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const progress = usePlayerStore((s) => s.progress);
  const { seekTo } = useAudio();
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [syncedLyrics, setSyncedLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement>(null);
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
  const [searchArtist, setSearchArtist] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchedSong, setSearchedSong] = useState<{ artist: string; title: string } | null>(null);
  const [artistSuggestions, setArtistSuggestions] = useState<string[]>([]);
  const [songSuggestions, setSongSuggestions] = useState<{ artist: string; title: string }[]>([]);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const artistInputRef = useRef<HTMLDivElement>(null);
  const songInputRef = useRef<HTMLDivElement>(null);

  const debouncedArtist = useDebounce(searchArtist, 350);
  const debouncedTitle = useDebounce(searchTitle, 350);

  const fetchLyrics = async (
    artist: string,
    title: string,
    duration?: number,
    album?: string,
    isManualSearch = false
  ) => {
    if (!artist.trim() || !title.trim()) return;
    setLoading(true);
    setLyrics(null);
    setSyncedLyrics(null);
    try {
      let url = `/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
      if (duration && duration > 0) url += `&duration=${Math.round(duration)}`;
      if (album) url += `&album=${encodeURIComponent(album)}`;
      const res = await fetch(url);
      const data = await res.json();
      setLyrics(data.lyrics ?? null);
      setSyncedLyrics(data.syncedLyrics ?? null);
      if (isManualSearch) setSearchedSong({ artist, title });
    } catch {
      setLyrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAutoScrollEnabled(true);
  }, [activeSong?.id]);

  useEffect(() => {
    if (!activeSong?.artist?.name) return;
    setSearchedSong(null);
    fetchLyrics(
      activeSong.artist.name,
      activeSong.title,
      activeSong.duration,
      activeSong.album?.title,
      false
    );
  }, [activeSong?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLyrics(searchArtist.trim(), searchTitle.trim(), undefined, undefined, true);
  };

  useEffect(() => {
    if (debouncedArtist.trim().length < 2) {
      setArtistSuggestions([]);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(debouncedArtist.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        const artists = (data.artists ?? []).map((a: { name: string }) => a.name);
        const fromSongs = [...new Set((data.songs ?? []).map((s: { artist?: { name: string } }) => s.artist?.name).filter(Boolean))];
        const merged = [...new Set([...artists, ...fromSongs])].slice(0, 8);
        setArtistSuggestions(merged);
      })
      .catch(() => setArtistSuggestions([]));
  }, [debouncedArtist]);

  useEffect(() => {
    const q = [searchArtist.trim(), searchTitle.trim()].filter(Boolean).join(" ").trim();
    if (q.length < 2) {
      setSongSuggestions([]);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        const songs = (data.songs ?? []).map((s: { title: string; artist?: { name: string } }) => ({
          artist: s.artist?.name ?? "",
          title: s.title,
        }));
        const seen = new Set<string>();
        const unique = songs.filter((s: { artist: string; title: string }) => {
          const k = `${s.artist}|${s.title}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).slice(0, 8);
        setSongSuggestions(unique);
      })
      .catch(() => setSongSuggestions([]));
  }, [debouncedTitle, debouncedArtist]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (artistInputRef.current && !artistInputRef.current.contains(e.target as Node)) {
        setShowArtistDropdown(false);
      }
      if (songInputRef.current && !songInputRef.current.contains(e.target as Node)) {
        setShowSongDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayArtist = searchedSong?.artist ?? activeSong?.artist?.name ?? "";
  const displayTitle = searchedSong?.title ?? activeSong?.title ?? "";

  const lrcLines = syncedLyrics ? parseLrc(syncedLyrics) : null;
  const canSync = lrcLines && activeSong && !searchedSong;
  const currentLineIndex =
    canSync
      ? (() => {
          let idx = -1;
          for (let i = 0; i < lrcLines.length; i++) {
            if (lrcLines[i].time <= progress) idx = i;
            else break;
          }
          return idx;
        })()
      : -1;

  useEffect(() => {
    if (!autoScrollEnabled || !canSync || !activeLineRef.current) return;
    isProgrammaticScrollRef.current = true;
    activeLineRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const t = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 150);
    return () => clearTimeout(t);
  }, [currentLineIndex, autoScrollEnabled, canSync]);

  return (
    <div className="flex flex-col gap-8">
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
          <Mic2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("lyricsNav")}</h1>
          <p className="text-sm text-white/50">
            {t("lyricsSubtitle")}
          </p>
        </div>
      </motion.div>

      
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="relative flex-1" ref={artistInputRef}>
          <label className="mb-1.5 block text-xs font-medium text-white/60">
            {t("artist")}
          </label>
          <input
            type="text"
            value={searchArtist}
            onChange={(e) => {
              setSearchArtist(e.target.value);
              setShowArtistDropdown(true);
            }}
            onFocus={() => setShowArtistDropdown(true)}
            placeholder={t("exampleArtist")}
            className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/16 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
          <StevenAutocompletePanel open={showArtistDropdown && artistSuggestions.length > 0}>
                {artistSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setSearchArtist(name);
                      setShowArtistDropdown(false);
                    }}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
                  >
                    {name}
                  </button>
                ))}
          </StevenAutocompletePanel>
        </div>
        <div className="relative flex-1" ref={songInputRef}>
          <label className="mb-1.5 block text-xs font-medium text-white/60">
            {t("songLabel")}
          </label>
          <input
            type="text"
            value={searchTitle}
            onChange={(e) => {
              setSearchTitle(e.target.value);
              setShowSongDropdown(true);
            }}
            onFocus={() => setShowSongDropdown(true)}
            placeholder={t("exampleSong")}
            className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/16 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
          <StevenAutocompletePanel open={showSongDropdown && songSuggestions.length > 0}>
                {songSuggestions.map((s, i) => (
                  <button
                    key={`${s.artist}-${s.title}-${i}`}
                    type="button"
                    onClick={() => {
                      setSearchArtist(s.artist);
                      setSearchTitle(s.title);
                      setShowSongDropdown(false);
                    }}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="font-medium">{s.title}</span>
                    <span className="text-white/45"> — {s.artist}</span>
                  </button>
                ))}
          </StevenAutocompletePanel>
        </div>
        <button
          type="submit"
          disabled={loading || !searchArtist.trim() || !searchTitle.trim()}
          className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#09090b] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {t("search")}
        </button>
      </motion.form>

      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-6 lg:flex-row lg:gap-8"
      >
        
        {(activeSong || searchedSong) && (
          <div className="flex-shrink-0">
            <div className="sticky top-4 flex flex-col items-center gap-4 rounded-2xl bg-white/5 p-6 lg:w-[280px]">
              {proxiedImageUrl(activeSong?.coverImage) && !searchedSong ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  <Image
                    src={proxiedImageUrl(activeSong!.coverImage)!}
                    alt={activeSong!.title}
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                  <Music2 className="h-16 w-16 text-white/30" />
                </div>
              )}
              <div className="w-full text-center">
                <h2 className="truncate text-lg font-bold text-white">
                  {displayTitle || "—"}
                </h2>
                <p className="mt-1 truncate text-sm text-white/50">
                  {displayArtist || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white/5 p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {!activeSong && !searchedSong ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                    <Mic2 className="h-10 w-10 text-white/40" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    {t("lyricsSearchHint")}
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    {t("lyricsEmptyHint")}
                  </p>
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                  <p className="mt-4 text-sm text-white/50">
                    {t("lyricsSearching")}
                  </p>
                </motion.div>
              ) : lyrics ? (
                <motion.div
                  key="lyrics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  ref={lyricsContainerRef}
                  onScroll={handleLyricsScroll}
                  className="space-y-1 overflow-y-auto"
                >
                  {canSync ? (
                    lrcLines.map(({ time, text }, i) => {
                      const isActive = i === currentLineIndex;
                      return (
                        <button
                          key={`${time}-${i}`}
                          ref={isActive ? activeLineRef : undefined}
                          type="button"
                          onClick={() => seekTo(time)}
                          className={`w-full text-left text-[15px] leading-8 transition-all duration-300 ${
                            text
                              ? isActive
                                ? "text-white text-lg font-semibold drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] cursor-pointer"
                                : "text-white/50 hover:text-white/70 cursor-pointer"
                              : "h-4 cursor-default"
                          }`}
                          style={
                            isActive
                              ? {
                                  textShadow:
                                    "0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)",
                                }
                              : undefined
                          }
                        >
                          {text}
                        </button>
                      );
                    })
                  ) : (
                    lyrics.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={`text-[15px] leading-8 transition-colors ${
                          line.trim()
                            ? "text-white/85 hover:text-white"
                            : "h-4"
                        }`}
                      >
                        {line}
                      </p>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="notfound"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Mic2 className="mb-4 h-12 w-12 text-white/30" />
                  <p className="text-sm font-medium text-white">
                    {t("lyricsNotFound")}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {t("lyricsNotAvailableFor").replace("{title}", displayTitle || "")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
