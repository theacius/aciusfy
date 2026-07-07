import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { getPlayableAudioUrl } from "@/lib/media-proxy-url";
import { usePlayerStore } from "@/store/playerStore";
import { StoryProgressBar } from "./ProgressBar";
import {
  MatchSlide,
  CompatibilitySlide,
  SharedArtistsSlide,
  UserStyleSlide,
  FavoriteSongSlide,
  BlendReadySlide,
} from "./StorySlide";

interface ArtistInfo {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TopSharedSong {
  id: string;
  title: string;
  coverImage: string | null;
  artistName: string | null;
  audioUrl: string | null;
}

interface PlaylistSongAudio {
  audioUrl: string;
}

interface BlendStoryData {
  blendId: string;
  playlistId?: string;
  user1Name: string;
  user2Name: string;
  matchPercentage: number;
  sharedArtists: ArtistInfo[];
  uniqueArtistsUser1: ArtistInfo[];
  uniqueArtistsUser2: ArtistInfo[];
  topSharedSong?: TopSharedSong | null;
  playlistSongs?: PlaylistSongAudio[];
}

interface PreloadedAudio {
  bg: HTMLAudioElement | null;
  bg2: HTMLAudioElement | null;
  fav: HTMLAudioElement | null;
}

interface BlendStoryProps {
  data: BlendStoryData;
  preloadedAudio?: PreloadedAudio;
  onClose: () => void;
}

const SLIDE_DURATIONS = [3000, 3500, 4000, 3500, 3000, 3000, 5000];
const TOTAL_SLIDES = 7;
const FAV_SONG_SLIDE = 2;

const GRADIENT_COLORS = [
  ["#27272a", "#18181b", "#09090b"],
  ["#3f3f46", "#27272a", "#09090b"],
  ["#52525b", "#3f3f46", "#09090b"],
  ["#27272a", "#1c1917", "#09090b"],
  ["#404040", "#262626", "#09090b"],
  ["#3f3f46", "#27272a", "#0a0a0a"],
  ["#52525b", "#404040", "#09090b"],
];

export function BlendStory({ data, preloadedAudio, onClose }: BlendStoryProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const wasPlayingRef = useRef(usePlayerStore.getState().isPlaying);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const pausedProgressRef = useRef(0);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const bg2AudioRef = useRef<HTMLAudioElement | null>(null);
  const favAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    wasPlayingRef.current = usePlayerStore.getState().isPlaying;
    setIsPlaying(false);

    const handleVisibility = () => {
      if (document.hidden) {
        bgAudioRef.current?.pause();
        bg2AudioRef.current?.pause();
        favAudioRef.current?.pause();
      } else {
        const activeBg = currentSlide > FAV_SONG_SLIDE
          ? (bg2AudioRef.current ?? bgAudioRef.current)
          : bgAudioRef.current;
        if (currentSlide === FAV_SONG_SLIDE) {
          favAudioRef.current?.play().catch(() => {});
        } else if (activeBg) {
          activeBg.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wasPlayingRef.current) setIsPlaying(true);
    };
  }, [setIsPlaying]);

