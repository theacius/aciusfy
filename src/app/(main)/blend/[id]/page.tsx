import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { proxiedImageUrl, getPlayableAudioUrl } from "@/lib/media-proxy-url";
import { showErrorToast } from "@/store/toastStore";
import { BlendStory } from "@/components/blend/BlendStory";
import { Check, X, Play, Music2, Trash2, Loader2, Sparkles, ExternalLink, Clock } from "lucide-react";
import type { SongType } from "@/types";

interface BlendUser {
  id: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
}

interface BlendData {
  id: string;
  creatorId: string;
  invitedId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  matchPercentage: number | null;
  playlistId: string | null;
  storySeenByCreator: boolean;
  storySeenByInvited: boolean;
  creator: BlendUser;
  invited: BlendUser;
  playlist?: {
    id: string;
    title: string;
    songs: Array<{
      song: SongType;
    }>;
  } | null;
}

interface StoryApiData {
  matchPercentage: number;
  sharedArtists: Array<{ id: string; name: string; profileImage: string | null }>;
  uniqueArtistsUser1: Array<{ id: string; name: string; profileImage: string | null }>;
  uniqueArtistsUser2: Array<{ id: string; name: string; profileImage: string | null }>;
  topSharedSong?: { id: string; title: string; coverImage: string | null; artistName: string | null; audioUrl: string | null } | null;
}

function blendRouteId(params: { id?: string | string[] }): string | undefined {
  const raw = params?.id;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) return raw[0];
  return undefined;
}

