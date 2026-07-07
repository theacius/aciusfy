import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Howl, Howler } from "howler";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useSleepTimerStore } from "@/store/sleepTimerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useOfflineStore } from "@/store/offlineStore";
import { showErrorToast, showBadgeToast } from "@/store/toastStore";
import { getOfflineAudio } from "@/lib/offline-storage";
import { createEQChain, createEQChainFromGains, createEQChainWithFilters, createMonoChain, getEffectiveEQGains } from "@/lib/webaudio-eq";
import { prefersMobileHtml5Playback } from "@/lib/mobile-audio";
import { isCatalogOnlyModeClient } from "@/lib/catalog-mode-client";
import {
  getPlayableAudioUrl,
  getHowlerFormatsForPlayableRequest,
  getHowlerFormatsFromOriginalUrl,
} from "@/lib/media-proxy-url";
import { isAciusfyNativeShell, postNativePlaybackMessage } from "@/lib/native-shell-bridge";
import { resolveNativePlaybackPayload } from "@/lib/native-shell-track";
import { triggerR2BackgroundCache } from "@/lib/r2-background-cache";
import { getTranslation } from "@/lib/i18n";
import type { SongType } from "@/types";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
    _ytApiReady: boolean;
  }
}

let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window._ytApiReady) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      window._ytApiReady = true;
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      window._ytApiReady = true;
      resolve();
    };
    if (!ytApiLoaded) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      ytApiLoaded = true;
    }
  });
  return ytApiPromise;
}

type PlayerMode = "youtube" | "howler" | "webaudio" | "native" | "none";

function isPreviewUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.includes("dzcdn") || h.includes("deezer") || h.includes("scdn.co") || h.includes("spotify");
  } catch {
    return false;
  }
}

function isFullLengthUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h.includes("youtube") || h.includes("youtu.be")) return true;
    if (u.protocol === "http:" || u.protocol === "https:") {
      if (isPreviewUrl(url)) return false;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function extractYtId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const id = m ? m[1] : null;
  return id && id !== "undefined" ? id : null;
}

function hasDirectPlayableAudioUrl(url: string | null | undefined): boolean {
  if (!url || !isFullLengthUrl(url) || isPreviewUrl(url)) return false;
  return extractYtId(url) === null;
}

function configureHowlerForMobileBackground() {
  if (typeof window === "undefined") return;
  try {
    if (prefersMobileHtml5Playback()) {
      Howler.autoSuspend = false;
      if (Howler.html5PoolSize < 16) Howler.html5PoolSize = 16;
      (Howler as unknown as { _canPlayEvent: string })._canPlayEvent = "canplay";
    }
  } catch {}
}

configureHowlerForMobileBackground();

function isPageHidden(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "hidden" || document.hidden === true;
}

function clipSongDurationFromMeta(song: SongType | null | undefined): number {
  const d = song?.duration;
  if (typeof d !== "number" || !Number.isFinite(d) || d <= 0 || d >= 86400) return 0;
  return d;
}

function resolvePlaybackDurationSeconds(raw: number, song: SongType | null | undefined): number {
  if (Number.isFinite(raw) && raw > 0 && raw < 86400 && raw !== Infinity) {
    return raw;
  }
  return clipSongDurationFromMeta(song);
}

function getHowlerHtml5Media(howl: Howl): HTMLMediaElement | null {
  try {
    const sounds = (howl as unknown as { _sounds?: Array<{ _node?: HTMLMediaElement }> })._sounds;
    const n = sounds?.[0]?._node;
    return n && typeof n.currentTime === "number" ? n : null;
  } catch {
    return null;
  }
}