  const goNext = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((s) => s + 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    }
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    }
  }, [currentSlide]);

  useEffect(() => {
    if (isPaused) {
      pausedProgressRef.current = progress;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const slideDuration = SLIDE_DURATIONS[currentSlide];
    const remainingDuration = slideDuration * (1 - pausedProgressRef.current);
    startTimeRef.current = Date.now() - slideDuration * pausedProgressRef.current;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / slideDuration, 1);
      setProgress(p);

      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (currentSlide < TOTAL_SLIDES - 1) {
          setCurrentSlide((s) => s + 1);
          setProgress(0);
          pausedProgressRef.current = 0;
        }
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSlide, isPaused]);

  const stopAllAudio = useCallback(() => {
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    bgAudioRef.current?.pause();
    bg2AudioRef.current?.pause();
    favAudioRef.current?.pause();
  }, []);

  const handleClose = useCallback(() => {
    stopAllAudio();
    onClose();
  }, [onClose, stopAllAudio]);

  const handleGoToBlend = useCallback(() => {
    stopAllAudio();
    fetch(`/api/blend/${data.blendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "storySeen" }),
    }).catch(() => {});

    if (data.playlistId) {
      router.push(`/playlist/${data.playlistId}`);
    }
    onClose();
  }, [data.blendId, data.playlistId, router, onClose, stopAllAudio]);

  const audioUnlockedRef = useRef(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!audioUnlockedRef.current) {
        audioUnlockedRef.current = true;
        if (bgAudioRef.current && bgAudioRef.current.paused) {
          bgAudioRef.current.play().catch(() => {});
        }
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) goPrev();
      else goNext();
    },
    [goNext, goPrev]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") handleClose();
    },
    [goNext, goPrev, handleClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
      if (bgAudioRef.current && bgAudioRef.current.paused) {
        bgAudioRef.current.play().catch(() => {});
      }
    }
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setIsPaused(true);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      setIsPaused(false);
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dt = Date.now() - touchStartRef.current.time;

      if (dt < 300 && Math.abs(dx) < 30) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = touchStartRef.current.x - rect.left;
        if (x < rect.width / 3) goPrev();
        else goNext();
      } else if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }

      touchStartRef.current = null;
    },
    [goNext, goPrev]
  );

  useEffect(() => {
    let cancelled = false;
    let pendingResumeHandler: (() => void) | null = null;

    const validUrl = (u: string | null | undefined): u is string =>
      typeof u === "string" && u.length > 5 && !u.includes("undefined");

    const loadAudio = (url: string, vol: number, startPct: number): Promise<HTMLAudioElement | null> => {
      return new Promise((resolve) => {
        if (cancelled) { resolve(null); return; }
        const playableUrl = getPlayableAudioUrl(url);
        const audio = new Audio();
        audio.volume = vol;
        audio.preload = "auto";
        audio.src = playableUrl;
        audio.load();
        let done = false;
        const finish = (el: HTMLAudioElement | null) => {
          if (done) return;
          done = true;
          resolve(el);
        };
        audio.addEventListener("loadedmetadata", () => {
          if (audio.duration && isFinite(audio.duration)) audio.currentTime = audio.duration * startPct;
        });
        audio.addEventListener("canplay", () => finish(audio), { once: true });
        audio.addEventListener("error", () => { audio.src = ""; finish(null); }, { once: true });
        setTimeout(() => {
          if (!done) { finish(audio.readyState >= 2 ? audio : null); }
        }, 5000);
      });
    };

    const tryLoadFirst = async (urls: string[], vol: number, startPct: number, label: string): Promise<HTMLAudioElement | null> => {
      for (const url of urls) {
        if (cancelled) return null;
        const el = await loadAudio(url, vol, startPct);
        if (el) {
          devLog(`[BlendStory] ${label} loaded OK`);
          return el;
        }
      }
      devWarn(`[BlendStory] ${label}: no working URL`);
      return null;
    };

    const attachPreloaded = (ref: { current: HTMLAudioElement | null }, pre: HTMLAudioElement | null | undefined) => {
      if (pre && pre.src && pre.readyState >= 2) {
        ref.current = pre;
        return true;
      }
      return false;
    };

    const initAudio = async () => {
      const allSongs = (data.playlistSongs ?? []).filter((s) => validUrl(s.audioUrl));
      const favUrl = validUrl(data.topSharedSong?.audioUrl) ? data.topSharedSong!.audioUrl : null;
      const bgCandidates = allSongs.filter((s) => s.audioUrl !== favUrl);

      const isStable = (url: string) =>
        url.includes("r2.") || url.includes("r2dev") ||
        url.startsWith("/") ||
        url.includes("youtube") || url.includes("youtu.be") ||
        url.includes("cloudflare");
      const stableSongs = bgCandidates.filter((s) => isStable(s.audioUrl));
      const deezerSongs = bgCandidates.filter((s) => !isStable(s.audioUrl));
      const sorted = [...stableSongs.sort(() => Math.random() - 0.5), ...deezerSongs.sort(() => Math.random() - 0.5)];
      const bgUrls = sorted.map((s) => s.audioUrl);

      devLog("[BlendStory] Audio candidates — stable:", stableSongs.length, "deezer:", deezerSongs.length, "total:", bgUrls.length);

      const bgUsed = attachPreloaded(bgAudioRef, preloadedAudio?.bg);
      const bg2Used = attachPreloaded(bg2AudioRef, preloadedAudio?.bg2);
      const favUsed = attachPreloaded(favAudioRef, preloadedAudio?.fav);

      devLog("[BlendStory] Preloaded used — bg:", bgUsed, "bg2:", bg2Used, "fav:", favUsed,
        "| bgCandidates:", bgUrls.length, "| favUrl:", favUrl ? "yes" : "no");

      const promises: Promise<void>[] = [];

      if (!bgAudioRef.current && bgUrls.length > 0) {
        promises.push(
          tryLoadFirst(bgUrls, 0.3, 0.3, "BG").then((el) => {
            if (el && !cancelled) bgAudioRef.current = el;
          })
        );
      }

      if (!bg2AudioRef.current && bgUrls.length > 1) {
        promises.push(
          (async () => {
            await new Promise((r) => setTimeout(r, 200));
            const usedSrc = bgAudioRef.current?.src || "";
            const bg2Urls = bgUrls.filter((u) => getPlayableAudioUrl(u) !== usedSrc);
            if (bg2Urls.length > 0) {
              const el = await tryLoadFirst(bg2Urls, 0, 0.3, "BG2");
              if (el && !cancelled) bg2AudioRef.current = el;
            }
          })()
        );
      }

      if (!favAudioRef.current && favUrl) {
        promises.push(
          tryLoadFirst([favUrl], 0, 0.4, "Fav").then((el) => { if (el && !cancelled) favAudioRef.current = el; })
        );
      }

      await Promise.all(promises);

      if (cancelled) return;

      if (bgAudioRef.current) {
        bgAudioRef.current.volume = 0.3;
        bgAudioRef.current.play().then(() => {
          devLog("[BlendStory] BG playing!");
        }).catch(() => {
          pendingResumeHandler = () => { bgAudioRef.current?.play().catch(() => {}); };
          document.addEventListener("pointerdown", pendingResumeHandler, { once: true });
        });
      }
    };

    initAudio();

    return () => {
      cancelled = true;
      if (pendingResumeHandler) document.removeEventListener("pointerdown", pendingResumeHandler);
      bgAudioRef.current?.pause();
      bg2AudioRef.current?.pause();
      favAudioRef.current?.pause();
      bgAudioRef.current = null;
      bg2AudioRef.current = null;
      favAudioRef.current = null;
      if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    };
  }, []);

  const POST_FAV_SLIDE = FAV_SONG_SLIDE + 1;

  useEffect(() => {
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }

    const muteAndPause = (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      try { audio.volume = 0; audio.pause(); } catch {}
    };

    const soloPlay = (audio: HTMLAudioElement | null, vol: number) => {
      if (!audio) return;
      try {
        audio.volume = vol;
        if (audio.paused) audio.play().catch(() => {});
      } catch {}
    };

    const PRE_FADE_SLIDE = FAV_SONG_SLIDE - 1;
    const bg = bgAudioRef.current;
    const bg2 = bg2AudioRef.current;
    const fav = favAudioRef.current;

    if (currentSlide < PRE_FADE_SLIDE) {
      muteAndPause(fav);
      muteAndPause(bg2);
      soloPlay(bg, 0.3);

    } else if (currentSlide === PRE_FADE_SLIDE) {
      muteAndPause(fav);
      muteAndPause(bg2);
      soloPlay(bg, 0.3);

      const slideDur = SLIDE_DURATIONS[PRE_FADE_SLIDE];
      const startTime = Date.now();
      fadeIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const fadeStart = slideDur * 0.5;
        if (elapsed < fadeStart) return;
        const p = Math.min((elapsed - fadeStart) / (slideDur - fadeStart), 1);
        if (bg) { try { bg.volume = Math.max(0, 0.3 * (1 - p)); } catch {} }
        if (p >= 1 && fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
      }, 50);

    } else if (currentSlide === FAV_SONG_SLIDE) {
      muteAndPause(bg);
      muteAndPause(bg2);
      soloPlay(fav, 0.5);

    } else if (currentSlide === POST_FAV_SLIDE) {
      muteAndPause(bg);
      const nextBg = bg2 ?? bg;
      const slideDur = SLIDE_DURATIONS[POST_FAV_SLIDE];
      const startTime = Date.now();

      soloPlay(fav, 0.5);

      fadeIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const halfDur = slideDur * 0.5;
        if (elapsed < halfDur) {
          if (fav) { try { fav.volume = Math.max(0, 0.5 * (1 - elapsed / halfDur)); } catch {} }
        } else {
          muteAndPause(fav);
          const fadeIn = Math.min((elapsed - halfDur) / halfDur, 1);
          if (nextBg) {
            try {
              nextBg.volume = 0.3 * fadeIn;
              if (nextBg.paused) nextBg.play().catch(() => {});
            } catch {}
          }
          if (fadeIn >= 1 && fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
        }
      }, 50);

    } else {
      muteAndPause(fav);
      muteAndPause(bg);
      const activeBg = bg2 ?? bg;
      soloPlay(activeBg, 0.3);
    }
  }, [currentSlide, POST_FAV_SLIDE]);

  const colors = GRADIENT_COLORS[currentSlide] || GRADIENT_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex flex-col"
    >
      
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse at 30% 20%, ${colors[0]}, transparent 60%),
                       radial-gradient(ellipse at 70% 80%, ${colors[1]}, transparent 60%),
                       linear-gradient(135deg, ${colors[2]}, #000)`,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />

      
      <motion.div
        className="pointer-events-none absolute h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
        animate={{
          x: ["-10%", "60%", "30%"],
          y: ["20%", "60%", "40%"],
          background: [`radial-gradient(circle, ${colors[0]}, transparent)`, `radial-gradient(circle, ${colors[1]}, transparent)`],
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      
      <div className="relative z-10">
        <StoryProgressBar
          totalSlides={TOTAL_SLIDES}
          currentSlide={currentSlide}
          progress={progress}
          isPaused={isPaused}
        />
      </div>

      
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleClose}
        className="absolute right-4 top-12 z-20 rounded-full bg-black/30 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white"
      >
        <X className="h-5 w-5" />
      </motion.button>

      
      <div
        className="relative z-10 flex flex-1 cursor-pointer items-center justify-center px-6"
        onClick={handleClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {currentSlide === 0 && (
            <MatchSlide
              key="match"
              user1={data.user1Name}
              user2={data.user2Name}
              matchPct={data.matchPercentage}
            />
          )}
          {currentSlide === 1 && (
            <CompatibilitySlide
              key="compat"
              label={t("blendMusicCompatibility")}
              matchPct={data.matchPercentage}
            />
          )}
          {currentSlide === 2 && data.topSharedSong && (
            <FavoriteSongSlide
              key="favsong"
              song={data.topSharedSong}
            />
          )}
          {currentSlide === 2 && !data.topSharedSong && (
            <SharedArtistsSlide
              key="shared-fallback"
              label={t("blendBothLove")}
              artists={data.sharedArtists}
            />
          )}
          {currentSlide === 3 && (
            <SharedArtistsSlide
              key="shared"
              label={t("blendBothLove")}
              artists={data.sharedArtists}
            />
          )}
          {currentSlide === 4 && (
            <UserStyleSlide
              key="user1style"
              label={t("blendYourStyle").replace("{name}", data.user1Name)}
              artists={data.uniqueArtistsUser1}
            />
          )}
          {currentSlide === 5 && (
            <UserStyleSlide
              key="user2style"
              label={t("blendYourStyle").replace("{name}", data.user2Name)}
              artists={data.uniqueArtistsUser2}
            />
          )}
          {currentSlide === 6 && (
            <BlendReadySlide
              key="ready"
              label={t("blendReady")}
              buttonLabel={t("blendGoToPlaylist")}
              onGo={handleGoToBlend}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