export default function BlendPage() {
  const { t } = useTranslation();
  const params = useParams<{ id?: string | string[] }>();
  const id = blendRouteId(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [blend, setBlend] = useState<BlendData | null>(null);
  const [storyData, setStoryData] = useState<StoryApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [suppressNotFound, setSuppressNotFound] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const preloadedBgRef = useRef<HTMLAudioElement | null>(null);
  const preloadedBg2Ref = useRef<HTMLAudioElement | null>(null);
  const preloadedFavRef = useRef<HTMLAudioElement | null>(null);
  const preloadStartedRef = useRef(false);
  const blendLoadErrorToastShownRef = useRef(false);
  const fetchBlendRef = useRef<(() => void) | undefined>(undefined);

  const toastBlendLoadErrorOnce = useCallback(() => {
    if (blendLoadErrorToastShownRef.current) return;
    blendLoadErrorToastShownRef.current = true;
    showErrorToast(t("blendLoadError"));
  }, [t]);

  const toastRateLimitOnce = useCallback(() => {
    if (blendLoadErrorToastShownRef.current) return;
    blendLoadErrorToastShownRef.current = true;
    showErrorToast(t("blendRateLimited"));
  }, [t]);

  const deleteBlend = useCallback(async () => {
    if (!id || !confirm("Bu blend'i silmek istediğine emin misin?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/blend/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/blend");
    } catch { showErrorToast(t("deleteFailed")); }
    setDeleting(false);
  }, [id, router, t]);

  useEffect(() => {
    setBlend(null);
    setStoryData(null);
    setLoading(true);
    setSuppressNotFound(false);
    blendLoadErrorToastShownRef.current = false;
  }, [id]);

  const fetchBlend = useCallback(() => {
    if (!id || authStatus !== "authenticated") return;
    fetch(`/api/blend/${id}`, { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 404) {
          setSuppressNotFound(true);
          router.push("/blend");
          return null;
        }
        if (r.status === 401) {
          setSuppressNotFound(true);
          const path = `/blend/${id}`;
          router.replace(`/login?callbackUrl=${encodeURIComponent(path)}`);
          return null;
        }
        if (r.status === 403) {
          setSuppressNotFound(true);
          router.push("/blend");
          return null;
        }
        if (r.status === 429) {
          const ra = r.headers.get("Retry-After");
          const waitSec = Math.min(90, Math.max(1, parseInt(ra || "10", 10) || 10));
          setLoading(false);
          toastRateLimitOnce();
          setTimeout(() => {
            blendLoadErrorToastShownRef.current = false;
            fetchBlendRef.current?.();
          }, waitSec * 1000);
          return null;
        }
        if (!r.ok) {
          return r.json().then(
            (body) => ({ __error: true as const, status: r.status, body }),
            () => ({ __error: true as const, status: r.status, body: null })
          );
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (typeof data === "object" && "__error" in data && data.__error) {
          devWarn("[blend] GET failed", data.status, data.body);
          setSuppressNotFound(true);
          toastBlendLoadErrorOnce();
          router.push("/blend");
          return;
        }
        if (data.error === "Not found") {
          setSuppressNotFound(true);
          router.push("/blend");
          return;
        }
        if (!data.blend) {
          setSuppressNotFound(true);
          toastBlendLoadErrorOnce();
          router.push("/blend");
          return;
        }
        setBlend(data.blend);
        setStoryData(data.storyData ?? null);
      })
      .catch(() => {
        setSuppressNotFound(true);
        toastBlendLoadErrorOnce();
        router.push("/blend");
      })
      .finally(() => setLoading(false));
  }, [id, router, authStatus, toastBlendLoadErrorOnce, toastRateLimitOnce]);

  useEffect(() => {
    fetchBlendRef.current = fetchBlend;
  }, [fetchBlend]);

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }
    if (authStatus === "unauthenticated") {
      const cb = id ? `/blend/${id}` : "/blend";
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
      return;
    }
    if (!id) {
      setLoading(false);
      router.replace("/blend");
      return;
    }

    void fetchBlend();
  }, [authStatus, id, fetchBlend, router]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !id || showStory) return;
    const interval = setInterval(() => {
      void fetchBlend();
    }, 12_000);
    return () => clearInterval(interval);
  }, [authStatus, id, showStory, fetchBlend]);

  const preloadAudioElement = useCallback((url: string, vol: number, startPct: number): Promise<HTMLAudioElement | null> => {
    return new Promise((resolve) => {
      const playableUrl = getPlayableAudioUrl(url);
      const audio = new Audio();
      audio.preload = "auto";
      audio.volume = vol;
      audio.src = playableUrl;
      audio.load();
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        if (ok) {
          if (audio.duration && isFinite(audio.duration)) {
            audio.currentTime = audio.duration * startPct;
          }
          resolve(audio);
        } else {
          audio.src = "";
          resolve(null);
        }
      };
      audio.addEventListener("canplay", () => finish(true), { once: true });
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          audio.currentTime = audio.duration * startPct;
        }
      });
      audio.addEventListener("error", () => finish(false), { once: true });
      setTimeout(() => finish(audio.readyState >= 2), 8000);
    });
  }, []);

  const blendRef = useRef(blend);
  const storyDataRef = useRef(storyData);
  blendRef.current = blend;
  storyDataRef.current = storyData;

  useEffect(() => {
    let cancelled = false;

    const doPreload = async () => {
      const b = blendRef.current;
      const sd = storyDataRef.current;
      if (!b || b.status !== "ACCEPTED" || !b.playlist?.songs?.length) return;

      const songs = b.playlist.songs
        .map((ps) => ps.song.audioUrl)
        .filter((u): u is string => typeof u === "string" && u.length > 5);
      const favUrl = sd?.topSharedSong?.audioUrl;

      const isStable = (url: string) =>
        url.includes("r2.") || url.includes("r2dev") || url.startsWith("/") ||
        url.includes("youtube") || url.includes("youtu.be") || url.includes("cloudflare");

      const candidates = songs.filter((u) => u !== favUrl);
      const stableFirst = [
        ...candidates.filter(isStable).sort(() => Math.random() - 0.5),
        ...candidates.filter((u) => !isStable(u)).sort(() => Math.random() - 0.5),
      ];

      const tryPreload = async (urls: string[], vol: number, pct: number) => {
        for (const u of urls) {
          if (cancelled) return null;
          const el = await preloadAudioElement(u, vol, pct);
          if (el) return el;
        }
        return null;
      };

      const results = await Promise.allSettled([
        tryPreload(stableFirst, 0.3, 0.3),
        tryPreload(stableFirst.length > 1 ? stableFirst.slice(1) : [], 0, 0.3),
        favUrl ? tryPreload([favUrl, ...stableFirst.slice(0, 2)], 0, 0.4) : Promise.resolve(null),
      ]);

      if (cancelled) {
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value) { r.value.pause(); r.value.src = ""; }
        });
        return;
      }

      const bg = results[0].status === "fulfilled" ? results[0].value : null;
      const bg2 = results[1].status === "fulfilled" ? results[1].value : null;
      const fav = results[2].status === "fulfilled" ? results[2].value : null;

      preloadedBgRef.current = bg;
      preloadedBg2Ref.current = bg2;
      preloadedFavRef.current = fav;
      devLog("[BlendPage] Preloaded audio:", { bg: !!bg, bg2: !!bg2, fav: !!fav });
    };

    if (!preloadStartedRef.current && blend?.status === "ACCEPTED" && blend.playlist?.songs?.length) {
      preloadStartedRef.current = true;
      doPreload();
    }

    return () => {
      cancelled = true;
    };
  }, [blend?.status, blend?.playlist?.songs?.length, preloadAudioElement]);

  useEffect(() => {
    return () => {
      if (preloadedBgRef.current) { preloadedBgRef.current.pause(); preloadedBgRef.current.src = ""; }
      if (preloadedBg2Ref.current) { preloadedBg2Ref.current.pause(); preloadedBg2Ref.current.src = ""; }
      if (preloadedFavRef.current) { preloadedFavRef.current.pause(); preloadedFavRef.current.src = ""; }
    };
  }, []);

  const handleAction = async (action: "accept" | "decline") => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/blend/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "accept") {
          setPreparing(true);
          setActionLoading(false);

          const freshRes = await fetch(`/api/blend/${id}`, { credentials: "same-origin" });
          if (!freshRes.ok) {
            setPreparing(false);
            showErrorToast(t("blendLoadError"));
            await fetchBlend();
            return;
          }
          const freshData = await freshRes.json();
          const story = freshData.storyData;
          const songs: { song: { audioUrl: string } }[] = freshData.blend?.playlist?.songs ?? [];
          const favUrl = story?.topSharedSong?.audioUrl;

          const audioUrls = songs
            .map((s) => s.song.audioUrl)
            .filter((u): u is string => typeof u === "string" && u.length > 5);

          const isStable = (url: string) =>
            url.includes("r2.") || url.includes("r2dev") || url.startsWith("/") ||
            url.includes("youtube") || url.includes("youtu.be") || url.includes("cloudflare");

          const candidates = audioUrls.filter((u) => u !== favUrl);
          const stableFirst = [
            ...candidates.filter(isStable).sort(() => Math.random() - 0.5),
            ...candidates.filter((u) => !isStable(u)).sort(() => Math.random() - 0.5),
          ];

          const tryPre = async (urls: string[], vol: number, pct: number) => {
            for (const u of urls) {
              const el = await preloadAudioElement(u, vol, pct);
              if (el) return el;
            }
            return null;
          };

          const [bg, bg2, fav] = await Promise.all([
            tryPre(stableFirst, 0.3, 0.3),
            tryPre(stableFirst.length > 1 ? stableFirst.slice(1) : [], 0, 0.3),
            favUrl ? tryPre([favUrl, ...stableFirst.slice(0, 2)], 0, 0.4) : Promise.resolve(null),
          ]);

          preloadedBgRef.current = bg;
          preloadedBg2Ref.current = bg2;
          preloadedFavRef.current = fav;

          setBlend(freshData.blend);
          setStoryData(freshData.storyData ?? null);
          setPreparing(false);
        } else {
          await fetchBlend();
        }
      }
    } catch { showErrorToast(t("actionFailed")); }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-white/5 border-t-purple-500"
        />
        <p className="text-sm text-white/20">Yükleniyor</p>
      </div>
    );
  }

  if (preparing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-14 w-14 rounded-full border-[3px] border-white/5 border-t-purple-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-white">Blend hazırlanıyor...</p>
          <p className="mt-2 text-sm text-white/30">Müzik ruhunuz eşleşiyor</p>
        </motion.div>
      </div>
    );
  }

  if (!blend) {
    if (!suppressNotFound) {
      router.push("/blend");
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Music2 className="h-12 w-12 text-white/10" />
          <p className="text-sm text-white/25">Blend bulunamadı</p>
        </div>
      );
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-white/5 border-t-purple-500"
        />
        <p className="text-sm text-white/20">Yönlendiriliyor…</p>
      </div>
    );
  }

  const userId = session?.user?.id;
  const isInvited = blend.invitedId === userId;
  const otherUser = blend.creatorId === userId ? blend.invited : blend.creator;

  return (
    <>
      <AnimatePresence>
        {showStory && storyData && (
          <BlendStory
            data={{
              blendId: blend.id,
              playlistId: blend.playlistId ?? undefined,
              user1Name: blend.creator.name || "User",
              user2Name: blend.invited.name || "User",
              matchPercentage: storyData.matchPercentage,
              sharedArtists: storyData.sharedArtists,
              uniqueArtistsUser1: storyData.uniqueArtistsUser1,
              uniqueArtistsUser2: storyData.uniqueArtistsUser2,
              topSharedSong: storyData.topSharedSong,
              playlistSongs: blend.playlist?.songs?.map((ps) => ({ audioUrl: ps.song.audioUrl })).filter((s) => s.audioUrl && s.audioUrl.length > 1) ?? [],
            }}
            preloadedAudio={{
              bg: preloadedBgRef.current,
              bg2: preloadedBg2Ref.current,
              fav: preloadedFavRef.current,
            }}
            onClose={() => setShowStory(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative mx-auto w-full max-w-2xl px-4 py-8">
        
        <div className="pointer-events-none absolute inset-0 -mx-4 overflow-hidden">
          <motion.div
            animate={{ x: [0, 20, -15, 0], y: [0, -30, 15, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-20 -top-10 h-60 w-60 rounded-full bg-purple-600/15 blur-[80px]"
          />
          <motion.div
            animate={{ x: [0, -20, 10, 0], y: [0, 20, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]"
          />
        </div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 ring-1 ring-white/10 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-emerald-500/5" />

          <div className="relative flex flex-col items-center gap-5 text-center">
            
            <div className="flex items-center">
              <div className="group relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/60 to-pink-500/60 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-[3px] ring-purple-500/30">
                  {blend.creator.avatar ? (
                    <Image
                      src={proxiedImageUrl(blend.creator.avatar) || "/images/placeholder-song.svg"}
                      alt={blend.creator.name || "User"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-2xl font-black text-white">
                      {(blend.creator.name || "U")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="z-10 -mx-3 flex h-10 w-10 items-center justify-center rounded-full bg-card ring-2 ring-white/10">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>

              <div className="group relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/60 to-teal-500/60 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-[3px] ring-emerald-500/30">
                  {blend.invited.avatar ? (
                    <Image
                      src={proxiedImageUrl(blend.invited.avatar) || "/images/placeholder-song.svg"}
                      alt={blend.invited.name || "User"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-black text-white">
                      {(blend.invited.name || "U")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {blend.creator.name} <span className="text-white/30">&</span> {blend.invited.name}
              </h1>
              <p className="mt-1 text-sm text-white/35">{t("blendTitle")}</p>
            </div>

            
            {blend.matchPercentage != null && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/15 to-green-500/15 px-5 py-2 ring-1 ring-emerald-500/20"
              >
                <span className="text-xl font-black text-emerald-400">%{blend.matchPercentage}</span>
                <span className="text-xs text-emerald-400/60">uyum</span>
              </motion.div>
            )}

            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={deleting}
              onClick={deleteBlend}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-white/40 ring-1 ring-white/5 transition-all hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/20 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Blend&apos;i Sil
            </motion.button>
          </div>
        </motion.div>

        
        {blend.status === "PENDING" && isInvited && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] ring-1 ring-white/10 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-r from-purple-500/10 via-transparent to-emerald-500/10 p-8 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-1.5 text-xs font-medium text-purple-300 ring-1 ring-purple-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Blend Daveti
              </div>
              <p className="mb-2 text-lg font-bold text-white">{t("blendInviteReceived")}</p>
              <p className="mb-6 text-sm text-white/40">
                {blend.creator.name} seninle bir Blend oluşturmak istiyor
              </p>
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={actionLoading}
                  onClick={() => handleAction("accept")}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-7 py-3 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t("blendAccept")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={actionLoading}
                  onClick={() => handleAction("decline")}
                  className="flex items-center gap-2 rounded-full bg-white/5 px-7 py-3 font-bold text-white ring-1 ring-white/10 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  {t("blendDecline")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {blend.status === "PENDING" && !isInvited && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col items-center gap-3 rounded-3xl bg-white/[0.03] p-8 ring-1 ring-white/5"
          >
            <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1.5 ring-1 ring-yellow-500/15">
              <Clock className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{t("blendPending")}</span>
            </div>
            <p className="text-sm text-white/30">{otherUser.name} henüz yanıt vermedi</p>
          </motion.div>
        )}

        {blend.status === "DECLINED" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col items-center gap-2 rounded-3xl bg-red-500/5 p-8 ring-1 ring-red-500/10"
          >
            <p className="text-sm font-medium text-red-400">{t("blendDeclined")}</p>
          </motion.div>
        )}

        
        {blend.status === "ACCEPTED" && storyData && (
          <>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowStory(true)}
              className="group relative mb-6 w-full overflow-hidden rounded-3xl p-[1px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-500 opacity-60 transition-opacity group-hover:opacity-80" />
              <div className="relative flex items-center justify-center gap-3 rounded-3xl bg-card/90 px-6 py-5 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Play className="h-6 w-6 text-white" fill="white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Blend Story&apos;yi İzle</p>
                  <p className="text-xs text-white/40">Müzik uyumunuzu keşfedin</p>
                </div>
              </div>
            </motion.button>

            
            {blend.playlist && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/5"
              >
                <div className="flex items-center justify-between px-6 py-4">
                  <h2 className="text-base font-bold text-white">{blend.playlist.title}</h2>
                  <Link
                    href={`/playlist/${blend.playlist.id}`}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-emerald-500/30"
                  >
                    {t("blendGoToPlaylist")}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="px-3 pb-3">
                  {blend.playlist.songs.slice(0, 10).map((ps, i) => (
                    <motion.div
                      key={ps.song.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="w-5 text-right text-xs tabular-nums text-white/20 group-hover:text-white/40">{i + 1}</span>
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/5">
                        <Image
                          src={proxiedImageUrl(ps.song.coverImage, ps.song.audioUrl) || "/images/placeholder-song.svg"}
                          alt={ps.song.title}
                          fill
                          sizes="40px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{ps.song.title}</p>
                        <p className="truncate text-xs text-white/30">{ps.song.artist?.name}</p>
                      </div>
                    </motion.div>
                  ))}
                  {blend.playlist.songs.length > 10 && (
                    <Link
                      href={`/playlist/${blend.playlist.id}`}
                      className="mt-2 flex items-center justify-center gap-1 py-3 text-xs font-medium text-white/30 transition-colors hover:text-white/50"
                    >
                      +{blend.playlist.songs.length - 10} şarkı daha
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}