export function useAudioPlayer() {
  const howlRef = useRef<Howl | null>(null);
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historySyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
  const lastProgressRef = useRef<number>(0);
  const modeRef = useRef<PlayerMode>("none");
  const ytReadyRef = useRef(false);
  const ytIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAudioGainRef = useRef<GainNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const lastOfflineUrlRef = useRef<string | null>(null);
  const lastSearchVideoIdRef = useRef<{ songId: string; videoId: string } | null>(null);
  const tryPlayInProgressRef = useRef(false);
  const lastPlayAttemptRef = useRef<{ songId: string; time: number } | null>(null);
  const sameTrackReplayRequestedRef = useRef(false);
  const backgroundPauseRetryCountRef = useRef(0);
  const nativeProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeWallClockStartMsRef = useRef<number | null>(null);
  const playRefs = useRef<{
    playWithYouTube: (videoId: string) => Promise<boolean>;
    playWithHowler: (url: string, id: string, onErr?: () => void) => void;
    playWithWebAudio: (url: string, id: string, onErr?: () => void) => void;
    cleanupHowl: () => void;
    cleanupWebAudio: () => void;
  }>({
    playWithYouTube: async () => false,
    playWithHowler: () => {},
    playWithWebAudio: () => {},
    cleanupHowl: () => {},
    cleanupWebAudio: () => {},
  });

  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setIsDownloading = usePlayerStore((s) => s.setIsDownloading);

  const nextSong = useQueueStore((s) => s.nextSong);
  const peekNextSong = useQueueStore((s) => s.peekNextSong);
  const crossfade = useSettingsStore((s) => s.crossfade);
  const crossfadeSeconds = useSettingsStore((s) => s.crossfadeSeconds);
  const gaplessPlayback = useSettingsStore((s) => s.gaplessPlayback);
  const listeningQuality = useSettingsStore((s) => s.listeningQuality);

  const crossfadeStartedRef = useRef(false);
  const nextHowlRef = useRef<Howl | null>(null);

  const cleanupHowl = useCallback(() => {
    crossfadeStartedRef.current = false;
    if (nextHowlRef.current) {
      const n = nextHowlRef.current;
      nextHowlRef.current = null;
      try {
        n.unload();
      } catch {}
    }
    if (howlRef.current) {
      const h = howlRef.current;
      howlRef.current = null;
      try {
        h.unload();
      } catch {}
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const cleanupWebAudio = useCallback(() => {
    if (webAudioRef.current) {
      const a = webAudioRef.current;
      webAudioRef.current = null;
      try {
        a.pause();
        a.removeAttribute("src");
        a.load();
      } catch {}
    }
    if (webAudioCtxRef.current) {
      try { webAudioCtxRef.current.close(); } catch {}
      webAudioCtxRef.current = null;
    }
    webAudioGainRef.current = null;
    eqFiltersRef.current = [];
  }, []);

  const cleanupYT = useCallback(() => {
    if (ytIntervalRef.current) {
      clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = null;
    }
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch {}
      ytPlayerRef.current = null;
    }
    ytReadyRef.current = false;
  }, []);

  const cleanupAll = useCallback(() => {
    if (nativeProgressIntervalRef.current) {
      clearInterval(nativeProgressIntervalRef.current);
      nativeProgressIntervalRef.current = null;
    }
    nativeWallClockStartMsRef.current = null;
    if (modeRef.current === "native") {
      postNativePlaybackMessage({ type: "STOP" });
    }
    if (lastOfflineUrlRef.current) {
      try {
        URL.revokeObjectURL(lastOfflineUrlRef.current);
      } catch {}
      lastOfflineUrlRef.current = null;
    }
    cleanupHowl();
    cleanupWebAudio();
    cleanupYT();
    modeRef.current = "none";
  }, [cleanupHowl, cleanupWebAudio, cleanupYT]);

  const tickNativeProgressFromWallClock = useCallback(() => {
    if (modeRef.current !== "native" || !usePlayerStore.getState().isPlaying) return;
    const start = nativeWallClockStartMsRef.current;
    if (start == null) return;
    const elapsed = (Date.now() - start) / 1000;
    const song = usePlayerStore.getState().activeSong;
    const meta = clipSongDurationFromMeta(song);
    const pos = meta > 0 ? Math.min(elapsed, meta) : elapsed;
    lastProgressRef.current = pos;
    setProgress(Math.round(pos * 10) / 10);
    if (meta > 0) {
      const curD = usePlayerStore.getState().duration;
      if (curD <= 0 || !Number.isFinite(curD)) setDuration(meta);
    }
  }, [setProgress, setDuration]);

  const PROGRESS_INTERVAL_MS = 250;

  const updateHowlProgress = useCallback(() => {
    if (!howlRef.current) return;
    const h = howlRef.current;
    if (h.state() === "unloaded") return;

    const node = getHowlerHtml5Media(h);
    const audioAdvancing = node ? !node.paused && !node.ended : false;
    if (!h.playing() && !audioAdvancing) return;

    const seekRaw =
      node && Number.isFinite(node.currentTime) ? node.currentTime : (h.seek() as number);
    if (!Number.isFinite(seekRaw)) return;

    if (Math.abs(seekRaw - lastProgressRef.current) >= 0.02) {
      lastProgressRef.current = seekRaw;
      setProgress(Math.round(seekRaw * 10) / 10);
    }

    const song = usePlayerStore.getState().activeSong;
    const rawHd = node && Number.isFinite(node.duration) ? node.duration : h.duration();
    const uiDur = resolvePlaybackDurationSeconds(typeof rawHd === "number" ? rawHd : NaN, song);
    if (uiDur > 0) {
      const curD = usePlayerStore.getState().duration;
      if (curD <= 0 || Math.abs(curD - uiDur) > 2) {
        setDuration(uiDur);
      }
    }

    const durForCrossfade =
      uiDur > 0
        ? uiDur
        : Number.isFinite(h.duration()) && h.duration() > 0 && h.duration() !== Infinity
          ? h.duration()
          : 0;
    const seek = seekRaw;
    const secs = crossfadeSeconds || 0;
    const nearEnd =
      durForCrossfade > 0 &&
      durForCrossfade - seek <= (crossfade && secs > 0 ? secs : gaplessPlayback ? 8 : 999);
    if (
      nearEnd &&
      !crossfadeStartedRef.current &&
      (crossfade ? secs > 0 && durForCrossfade > secs : gaplessPlayback)
    ) {
      const next = peekNextSong();
      const audioUrl = next?.audioUrl;
      if (
        next &&
        audioUrl &&
        (isFullLengthUrl(audioUrl) || isPreviewUrl(audioUrl)) &&
        usePlayerStore.getState().activeSong?.id === lastSongIdRef.current
      ) {
        crossfadeStartedRef.current = true;
        const state = usePlayerStore.getState();
        const volMult =
          useSettingsStore.getState().volumeLevel === "loud"
            ? 1.2
            : useSettingsStore.getState().volumeLevel === "quiet"
              ? 0.7
              : 1;
        const targetVol = Math.min(1, (state.isMuted ? 0 : state.volume) * volMult);
        const playableUrl = getPlayableAudioUrl(audioUrl, listeningQuality, next?.id);
        const useFade = crossfade && secs > 0;
        const nextHowl = new Howl({
          src: [playableUrl],
          format: getHowlerFormatsForPlayableRequest(playableUrl, audioUrl),
          html5: true,
          preload: true,
          volume: useFade ? 0 : targetVol,
          onload: () => {
            if (!nextHowlRef.current || !howlRef.current) return;
            const next = peekNextSong();
            if (!next) return;
            nextHowl.play();
            if (useFade) {
              const ms = secs * 1000;
              howlRef.current.fade(targetVol, 0, ms);
              nextHowl.fade(0, targetVol, ms);
            } else {
              const oldHowl = howlRef.current;
              howlRef.current = nextHowlRef.current;
              nextHowlRef.current = null;
              if (oldHowl) {
                try { oldHowl.unload(); } catch {}
              }
              lastSongIdRef.current = next.id;
              lastProgressRef.current = nextHowl.seek() as number;
              setProgress(lastProgressRef.current);
              setDuration(resolvePlaybackDurationSeconds(nextHowl.duration(), next));
              usePlayerStore.getState().setActiveSong(next);
              const { queue, currentIndex } = useQueueStore.getState();
              if (currentIndex < queue.length - 1) {
                useQueueStore.setState({ currentIndex: currentIndex + 1 });
              }
              crossfadeStartedRef.current = false;
            }
          },
        });
        nextHowlRef.current = nextHowl;
      }
    }
  }, [
    setProgress,
    setDuration,
    crossfade,
    crossfadeSeconds,
    gaplessPlayback,
    peekNextSong,
    listeningQuality,
  ]);

  const updateWebAudioProgress = useCallback(() => {
    const audio = webAudioRef.current;
    if (audio && !audio.paused && !audio.ended) {
      const song = usePlayerStore.getState().activeSong;
      const d = resolvePlaybackDurationSeconds(audio.duration, song);
      if (d > 0 && usePlayerStore.getState().duration <= 0) {
        setDuration(d);
      }
      const seek = audio.currentTime;
      if (Math.abs(seek - lastProgressRef.current) >= 0.02) {
        lastProgressRef.current = seek;
        setProgress(Math.round(seek * 10) / 10);
      }
    }
  }, [setProgress, setDuration]);

  const startHowlProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(updateHowlProgress, PROGRESS_INTERVAL_MS);
  }, [updateHowlProgress]);

  const startWebAudioProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(updateWebAudioProgress, PROGRESS_INTERVAL_MS);
  }, [updateWebAudioProgress]);

  const startYTProgressTracking = useCallback(() => {
    if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    ytIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          const current = ytPlayerRef.current.getCurrentTime();
          const rounded = Math.floor(current * 4) / 4;
          if (Math.abs(rounded - lastProgressRef.current) >= 0.25) {
            lastProgressRef.current = rounded;
            setProgress(rounded);
          }
        } catch {}
      }
    }, 250);
  }, [setProgress]);

  const handleSongEnd = useCallback(() => {
    const repeatMode = usePlayerStore.getState().repeatMode;

    const replaySameTrackViaSeek = (): boolean => {
      if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.playVideo();
          usePlayerStore.getState().setIsPlaying(true);
          startYTProgressTracking();
          return true;
        } catch {}
      }
      if (modeRef.current === "howler" && howlRef.current) {
        try {
          howlRef.current.seek(0);
          howlRef.current.play();
          usePlayerStore.getState().setIsPlaying(true);
          startHowlProgressTracking();
          return true;
        } catch {}
      }
      if (modeRef.current === "webaudio" && webAudioRef.current) {
        try {
          webAudioRef.current.currentTime = 0;
          void webAudioRef.current.play();
          usePlayerStore.getState().setIsPlaying(true);
          startWebAudioProgressTracking();
          return true;
        } catch {}
      }
      if (modeRef.current === "native") {
        nativeWallClockStartMsRef.current = Date.now();
        postNativePlaybackMessage({ type: "SEEK", position: 0 });
        postNativePlaybackMessage({ type: "RESUME" });
        usePlayerStore.getState().setIsPlaying(true);
        return true;
      }
      return false;
    };

    if (repeatMode === "one") {
      if (!replaySameTrackViaSeek()) {
        const cur = usePlayerStore.getState().activeSong;
        if (cur) {
          sameTrackReplayRequestedRef.current = true;
          usePlayerStore.getState().setActiveSong(cur);
        }
      }
      return;
    }

    const sleepTimer = useSleepTimerStore.getState();
    if (sleepTimer.isActive && sleepTimer.mode === "endOfTrack") {
      useSleepTimerStore.getState().clearSleepTimer();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    const next = nextSong();
    if (next) {
      usePlayerStore.getState().setActiveSong(next);
      return;
    }
    if (repeatMode === "all") {
      const { playlistPlayback, queue, queueSource, autoplayList } = useQueueStore.getState();
      const current = usePlayerStore.getState().activeSong;
      if (playlistPlayback && playlistPlayback.songs.length > 0) {
        useQueueStore.setState({
          playlistPlayback: { ...playlistPlayback, currentIndex: 0 },
        });
        const t = playlistPlayback.songs[0];
        if (current && t.id === current.id) sameTrackReplayRequestedRef.current = true;
        usePlayerStore.getState().setActiveSong(t);
        return;
      }
      if (queueSource === "queue" && queue.length > 0) {
        useQueueStore.setState({ currentIndex: 0 });
        const t = queue[0];
        if (current && t.id === current.id) sameTrackReplayRequestedRef.current = true;
        usePlayerStore.getState().setActiveSong(t);
        return;
      }
      if (autoplayList.length > 0) {
        useQueueStore.setState({ autoplayIndex: 0 });
        const t = autoplayList[0];
        if (current && t.id === current.id) sameTrackReplayRequestedRef.current = true;
        usePlayerStore.getState().setActiveSong(t);
        return;
      }
      if (current) {
        if (!replaySameTrackViaSeek()) {
          sameTrackReplayRequestedRef.current = true;
          usePlayerStore.getState().setActiveSong(current);
        }
        return;
      }
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    const st = usePlayerStore.getState();
    const currentId = st.activeSong?.id;
    const currentSong = st.activeSong;
    const durResolved = resolvePlaybackDurationSeconds(st.duration, currentSong);
    const playReport =
      durResolved > 0 ? Math.max(Math.floor(st.progress), Math.floor(durResolved)) : Math.floor(st.progress);
    const shareListening = useSettingsStore.getState().shareListeningActivity ?? true;
    if (shareListening && currentId && playReport > 0) {
      fetch("/api/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: currentId, playDuration: playReport, completed: true }),
      })
        .then((r) => r.json())
        .then((d: { newBadges?: { name: string }[] }) => {
          d?.newBadges?.forEach((b) => showBadgeToast(b.name));
        })
        .catch(() => {});
    }
    const autoplay = useSettingsStore.getState().autoplay;
    const allowExplicit = useSettingsStore.getState().allowExplicit;
    const autoplayListForSimilar = useQueueStore.getState().autoplayList;
    if (autoplay && currentId && currentSong) {
      const playedArtistIds = autoplayListForSimilar.length > 0
        ? [...new Set(autoplayListForSimilar.map((s) => s.artistId).filter(Boolean))]
        : [];
      const excludeParam = playedArtistIds.length > 0 ? `&excludeArtistIds=${playedArtistIds.join(",")}` : "";
      fetch(`/api/songs/similar?songId=${encodeURIComponent(currentId)}&limit=15${excludeParam}`)
        .then((r) => r.json())
        .then((similar: { id: string; title: string; isExplicit?: boolean; artist?: { name: string }; coverImage?: string | null; audioUrl?: string; previewVideoUrl?: string | null }[]) => {
          const filtered = allowExplicit ? similar : (similar ?? []).filter((s) => !s.isExplicit);
          if (filtered.length > 0 && usePlayerStore.getState().activeSong?.id === currentId) {
            const songs = filtered as import("@/types").SongType[];
            useQueueStore.getState().setAutoplayList(songs, 0);
            usePlayerStore.getState().setActiveSong(songs[0]);
          } else {
            setIsPlaying(false);
            setProgress(0);
          }
        })
        .catch(() => {
          setIsPlaying(false);
          setProgress(0);
        });
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [
    nextSong,
    setIsPlaying,
    setProgress,
    startYTProgressTracking,
    startHowlProgressTracking,
    startWebAudioProgressTracking,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      __ACIUSFY_PLAYER_PROGRESS__?: (p: number, d: number) => void;
      __ACIUSFY_PLAYER_END__?: () => void;
      __ACIUSFY_NATIVE_PLAYBACK_ERROR__?: (detail: string) => void;
    };
    w.__ACIUSFY_PLAYER_PROGRESS__ = (p, d) => {
      if (typeof p === "number" && Number.isFinite(p) && p >= 0) {
        nativeWallClockStartMsRef.current = Date.now() - p * 1000;
      }
      lastProgressRef.current = p;
      setProgress(p);
      let durIn = d;
      if (!(durIn > 0)) {
        const meta = clipSongDurationFromMeta(usePlayerStore.getState().activeSong);
        if (meta > 0) durIn = meta;
      }
      if (durIn > 0) setDuration(durIn);
    };
    w.__ACIUSFY_PLAYER_END__ = () => {
      handleSongEnd();
    };
    w.__ACIUSFY_NATIVE_PLAYBACK_ERROR__ = (detail: string) => {
      if (!isAciusfyNativeShell()) return;
      const lang = useSettingsStore.getState().language;
      const d = typeof detail === "string" ? detail.trim().slice(0, 280) : "";
      const suffix = d ? `: ${d}` : "";
      const msg = getTranslation("nativeShellPlaybackError", lang).replace("{{detail}}", suffix);
      showErrorToast(msg);
      setIsPlaying(false);
    };
    return () => {
      delete w.__ACIUSFY_PLAYER_PROGRESS__;
      delete w.__ACIUSFY_PLAYER_END__;
      delete w.__ACIUSFY_NATIVE_PLAYBACK_ERROR__;
    };
  }, [handleSongEnd, setProgress, setDuration, setIsPlaying]);

  useEffect(() => {
    if (!activeSong) return;
    const meta = clipSongDurationFromMeta(activeSong);
    if (meta <= 0) return;
    const cur = usePlayerStore.getState().duration;
    if (cur <= 0 || !Number.isFinite(cur)) {
      setDuration(meta);
    }
  }, [activeSong?.id, activeSong?.duration, setDuration]);

  const playWithYouTube = useCallback(async (videoId: string) => {
    await loadYTApi();
    cleanupYT();

    if (!ytContainerRef.current) {
      const container = document.createElement("div");
      container.id = "yt-player-container";
      container.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;top:-9999px;left:-9999px;";
      document.body.appendChild(container);
      const inner = document.createElement("div");
      inner.id = "yt-player-target";
      container.appendChild(inner);
      ytContainerRef.current = container;
    } else {
      const existing = document.getElementById("yt-player-target");
      if (existing) existing.remove();
      const inner = document.createElement("div");
      inner.id = "yt-player-target";
      ytContainerRef.current.appendChild(inner);
    }

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 12000);

      ytPlayerRef.current = new window.YT.Player("yt-player-target", {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: YT.PlayerEvent) => {
            clearTimeout(timeout);
            ytReadyRef.current = true;
            const dur = event.target.getDuration();
            if (dur > 0) setDuration(dur);
            const st = usePlayerStore.getState();
            event.target.setVolume(st.isMuted ? 0 : Math.round(st.volume * 100));
            event.target.playVideo();
            startYTProgressTracking();
            resolve(true);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleSongEnd();
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              usePlayerStore.getState().setIsPlaying(false);
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              usePlayerStore.getState().setIsPlaying(true);
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
            }
          },
          onError: () => {
            clearTimeout(timeout);
            resolve(false);
          },
        },
      });
    });
  }, [cleanupYT, setDuration, volume, isMuted, startYTProgressTracking, handleSongEnd]);

  const playWithHowler = useCallback((audioUrl: string, songId: string, onLoadError?: () => void) => {
    cleanupHowl();
    modeRef.current = "howler";

    const state = usePlayerStore.getState();
    const volMult = useSettingsStore.getState().volumeLevel === "loud" ? 1.2 : useSettingsStore.getState().volumeLevel === "quiet" ? 0.7 : 1;
    const effectiveVolume = Math.min(1, (state.isMuted ? 0 : state.volume) * volMult);

    const playableUrl = getPlayableAudioUrl(audioUrl, listeningQuality, songId);
    const songRow = usePlayerStore.getState().activeSong;
    const formatFallback =
      songRow?.id === songId && typeof songRow.audioUrl === "string" && songRow.audioUrl.length > 0
        ? songRow.audioUrl
        : audioUrl;
    devLog("[Aciusfy:Howler]", "play başlıyor", { url: playableUrl?.slice(0, 80) });
    let loadSoftRetries = 0;
    let playErrorRetries = 0;
    const howl = new Howl({
      src: [playableUrl],
      format: getHowlerFormatsForPlayableRequest(playableUrl, formatFallback),
      html5: true,
      preload: true,
      volume: effectiveVolume,
      onplayerror: (_soundId, err) => {
        if (howlRef.current !== howl) return;
        if (!prefersMobileHtml5Playback()) return;
        if (playErrorRetries >= 2) return;
        playErrorRetries++;
        devWarn("[Aciusfy:Howler] playerror, mobil tekrar", err);
        setTimeout(() => {
          if (howlRef.current !== howl) return;
          try {
            howl.play();
          } catch {}
        }, 280);
      },
      onload: () => {
        if (howlRef.current !== howl) return;
        devLog("[Aciusfy:Howler]", "load OK");
        const song = usePlayerStore.getState().activeSong;
        setDuration(resolvePlaybackDurationSeconds(howl.duration(), song));
      },
      onplay: () => {
        if (howlRef.current !== howl) return;
        devLog("[Aciusfy:Howler]", "play OK");
        usePlayerStore.getState().setIsPlaying(true);
        startHowlProgressTracking();
      },
      onpause: () => {
        if (howlRef.current !== howl) return;
        const store = usePlayerStore.getState();
        if (isPageHidden() && store.isPlaying && backgroundPauseRetryCountRef.current < 14) {
          backgroundPauseRetryCountRef.current += 1;
          queueMicrotask(() => {
            if (howlRef.current !== howl) return;
            if (!usePlayerStore.getState().isPlaying) return;
            try {
              if (!howl.playing()) howl.play();
            } catch {}
          });
          return;
        }
        backgroundPauseRetryCountRef.current = 0;
        usePlayerStore.getState().setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      },
      onend: () => {
        if (howlRef.current !== howl) return;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        const nextH = nextHowlRef.current;
        if (nextH) {
          const next = peekNextSong();
          if (next) {
            const oldHowl = howlRef.current;
            howlRef.current = nextH;
            nextHowlRef.current = null;
            if (oldHowl) {
              try {
                oldHowl.unload();
              } catch {}
            }
            lastSongIdRef.current = next.id;
            lastProgressRef.current = nextH.seek() as number;
            setProgress(lastProgressRef.current);
            setDuration(nextH.duration());
            usePlayerStore.getState().setActiveSong(next);
            const { queue, currentIndex } = useQueueStore.getState();
            if (currentIndex < queue.length - 1) {
              useQueueStore.setState({ currentIndex: currentIndex + 1 });
            }
            crossfadeStartedRef.current = false;
          } else {
            nextHowlRef.current = null;
            crossfadeStartedRef.current = false;
            handleSongEnd();
          }
        } else {
          handleSongEnd();
        }
      },
      onloaderror: (_id, err) => {
        if (howlRef.current !== howl) return;
        const code = typeof err === "number" ? err : 0;
        if (
          prefersMobileHtml5Playback() &&
          (code === 0 || code === 1) &&
          loadSoftRetries < 2
        ) {
          loadSoftRetries++;
          devWarn("[Aciusfy:Howler] loaderror yumuşak (0/1), tekrar play", code);
          setTimeout(() => {
            if (howlRef.current !== howl) return;
            try {
              howl.play();
            } catch {}
          }, 450);
          return;
        }
        devWarn("[Aciusfy:Howler]", "loaderror", err);
        if (onLoadError) onLoadError();
        else {
          usePlayerStore.getState().setIsPlaying(false);
          setTimeout(() => handleSongEnd(), 300);
        }
      },
    });

    howlRef.current = howl;
    howl.play();
  }, [cleanupHowl, volume, isMuted, setDuration, startHowlProgressTracking, handleSongEnd]);

  const playWithWebAudio = useCallback(
    (audioUrl: string, songId: string, onLoadError?: () => void) => {
      cleanupWebAudio();
      cleanupHowl();
      modeRef.current = "webaudio";

      const state = usePlayerStore.getState();
      const volMult =
        useSettingsStore.getState().volumeLevel === "loud"
          ? 1.2
          : useSettingsStore.getState().volumeLevel === "quiet"
            ? 0.7
            : 1;
      const effectiveVolume = Math.min(
        1,
        (state.isMuted ? 0 : state.volume) * volMult
      );

      let playableUrl = getPlayableAudioUrl(audioUrl, listeningQuality, songId);
      const videoId = extractYtId(audioUrl);
      if (videoId && typeof window !== "undefined") {
        playableUrl = `${window.location.origin}/api/youtube-audio-stream?videoId=${videoId}`;
      }
      const { equalizerEnabled, monoAudio, equalizerMode, equalizerPreset, equalizerManualGains, equalizerCustomGains } =
        useSettingsStore.getState();

      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = playableUrl;
      try {
        audio.setAttribute("playsinline", "");
        (audio as unknown as { playsInline?: boolean }).playsInline = true;
      } catch {}
      webAudioRef.current = audio;
      let loadErrorFired = false;
      const fireLoadError = () => {
        if (webAudioRef.current !== audio) return;
        if (loadErrorFired) return;
        loadErrorFired = true;
        if (onLoadError) onLoadError();
        else usePlayerStore.getState().setIsPlaying(false);
      };

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      webAudioCtxRef.current = ctx;
      ctx.resume().catch(() => {});
      try {
        ctx.addEventListener("statechange", () => {
          if (ctx.state !== "suspended") return;
          if (!usePlayerStore.getState().isPlaying) return;
          ctx.resume().catch(() => {});
        });
      } catch {}

      const source = ctx.createMediaElementSource(audio);
      let node: AudioNode = source;

      if (monoAudio) {
        node = createMonoChain(ctx, node);
      }
      if (equalizerEnabled) {
        const gains = getEffectiveEQGains(equalizerMode, equalizerPreset, equalizerManualGains, equalizerCustomGains);
        const { node: eqNode, filters } = createEQChainWithFilters(ctx, gains, node);
        node = eqNode;
        eqFiltersRef.current = filters;
      } else {
        eqFiltersRef.current = [];
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = effectiveVolume;
      webAudioGainRef.current = gainNode;
      node.connect(gainNode);
      gainNode.connect(ctx.destination);

      const syncWebAudioDuration = () => {
        if (webAudioRef.current !== audio) return;
        const song = usePlayerStore.getState().activeSong;
        const d = resolvePlaybackDurationSeconds(audio.duration, song);
        if (d > 0) setDuration(d);
      };
      audio.addEventListener("loadedmetadata", syncWebAudioDuration);
      audio.addEventListener("durationchange", syncWebAudioDuration);
      audio.addEventListener("canplay", () => {
        if (webAudioRef.current !== audio) return;
        if (!audio.paused) {
          usePlayerStore.getState().setIsPlaying(true);
          startWebAudioProgressTracking();
        }
      });
      audio.addEventListener("pause", () => {
        if (webAudioRef.current !== audio) return;
        const store = usePlayerStore.getState();
        if (isPageHidden() && store.isPlaying && backgroundPauseRetryCountRef.current < 14) {
          backgroundPauseRetryCountRef.current += 1;
          queueMicrotask(() => {
            if (webAudioRef.current !== audio) return;
            if (!usePlayerStore.getState().isPlaying) return;
            void audio.play().catch(() => {});
          });
          return;
        }
        backgroundPauseRetryCountRef.current = 0;
        usePlayerStore.getState().setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      });
      audio.addEventListener("ended", () => {
        if (webAudioRef.current !== audio) return;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        handleSongEnd();
      });
      audio.addEventListener("error", () => {
        fireLoadError();
      });

      audio.play().catch((err: unknown) => {
        if (webAudioRef.current !== audio) return;
        const domErr = err instanceof DOMException ? err : null;
        if (domErr?.name === "NotAllowedError") {
          usePlayerStore.getState().setIsPlaying(false);
          return;
        }
        if (domErr?.name === "AbortError") return;
        fireLoadError();
      });
    },
    [
      cleanupWebAudio,
      cleanupHowl,
      setDuration,
      startWebAudioProgressTracking,
      handleSongEnd,
    ]
  );

  playRefs.current = {
    playWithYouTube,
    playWithHowler,
    playWithWebAudio,
    cleanupHowl,
    cleanupWebAudio,
  };

  useEffect(() => {
    if (!activeSong) return;
    const autoplay = useSettingsStore.getState().autoplay;
    const allowExplicit = useSettingsStore.getState().allowExplicit;
    const autoplayList = useQueueStore.getState().autoplayList;
    if (autoplay && autoplayList.length === 0) {
      const songId = activeSong.id;
      fetch(`/api/songs/similar?songId=${encodeURIComponent(songId)}&limit=15`)
        .then((r) => r.json())
        .then((similar: { id: string; title: string; isExplicit?: boolean; artist?: { name: string }; coverImage?: string | null; audioUrl?: string; previewVideoUrl?: string | null }[]) => {
          const filtered = allowExplicit ? similar : (similar ?? []).filter((s) => !s.isExplicit);
          if (filtered.length > 0 && usePlayerStore.getState().activeSong?.id === songId) {
            useQueueStore.getState().setAutoplayList(filtered as import("@/types").SongType[], 0);
          }
        })
        .catch(() => {});
    }
  }, [activeSong?.id]);

  useEffect(() => {
    if (!activeSong) return;
    if (activeSong.id === lastSongIdRef.current && !sameTrackReplayRequestedRef.current) return;
    const bypassRepeatThrottle = sameTrackReplayRequestedRef.current;
    if (sameTrackReplayRequestedRef.current) {
      sameTrackReplayRequestedRef.current = false;
    }
    const now = Date.now();
    const last = lastPlayAttemptRef.current;
    if (!bypassRepeatThrottle && last?.songId === activeSong.id && now - last.time < 2500) return;
    lastPlayAttemptRef.current = { songId: activeSong.id, time: now };
    if (useSettingsStore.getState().showNowPlayingOnPlay) {
      usePlayerStore.getState().setNowPlayingOpen(true);
    }
    const prevSongId = lastSongIdRef.current;
    const prevProgress = Math.floor(usePlayerStore.getState().progress);
    const shareListening = useSettingsStore.getState().shareListeningActivity ?? true;
    if (shareListening && prevSongId && prevSongId !== activeSong.id) {
      if (prevProgress > 0) {
        fetch("/api/history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: prevSongId, playDuration: prevProgress, completed: false }),
        })
          .then((r) => r.json())
          .then((d: { newBadges?: { name: string }[] }) => {
            d?.newBadges?.forEach((b) => showBadgeToast(b.name));
          })
          .catch(() => {});
      }
    }
    const songId = activeSong.id;
    lastSongIdRef.current = songId;
    lastProgressRef.current = 0;
    setProgress(0);
    if (lastSearchVideoIdRef.current?.songId !== songId) {
      lastSearchVideoIdRef.current = null;
    }

    cleanupAll();

    const abortControllerRef = { current: new AbortController() };
    const artistName = activeSong.artist?.name || "";
    const searchQuery = `${artistName} ${activeSong.title}`;

    const tryYouTubeSearch = () =>
      fetch(`/api/youtube-search?q=${encodeURIComponent(searchQuery)}`, {
        signal: abortControllerRef.current.signal,
      })
        .then((r) => r.json())
        .then((data) => data?.videoId);

    const tryPlay = async (retry = false, retryCount = 0) => {
      if (tryPlayInProgressRef.current && !retry) return;
      if (!retry) tryPlayInProgressRef.current = true;
      const aborted = () => abortControllerRef.current.signal.aborted;

      const {
        playWithYouTube: pYT,
        playWithHowler: pHowl,
        playWithWebAudio: pWeb,
        cleanupHowl: cHowl,
        cleanupWebAudio: cWeb,
      } = playRefs.current;
      const eqOrMono =
        useSettingsStore.getState().equalizerEnabled ||
        useSettingsStore.getState().monoAudio;
      const catalogOnlyClient = isCatalogOnlyModeClient();
      const useWebAudio = eqOrMono && !prefersMobileHtml5Playback();
      const DEBUG = (msg: string, data?: unknown) => devLog("[Aciusfy:Player]", msg, data ?? "");

      if (eqOrMono && !useWebAudio) {
        DEBUG("Mobil/PWA: arka planda çalma için Web Audio kapalı (HTML5 Howler)");
      }

      const done = () => {
        tryPlayInProgressRef.current = false;
      };

      if (isAciusfyNativeShell() && usePlayerStore.getState().activeSong?.id === songId && !retry) {
        const song = activeSong as import("@/types").SongType;
        modeRef.current = "native";
        DEBUG("Native shell → TrackPlayer");
        tryPlayInProgressRef.current = true;
        const lq = useSettingsStore.getState().listeningQuality;
        void (async () => {
          try {
            const resolved = await resolveNativePlaybackPayload(song, lq);
            if (
              abortControllerRef.current.signal.aborted ||
              usePlayerStore.getState().activeSong?.id !== songId
            ) {
              return;
            }
            if (!resolved) {
              showErrorToast("Şarkı çalınamadı");
              setIsPlaying(false);
              return;
            }
            postNativePlaybackMessage({ type: "PLAY", payload: resolved });
            if (resolved.duration && resolved.duration > 0) setDuration(resolved.duration);
            nativeWallClockStartMsRef.current = Date.now();
            if (nativeProgressIntervalRef.current) {
              clearInterval(nativeProgressIntervalRef.current);
            }
            nativeProgressIntervalRef.current = setInterval(tickNativeProgressFromWallClock, 250);
            usePlayerStore.getState().setIsPlaying(true);
          } finally {
            done();
          }
        })();
        return;
      }

      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const hasOffline = useOfflineStore.getState().isDownloaded(songId);

      if (hasOffline && usePlayerStore.getState().activeSong?.id === songId) {
        const blob = await getOfflineAudio(songId);
        if (blob && usePlayerStore.getState().activeSong?.id === songId) {
          const blobUrl = URL.createObjectURL(blob);
          lastOfflineUrlRef.current = blobUrl;
          const playAudio = (url: string, id: string, onErr?: () => void) => {
            if (useWebAudio) {
              DEBUG("Çalıyor: Offline (Web Audio)");
              pWeb(url, id, onErr);
            } else {
              DEBUG("Çalıyor: Offline (Howler)");
              pHowl(url, id, onErr);
            }
          };
          playAudio(blobUrl, songId, () => {
            if (usePlayerStore.getState().activeSong?.id !== songId) return;
            if (useWebAudio) cWeb();
            else cHowl();
            if (!retry) setTimeout(() => tryPlay(true, retryCount + 1), 600);
            else { setIsPlaying(false); done(); }
          });
          return;
        }
      }

      if (isOffline) {
        DEBUG("Offline: şarkı indirilmemiş");
        setIsPlaying(false);
        done();
        return;
      }

      const tryWithVideoId = async (
        videoId: string | null,
        options?: { bypassMobileIframeBlock?: boolean }
      ): Promise<boolean> => {
        if (!videoId || usePlayerStore.getState().activeSong?.id !== songId) {
          DEBUG("tryWithVideoId skip", { videoId, songId });
          return false;
        }
        if (prefersMobileHtml5Playback() && !options?.bypassMobileIframeBlock) {
          DEBUG("Mobil: YouTube iframe atlanıyor (yalnızca ses akışı)");
          return false;
        }
        modeRef.current = "youtube";
        DEBUG("playWithYouTube başlıyor", videoId);
        const ok = await pYT(videoId);
        DEBUG("playWithYouTube sonuç", ok ? "OK" : "FAIL");
        return ok;
      };

      DEBUG("tryPlay başladı", { songId, title: activeSong.title, retry, catalogOnlyClient });
      const vidFromPreview = catalogOnlyClient ? null : extractYtId(activeSong.previewVideoUrl);
      const vidFromAudio = catalogOnlyClient ? null : extractYtId(activeSong.audioUrl);
      const audioUrl = activeSong.audioUrl;
      let vidFromSearch: string | null = null;
      if (!catalogOnlyClient && retry && lastSearchVideoIdRef.current?.songId === songId) {
        vidFromSearch = lastSearchVideoIdRef.current.videoId;
        DEBUG("Retry: önbellekten videoId", vidFromSearch);
      }
      DEBUG("videoId kaynakları", { vidFromPreview, vidFromAudio, vidFromSearch, previewVideoUrl: activeSong.previewVideoUrl, audioUrl: audioUrl?.slice(0, 50) });

      const playAudio = (url: string, id: string, onErr?: () => void) => {
        if (useWebAudio) {
          DEBUG("Çalıyor: Web Audio (EQ/Mono)");
          pWeb(url, id, onErr);
        } else {
          DEBUG("Çalıyor: Howler");
          pHowl(url, id, onErr);
        }
      };
      const onLoadErr = (opts?: { showToast?: boolean }) => {
        if (usePlayerStore.getState().activeSong?.id !== songId) return;
        DEBUG("Load error");
        if (opts?.showToast !== false) {
          showErrorToast("Şarkı yüklenirken hata oluştu");
          const lang = useSettingsStore.getState().language;
          usePlayerStore.getState().setStreamError(getTranslation("playbackError", lang));
        }
        if (useWebAudio) cWeb();
        else cHowl();
      };

      const listeningQualityEarly = useSettingsStore.getState().listeningQuality;

      if (audioUrl &&
      hasDirectPlayableAudioUrl(audioUrl) &&
      usePlayerStore.getState().activeSong?.id === songId) {
        DEBUG("Önce doğrudan ses (R2 / dosya)", {
          u: getPlayableAudioUrl(audioUrl, listeningQualityEarly, songId).slice(0, 96),
        });
        playAudio(audioUrl, songId, () => {
          if (usePlayerStore.getState().activeSong?.id !== songId) return;
          onLoadErr({ showToast: retryCount >= 3 });
          if (retryCount < 4) setTimeout(() => tryPlay(true, retryCount + 1), 600);
          else {
            setIsPlaying(false);
            done();
          }
        });
        done();
        return;
      }

      const tryAudioUrlFirst = !retry && useWebAudio && audioUrl && (isFullLengthUrl(audioUrl) || isPreviewUrl(audioUrl));
      if (tryAudioUrlFirst && usePlayerStore.getState().activeSong?.id === songId) {
        DEBUG("EQ/Mono açık: önce Web Audio deneniyor");
        if (isFullLengthUrl(audioUrl) && !isPreviewUrl(audioUrl)) {
          playAudio(audioUrl, songId, () => {
            onLoadErr({ showToast: retry });
            setTimeout(() => tryPlay(true, retryCount + 1), 600);
          });
          done();
          return;
        }
        if (isPreviewUrl(audioUrl)) {
          playAudio(audioUrl, songId, () => {
            onLoadErr({ showToast: retry });
            setTimeout(() => tryPlay(true, retryCount + 1), 600);
          });
          done();
          return;
        }
      }

      const tryYoutubeStreamForEq = (videoId: string): boolean => {
        if (!useWebAudio) return false;
        const streamUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/api/youtube-audio-stream?videoId=${encodeURIComponent(videoId)}`
            : "";
        if (!streamUrl) return false;
        playAudio(streamUrl, songId, () => {
          onLoadErr({ showToast: false });
          if (retryCount < 3) {
            setTimeout(() => tryPlay(true, retryCount + 1), 800);
          } else {
            showErrorToast("Şarkı yüklenirken hata oluştu");
            const lang = useSettingsStore.getState().language;
            usePlayerStore.getState().setStreamError(getTranslation("playbackError", lang));
            setIsPlaying(false);
            done();
          }
        });
        return true;
      };

      const attemptVideoId = async (videoId: string | null, label: string): Promise<boolean> => {
        if (!videoId || usePlayerStore.getState().activeSong?.id !== songId) return false;

        if (prefersMobileHtml5Playback()) {
          const streamUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/api/youtube-audio-stream?videoId=${encodeURIComponent(videoId)}`
              : "";
          if (streamUrl) {
            let streamFailedOnce = false;
            playAudio(streamUrl, songId, () => {
              onLoadErr({ showToast: false });
              void (async () => {
                if (usePlayerStore.getState().activeSong?.id !== songId) {
                  done();
                  return;
                }
                if (!streamFailedOnce) {
                  streamFailedOnce = true;
                  DEBUG("Mobil: ses akışı hata — YouTube iframe (yedek) deneniyor", { label });
                  const okIframe = await tryWithVideoId(videoId, {
                    bypassMobileIframeBlock: true,
                  });
                  if (okIframe) {
                    done();
                    return;
                  }
                }
                DEBUG("Mobil: ses akışı / iframe yedek başarısız, tekrar", { retryCount });
                if (retryCount < 4) {
                  setTimeout(() => tryPlay(true, retryCount + 1), 900);
                } else {
                  onLoadErr({ showToast: true });
                  setIsPlaying(false);
                  done();
                }
              })();
            });
            DEBUG(`Çalıyor: YouTube ses akışı — önce (mobil/PWA) ${label}`);
            done();
            return true;
          }
        }

        // Masaüstü / Electron: iframe EQ uygulamaz — doğrudan ses akışı + Web Audio
        if (useWebAudio && tryYoutubeStreamForEq(videoId)) {
          DEBUG(`Çalıyor: YouTube stream (EQ/Mono) ${label}`);
          done();
          return true;
        }

        if (await tryWithVideoId(videoId)) {
          DEBUG(`Çalıyor: YouTube iframe ${label}`);
          done();
          return true;
        }
        return false;
      };

      const hasVideoId = vidFromPreview || vidFromAudio || vidFromSearch;

      if (vidFromPreview) {
        if (await attemptVideoId(vidFromPreview, "previewVideoUrl")) return;
      }
      if (vidFromAudio) {
        if (await attemptVideoId(vidFromAudio, "audioUrl (YouTube)")) return;
      }

      if (!catalogOnlyClient && vidFromSearch === null) {
        if (aborted()) { done(); return; }
        DEBUG("Invidious arama başlıyor", searchQuery);
        setIsDownloading(true);
        try {
          vidFromSearch = await tryYouTubeSearch();
        } catch (e) {
          if ((e as Error).name === "AbortError") { done(); return; }
          throw e;
        } finally {
          setIsDownloading(false);
        }
        if (aborted()) { done(); return; }
        DEBUG("Invidious sonuç", vidFromSearch ?? "null");
        if (vidFromSearch) lastSearchVideoIdRef.current = { songId, videoId: vidFromSearch };
      }

      if (vidFromSearch) {
        if (await attemptVideoId(vidFromSearch, "YouTube arama")) return;
      }

      if (useWebAudio && hasVideoId) {
        DEBUG("YouTube iframe + stream başarısız");
        showErrorToast("YouTube akışı başarısız oldu");
        setIsPlaying(false);
        done();
        return;
      }

      DEBUG("Fallback kontrol", { audioUrl: !!audioUrl, isFullLength: audioUrl ? isFullLengthUrl(audioUrl) : false, isPreview: audioUrl ? isPreviewUrl(audioUrl) : false });
      if (audioUrl && usePlayerStore.getState().activeSong?.id === songId && !tryAudioUrlFirst) {
        if (isFullLengthUrl(audioUrl) && !isPreviewUrl(audioUrl)) {
          playAudio(audioUrl, songId, () => {
            if (usePlayerStore.getState().activeSong?.id !== songId) return;
            const mobile = prefersMobileHtml5Playback();
            const givenUp = retry && (!mobile || retryCount >= 3);
            onLoadErr({ showToast: givenUp });
            if (!retry) setTimeout(() => tryPlay(true, retryCount + 1), 600);
            else if (mobile && retryCount < 3) setTimeout(() => tryPlay(true, retryCount + 1), 800);
            else {
              setIsPlaying(false);
              done();
            }
          });
          return;
        }
        if (isPreviewUrl(audioUrl)) {
          playAudio(audioUrl, songId, () => {
            onLoadErr();
            setIsPlaying(false);
            done();
          });
          return;
        }
      }
      if (!tryAudioUrlFirst) {
        DEBUG("FAIL: audioUrl yok veya şarkı değişti");
        showErrorToast("Şarkı çalınamadı");
        setIsPlaying(false);
      }
      done();
    };

    tryPlay();

    void triggerR2BackgroundCache(activeSong.id);

    if (shareListening) {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: activeSong.id }),
      }).catch(() => {});
    }

    return () => {
      abortControllerRef.current.abort();
      tryPlayInProgressRef.current = false;
      lastSongIdRef.current = "";
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [activeSong?.id, tickNativeProgressFromWallClock]);

  useEffect(() => {
    if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
          startYTProgressTracking();
        } else {
          ytPlayerRef.current.pauseVideo();
          if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
        }
      } catch {}
    } else if (modeRef.current === "howler" && howlRef.current) {
      if (isPlaying) {
        if (!howlRef.current.playing()) howlRef.current.play();
      } else {
        howlRef.current.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    } else if (modeRef.current === "webaudio" && webAudioRef.current) {
      if (isPlaying) {
        if (webAudioRef.current.paused) {
          webAudioRef.current.play();
          startWebAudioProgressTracking();
        }
      } else {
        webAudioRef.current.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    } else if (modeRef.current === "native") {
      if (isPlaying) {
        const p = usePlayerStore.getState().progress;
        nativeWallClockStartMsRef.current = Date.now() - Math.max(0, p) * 1000;
        if (!nativeProgressIntervalRef.current) {
          nativeProgressIntervalRef.current = setInterval(tickNativeProgressFromWallClock, 250);
        }
        postNativePlaybackMessage({ type: "RESUME" });
      } else {
        if (nativeProgressIntervalRef.current) {
          clearInterval(nativeProgressIntervalRef.current);
          nativeProgressIntervalRef.current = null;
        }
        postNativePlaybackMessage({ type: "PAUSE" });
      }
    }
  }, [isPlaying, startYTProgressTracking, startWebAudioProgressTracking, tickNativeProgressFromWallClock]);

  useEffect(() => {
    const resumePlayback = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        backgroundPauseRetryCountRef.current = 0;
      }
      if (document.visibilityState !== "visible") return;
      const playing = usePlayerStore.getState().isPlaying;
      if (!playing) return;

      const ctx = webAudioCtxRef.current;
      if (ctx?.state === "suspended") void ctx.resume().catch(() => {});

      const a = webAudioRef.current;
      if (a?.paused) void a.play().catch(() => {});

      if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          startYTProgressTracking();
        } catch {}
      }
      if (modeRef.current === "howler" && howlRef.current) {
        try {
          if (!howlRef.current.playing()) howlRef.current.play();
        } catch {}
      }
      if (modeRef.current === "webaudio" && webAudioRef.current?.paused) {
        void webAudioRef.current.play().catch(() => {});
        startWebAudioProgressTracking();
      }
    };

    document.addEventListener("visibilitychange", resumePlayback);
    window.addEventListener("pageshow", resumePlayback);
    window.addEventListener("focus", resumePlayback);
    return () => {
      document.removeEventListener("visibilitychange", resumePlayback);
      window.removeEventListener("pageshow", resumePlayback);
      window.removeEventListener("focus", resumePlayback);
    };
  }, [startYTProgressTracking, startWebAudioProgressTracking]);

  useEffect(() => {
    if (!isPlaying || !activeSong?.id) {
      if (historySyncIntervalRef.current) {
        clearInterval(historySyncIntervalRef.current);
        historySyncIntervalRef.current = null;
      }
      return;
    }
    const syncHistory = () => {
      const shareListening = useSettingsStore.getState().shareListeningActivity ?? true;
      if (!shareListening) return;
      const prog = Math.floor(usePlayerStore.getState().progress);
      const songId = usePlayerStore.getState().activeSong?.id;
      if (songId && prog >= 0) {
        fetch("/api/history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId, playDuration: prog, completed: false }),
        })
          .then((r) => r.json())
          .then((d: { newBadges?: { name: string }[] }) => {
            d?.newBadges?.forEach((b) => showBadgeToast(b.name));
          })
          .catch(() => {});
      }
    };
    historySyncIntervalRef.current = setInterval(syncHistory, 30_000);
    return () => {
      if (historySyncIntervalRef.current) {
        clearInterval(historySyncIntervalRef.current);
        historySyncIntervalRef.current = null;
      }
    };
  }, [isPlaying, activeSong?.id]);

  const volumeLevel = useSettingsStore((s) => s.volumeLevel);
  const normalizeVolume = useSettingsStore((s) => s.normalizeVolume);
  const volumeMultiplier =
    volumeLevel === "loud" ? 1.2 : volumeLevel === "quiet" ? 0.7 : 1;
  const normMult = normalizeVolume ? 0.85 : 1;

  const equalizerEnabled = useSettingsStore((s) => s.equalizerEnabled);
  const equalizerMode = useSettingsStore((s) => s.equalizerMode);
  const equalizerPreset = useSettingsStore((s) => s.equalizerPreset);
  const equalizerManualGains = useSettingsStore((s) => s.equalizerManualGains);
  const equalizerCustomGains = useSettingsStore((s) => s.equalizerCustomGains);
  const monoAudio = useSettingsStore((s) => s.monoAudio);
  const eqPlaybackPathRef = useRef<boolean | null>(null);

  useEffect(() => {
    const wantsWebAudio =
      (equalizerEnabled || monoAudio) && !prefersMobileHtml5Playback();
    if (eqPlaybackPathRef.current === null) {
      eqPlaybackPathRef.current = wantsWebAudio;
      return;
    }
    if (eqPlaybackPathRef.current === wantsWebAudio) return;
    eqPlaybackPathRef.current = wantsWebAudio;

    if (isAciusfyNativeShell()) return;
    const cur = usePlayerStore.getState().activeSong;
    if (!cur) return;

    const mode = modeRef.current;
    const needsRestart = wantsWebAudio
      ? mode !== "webaudio"
      : mode === "webaudio";
    if (!needsRestart) return;

    sameTrackReplayRequestedRef.current = true;
    usePlayerStore.getState().setActiveSong(cur);
  }, [equalizerEnabled, monoAudio]);

  useEffect(() => {
    if (modeRef.current !== "webaudio" || eqFiltersRef.current.length === 0) return;
    if (!equalizerEnabled) {
      eqFiltersRef.current.forEach((f) => {
        f.gain.value = 0;
      });
      return;
    }
    const gains = getEffectiveEQGains(equalizerMode, equalizerPreset, equalizerManualGains, equalizerCustomGains);
    eqFiltersRef.current.forEach((f, i) => {
      f.gain.value = gains[i] ?? 0;
    });
  }, [equalizerEnabled, equalizerMode, equalizerPreset, equalizerManualGains, equalizerCustomGains]);

  useEffect(() => {
    if (!equalizerEnabled) return;
    if (modeRef.current !== "webaudio") return;
    if (eqFiltersRef.current.length > 0) return;
    if (isAciusfyNativeShell()) return;
    const cur = usePlayerStore.getState().activeSong;
    if (!cur) return;
    sameTrackReplayRequestedRef.current = true;
    usePlayerStore.getState().setActiveSong(cur);
  }, [equalizerEnabled]);

  useEffect(() => {
    const baseVol = isMuted ? 0 : volume;
    const effectiveVol = Math.min(1, baseVol * volumeMultiplier * normMult);
    if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(effectiveVol * 100));
      } catch {}
    } else if (modeRef.current === "howler" && howlRef.current) {
      howlRef.current.volume(effectiveVol);
    } else if (modeRef.current === "webaudio" && webAudioGainRef.current) {
      webAudioGainRef.current.gain.value = effectiveVol;
    }
  }, [volume, isMuted, volumeMultiplier, normMult]);

  const seekTo = useCallback(
    (time: number) => {
      lastProgressRef.current = time;
      setProgress(time);
      if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
        try { ytPlayerRef.current.seekTo(time, true); } catch {}
      } else if (modeRef.current === "howler" && howlRef.current) {
        howlRef.current.seek(time);
      } else if (modeRef.current === "webaudio" && webAudioRef.current) {
        webAudioRef.current.currentTime = time;
      } else if (modeRef.current === "native") {
        nativeWallClockStartMsRef.current = Date.now() - Math.max(0, time) * 1000;
        postNativePlaybackMessage({ type: "SEEK", position: time });
      }
    },
    [setProgress]
  );

  const unlockAndPlay = useCallback((songOverride?: { id: string; title: string; artist?: { name: string }; coverImage?: string | null; audioUrl?: string; previewVideoUrl?: string | null } | null) => {
    const song = songOverride ?? usePlayerStore.getState().activeSong;
    usePlayerStore.getState().setIsPlaying(true);

    if (modeRef.current === "native") {
      const p = usePlayerStore.getState().progress;
      nativeWallClockStartMsRef.current = Date.now() - Math.max(0, p) * 1000;
      if (!nativeProgressIntervalRef.current) {
        nativeProgressIntervalRef.current = setInterval(tickNativeProgressFromWallClock, 250);
      }
      postNativePlaybackMessage({ type: "RESUME" });
      return;
    }

    if (modeRef.current === "youtube" && ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        startYTProgressTracking();
      } catch {}
    } else if (modeRef.current === "howler" && howlRef.current) {
      if (!howlRef.current.playing()) howlRef.current.play();
    } else if (modeRef.current === "webaudio" && webAudioRef.current) {
      if (webAudioRef.current.paused) {
        const ctx = webAudioCtxRef.current;
        if (ctx?.state === "suspended") ctx.resume().catch(() => {});
        webAudioRef.current.play().catch(() => {});
        startWebAudioProgressTracking();
      }
    } else if (songOverride) {
      usePlayerStore.getState().setActiveSong(songOverride as import("@/types").SongType);
    } else if (song?.audioUrl && (isFullLengthUrl(song.audioUrl) || isPreviewUrl(song.audioUrl))) {
      cleanupAll();
      const useWeb =
        (useSettingsStore.getState().equalizerEnabled ||
          useSettingsStore.getState().monoAudio) &&
        !prefersMobileHtml5Playback();
      if (useWeb) {
        playWithWebAudio(song.audioUrl, song.id);
      } else {
        playWithHowler(song.audioUrl, song.id);
      }
    }
  }, [startYTProgressTracking, cleanupAll, playWithHowler, playWithWebAudio, startWebAudioProgressTracking, tickNativeProgressFromWallClock]);

  useEffect(() => {
    return () => {
      cleanupAll();
      if (ytContainerRef.current) {
        ytContainerRef.current.remove();
        ytContainerRef.current = null;
      }
    };
  }, [cleanupAll]);

  return { seekTo, unlockAndPlay };
}
