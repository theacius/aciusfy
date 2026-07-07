"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useSession } from "next-auth/react";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { getGreeting } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { useSettingsStore } from "@/store/settingsStore";
import { SongType } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CinematicLabel } from "@/components/cinematic";
import { Play, PlusCircle, ChevronRight, Heart, Users, ListMusic } from "lucide-react";
import { SongContextMenu } from "@/components/ui/context-menu";
import { MagicCard } from "@/components/ui/magic-card";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { ACIUSFY_LOGO_PNG } from "@/lib/branding";
import { getAdSenseHomeSlot } from "@/lib/adsense";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import {
  DailyMixCover,
  CollageCover,
  WeeklyDiscoverCover,
  RadioCover,
  EditorialHeroCover,
  ChartCover,
} from "@/components/covers/PlaylistCovers";

interface QuickPlaylist {
  id: string;
  title: string;
  coverImage: string | null;
  songCovers: string[];
}

interface GeneratedMix {
  id: string;
  title: string;
  subtitle: string;
  coverType: "radio" | "editorial" | "chart" | "collage";
  coverImages: (string | null)[];
  artistNames: string[];
  songs: SongType[];
}

interface DailySection {
  id: string;
  urlSlug?: string;
  title: string;
  icon: string;
  genreLabel?: string;
  songs: SongType[];
  sectionType?: "artist" | "genre" | "popular";
  artistName?: string;
  limit?: number;
  genreTitle?: string;
}


function MixCard({
  section,
  index,
  onPlay,
  onOpen,
}: {
  section: DailySection;
  index: number;
  onPlay: () => void;
  onOpen: string;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const songCovers = section.songs.map((s) => s.coverImage).filter(Boolean) as string[];
  const genreLabel =
    section.sectionType === "artist" && section.artistName && section.limit != null
      ? `${section.artistName} - ${t("bestSongsFormat").replace("{n}", String(section.limit))}`
      : section.sectionType === "genre" && section.genreTitle
        ? `${section.genreTitle} ${t("mix")}`
        : section.sectionType === "popular"
          ? t("popularMix")
          : section.genreLabel ?? section.title;

  const subtitle = section.songs.slice(0, 3).map((s) => s.artist?.name).filter(Boolean).join(", ");

  const isDailyMix = !section.sectionType;
  const isArtistRadio = section.sectionType === "artist";
  const artistCovers = section.songs
    .map((s) => s.artist?.profileImage || s.coverImage)
    .filter(Boolean) as string[];

  function renderCover() {
    if (isDailyMix) {
      return <DailyMixCover index={index} coverImage={songCovers[0]} className="rounded-xl" />;
    }
    if (isArtistRadio && artistCovers.length >= 3) {
      return (
        <RadioCover
          coverImages={artistCovers.slice(0, 3)}
          artistName={section.artistName}
          subtitle={subtitle}
          accentIndex={index}
          className="rounded-xl"
        />
      );
    }
    if (songCovers.length >= 4) {
      return <CollageCover coverImages={songCovers.slice(0, 4)} accentIndex={index} label={genreLabel} className="rounded-xl" />;
    }
    return (
      <EditorialHeroCover
        coverImage={songCovers[0]}
        title={genreLabel}
        subtitle={subtitle}
        accentIndex={index}
        className="rounded-xl"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
    >
      <Link href={onOpen}>
        <div className="relative">
          {renderCover()}
          <div className="absolute bottom-3 right-3 z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
            >
              <Play className="h-5 w-5 fill-black text-black" />
            </motion.button>
          </div>
        </div>
      </Link>
      <p className="mt-2 truncate text-[13px] font-bold text-white">{genreLabel}</p>
      <p className="truncate text-[11px] text-white/50">
        {subtitle || (
          <span className="flex items-center gap-1">
            <span className="relative inline-block h-3.5 w-3.5 overflow-hidden rounded-sm">
              <Image src={ACIUSFY_LOGO_PNG} alt="" fill sizes="14px" className="object-contain" />
            </span>
            {session?.user?.name
              ? `${session.user.name} ${t("forYouCompiled") ?? "için derlendi"}`
              : t("forYouCompiled") ?? "Senin için derlendi"
            }
          </span>
        )}
      </p>
    </motion.div>
  );
}

function SongSquareCard({
  song,
  index,
  title,
  subtitle,
  onPlay,
  onAddQueue,
  openModal,
}: {
  song: SongType;
  index: number;
  title?: string;
  subtitle?: string;
  onPlay: () => void;
  onAddQueue: () => void;
  openModal: () => void;
}) {
  const { t } = useTranslation();
  return (
    <SongContextMenu song={song}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
      >
        <MagicCard onClick={openModal} className="cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]" imageUrl={proxiedImageUrl(song.coverImage, song.audioUrl) ?? undefined}>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-card-hover transition-all duration-200 group-hover:bg-border">
            <Image
              src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
              alt={song.title}
              fill
              sizes="180px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onAddQueue(); }}
                className="rounded-full bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30"
              >
                <PlusCircle className="h-5 w-5 text-white" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/40"
              >
                <Play className="h-6 w-6 fill-black text-black" />
              </motion.button>
            </div>
          </div>
        </MagicCard>
        <p className="mt-2 truncate font-semibold text-white">{title ?? song.title}</p>
        <p className="truncate text-xs text-muted">{subtitle ?? song.artist?.name ?? t("unknown")}</p>
      </motion.div>
    </SongContextMenu>
  );
}

function QuickPlaylistCard({ playlist }: { playlist: QuickPlaylist }) {
  const covers = playlist.coverImage
    ? [playlist.coverImage]
    : playlist.songCovers;

  return (
    <Link href={`/playlist/${playlist.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.98 }}
        className="flex h-[52px] min-w-0 items-center gap-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.04] transition-all"
      >
        <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-l-md">
          {covers.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
              <ListMusic className="h-5 w-5 text-white/30" />
            </div>
          ) : (
            <Image
              src={proxiedImageUrl(covers[0]) || "/images/placeholder-song.svg"}
              alt={playlist.title}
              fill
              sizes="52px"
              className="object-cover"
            />
          )}
        </div>
        <span className="min-w-0 flex-1 truncate px-3 text-[13px] font-bold text-white">
          {playlist.title}
        </span>
      </motion.div>
    </Link>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="group/scroll relative -mx-3 px-3 sm:-mx-6 sm:px-6">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-md backdrop-blur-sm transition-all group-hover/scroll:opacity-100 hover:bg-black/90 hover:scale-110"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      )}
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-md backdrop-blur-sm transition-all group-hover/scroll:opacity-100 hover:bg-black/90 hover:scale-110"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const openSongModal = useModalStore((s) => s.openSongModal);

  const [dailySections, setDailySections] = useState<DailySection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [recommendations, setRecommendations] = useState<SongType[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SongType[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [filter, setFilter] = useState<"all" | "music">("all");
  const [friendsActivity, setFriendsActivity] = useState<
    { userId: string; userName: string | null; userAvatar: string | null; song: SongType; playedAt: string }[]
  >([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [showFriendsSection, setShowFriendsSection] = useState(true);
  const [moods, setMoods] = useState<{ id: string; name: string; slug: string; color: string }[]>([]);
  const [loadingMoods, setLoadingMoods] = useState(true);
  const [quickPlaylists, setQuickPlaylists] = useState<QuickPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [generatedMixes, setGeneratedMixes] = useState<GeneratedMix[]>([]);
  const [loadingMixes, setLoadingMixes] = useState(true);
  const [continueSongs, setContinueSongs] = useState<SongType[]>([]);
  const [loadingContinue, setLoadingContinue] = useState(false);

  const allowExplicit = useSettingsStore((s) => s.allowExplicit);

  const refetchHomeData = useCallback(() => {
    fetch("/api/home-sections")
      .then((r) => r.json())
      .then((data) => setDailySections(Array.isArray(data) ? data : []))
      .catch(() => setDailySections([]));
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const filtered = allowExplicit ? arr : arr.filter((s: { isExplicit?: boolean }) => !s.isExplicit);
        setRecommendations(filtered);
      })
      .catch(() => setRecommendations([]));
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setRecentlyPlayed(Array.isArray(data) ? data : []))
      .catch(() => setRecentlyPlayed([]));
    fetch("/api/moods")
      .then((r) => r.json())
      .then((data) => setMoods(Array.isArray(data) ? data : []))
      .catch(() => setMoods([]));
    fetch("/api/activity/friends")
      .then((r) => r.json())
      .then((data) => {
        setFriendsActivity(data?.activities ?? []);
        setShowFriendsSection(data?.hideSection !== true);
      })
      .catch(() => {
        setFriendsActivity([]);
        setShowFriendsSection(true);
      });
  }, [allowExplicit]);

  useEffect(() => {
    if (!session?.user?.id) { setLoadingPlaylists(false); return; }
    setLoadingPlaylists(true);
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => {
        const raw = data?.playlists ?? [];
        const mapped: QuickPlaylist[] = raw.map((p: { id: string; title: string; coverImage: string | null; songs?: { song?: { coverImage?: string | null } }[] }) => {
          const songCovers = (p.songs ?? [])
            .map((ps: { song?: { coverImage?: string | null } }) => ps.song?.coverImage)
            .filter(Boolean) as string[];
          return { id: p.id, title: p.title, coverImage: p.coverImage, songCovers: songCovers.slice(0, 4) };
        });
        setQuickPlaylists(mapped.slice(0, 8));
      })
      .catch(() => setQuickPlaylists([]))
      .finally(() => setLoadingPlaylists(false));
  }, [session?.user?.id]);

  useEffect(() => {
    setLoadingSections(true);
    fetch("/api/home-sections")
      .then((r) => r.json())
      .then((data) => setDailySections(Array.isArray(data) ? data : []))
      .catch(() => setDailySections([]))
      .finally(() => setLoadingSections(false));
  }, []);

  useEffect(() => {
    setLoadingRecs(true);
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const filtered = allowExplicit ? arr : arr.filter((s: { isExplicit?: boolean }) => !s.isExplicit);
        setRecommendations(filtered);
      })
      .catch(() => setRecommendations([]))
      .finally(() => setLoadingRecs(false));
  }, [allowExplicit]);

  useEffect(() => {
    setLoadingRecent(true);
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setRecentlyPlayed(Array.isArray(data) ? data : []))
      .catch(() => setRecentlyPlayed([]))
      .finally(() => setLoadingRecent(false));
  }, []);

  useEffect(() => {
    setLoadingMoods(true);
    fetch("/api/moods")
      .then((r) => r.json())
      .then((data) => setMoods(Array.isArray(data) ? data : []))
      .catch(() => setMoods([]))
      .finally(() => setLoadingMoods(false));
  }, []);

  useEffect(() => {
    setLoadingFriends(true);
    fetch("/api/activity/friends")
      .then((r) => r.json())
      .then((data) => {
        setFriendsActivity(data?.activities ?? []);
        setShowFriendsSection(data?.hideSection !== true);
      })
      .catch(() => {
        setFriendsActivity([]);
        setShowFriendsSection(true);
      })
      .finally(() => setLoadingFriends(false));
  }, []);

  useEffect(() => {
    setLoadingMixes(true);
    fetch("/api/generated-mixes?limit=10")
      .then((r) => r.json())
      .then((data) => setGeneratedMixes(Array.isArray(data) ? data : []))
      .catch(() => setGeneratedMixes([]))
      .finally(() => setLoadingMixes(false));
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setContinueSongs([]);
      return;
    }
    setLoadingContinue(true);
    fetch("/api/discover/continue")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const filtered = allowExplicit ? arr : arr.filter((s: { isExplicit?: boolean }) => !s.isExplicit);
        setContinueSongs(filtered);
      })
      .catch(() => setContinueSongs([]))
      .finally(() => setLoadingContinue(false));
  }, [session?.user?.id, allowExplicit]);

  useRefreshInterval(refetchHomeData, 300_000, true);

  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const playSong = useCallback(
    (songs: SongType[], index: number) => {
      const song = songs[index];
      clearPlaylistPlayback();
      setActiveSong(song);
    },
    [setActiveSong, clearPlaylistPlayback]
  );


  const profile = useUserProfile();
  const userName = profile?.name ?? session?.user?.name ?? "Sen";
  const greeting = getGreeting();

  return (
    <div className="space-y-10 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <CinematicLabel>{t("mainMenu")}</CinematicLabel>
        <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          {greeting}
          {userName ? (
            <span className="text-muted">, {userName}</span>
          ) : null}
        </h1>
      </motion.div>

      
      <div className="flex gap-2">
        {[
          { id: "all" as const, label: "Tümü" },
          { id: "music" as const, label: "Müzik" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.12em] transition-all ${
              filter === f.id
                ? "bg-foreground text-background"
                : "border border-white/10 text-muted hover:border-white/25 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      
      {session?.user && (quickPlaylists.length > 0 || loadingPlaylists) && (
        loadingPlaylists ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[56px] animate-pulse rounded-md bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {quickPlaylists.map((pl) => (
              <QuickPlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        )
      )}

      
      {loadingSections ? (
        <HorizontalScroll>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
          ))}
        </HorizontalScroll>
      ) : (
        <HorizontalScroll>
          
          {session?.user && (recommendations.length > 0 || loadingRecs) && (
            <div className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl">
              <Link href="/recommendations">
                <div className="relative">
                  {loadingRecs ? (
                    <div className="aspect-square animate-pulse rounded-xl bg-white/5" />
                  ) : (
                    <CollageCover
                      coverImages={recommendations.slice(0, 4).map((s) => s.coverImage)}
                      accentIndex={0}
                      label={t("dailyMix") ?? "Günün Karışımı"}
                      className="rounded-xl"
                    />
                  )}
                  <div className="absolute bottom-3 right-3 z-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (recommendations[0]) playSong(recommendations, 0);
                      }}
                      disabled={loadingRecs || !recommendations[0]}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 disabled:pointer-events-none disabled:opacity-0"
                    >
                      <Play className="h-5 w-5 fill-black text-black" />
                    </motion.button>
                  </div>
                </div>
              </Link>
              <p className="mt-2 truncate text-[13px] font-bold text-white">{t("dailyMix") ?? "Günün Karışımı"}</p>
              <p className="truncate text-[11px] text-white/50">{t("forYouCompiled")}</p>
            </div>
          )}

          
          {session?.user && recommendations.length > 0 && (
            <div className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl">
              <Link href="/recommendations">
                <div className="relative">
                  <WeeklyDiscoverCover
                    variant={new Date().getDay() % 4}
                    className="rounded-xl"
                  />
                  <div className="absolute bottom-3 right-3 z-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (recommendations[0]) playSong(recommendations, 0);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                    >
                      <Play className="h-5 w-5 fill-black text-black" />
                    </motion.button>
                  </div>
                </div>
              </Link>
              <p className="mt-2 truncate text-[13px] font-bold text-white">{t("weeklyDiscover") ?? "Haftalık Keşif"}</p>
              <p className="truncate text-[11px] text-white/50">{t("forYouCompiled")}</p>
            </div>
          )}

          {dailySections.slice(0, 7).map((section, i) => (
            <MixCard
              key={`quick-${i}-${section.id}`}
              section={section}
              index={i}
              onPlay={() => section.songs[0] && playSong(section.songs, 0)}
              onOpen={`/section/${section.urlSlug ?? section.id}`}
            />
          ))}
          
          <Link href="/library?tab=liked" className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-[#7856ff] to-[#4d21b3]">
              <div className="flex h-full w-full items-center justify-center">
                <Heart className="h-14 w-14 fill-white text-white/80" />
              </div>
              <div className="absolute bottom-3 right-3 z-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                >
                  <Play className="h-5 w-5 fill-black text-black" />
                </motion.button>
              </div>
            </div>
            <p className="mt-2 truncate text-[13px] font-bold text-white">{t("likedSongs")}</p>
            <p className="truncate text-[11px] text-white/50">{t("playlistLabel")}</p>
          </Link>
        </HorizontalScroll>
      )}

      
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white">{userName} {t("forYouCompiled")}</h2>
          <Link href="/recommendations" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-white hover:underline">
            {t("showAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <HorizontalScroll>
          {dailySections.map((section, i) => (
            <MixCard
              key={`section-${i}-${section.id}`}
              section={section}
              index={i}
              onPlay={() => section.songs[0] && playSong(section.songs, 0)}
              onOpen={`/section/${section.urlSlug ?? section.id}`}
            />
          ))}
        </HorizontalScroll>
      </section>

      
      {dailySections.filter((s) => s.sectionType === "genre").length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">{t("topHitsToday") ?? "Bugünün en çok dinlenenleri"}</h2>
            <Link href="/search" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-white hover:underline">
              {t("showAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <HorizontalScroll>
            {dailySections
              .filter((s) => s.sectionType === "genre" || s.sectionType === "popular")
              .slice(0, 8)
              .map((section, i) => {
                const covers = section.songs.map((s) => s.coverImage).filter(Boolean) as string[];
                const sub = section.songs.slice(0, 3).map((s) => s.artist?.name).filter(Boolean).join(", ");
                const label = section.genreTitle
                  ? `${section.genreTitle} ${t("mix")}`
                  : section.title;
                return (
                  <motion.div
                    key={`chart-${i}-${section.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
                  >
                    <Link href={`/section/${section.urlSlug ?? section.id}`}>
                      <div className="relative">
                        <ChartCover
                          coverImage={covers[0]}
                          title={label}
                          subtitle={sub}
                          accentIndex={i}
                          className="rounded-xl"
                        />
                        <div className="absolute bottom-3 right-3 z-10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (section.songs[0]) playSong(section.songs, 0);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                          >
                            <Play className="h-5 w-5 fill-black text-black" />
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                    <p className="mt-2 truncate text-[13px] font-bold text-white">{label}</p>
                    <p className="truncate text-[11px] text-white/50">{sub}</p>
                  </motion.div>
                );
              })}
          </HorizontalScroll>
        </section>
      )}

      
      {(generatedMixes.length > 0 || loadingMixes) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">{t("radioAndMixes") ?? "Radyo ve Mix'ler"}</h2>
          </div>
          {loadingMixes ? (
            <HorizontalScroll>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll>
              {generatedMixes.map((mix, i) => {
                const covers = (mix.coverImages ?? []).filter(Boolean) as string[];
                const artistLabel = mix.artistNames?.slice(0, 3).join(", ");
                const moreSuffix = (mix.artistNames?.length ?? 0) > 3
                  ? ` ${t("andMore") ?? "ve daha fazlası"}`
                  : "";

                return (
                  <motion.div
                    key={`mix-${mix.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
                  >
                    <Link href={`/section/${mix.id}`}>
                      <div className="relative">
                        {mix.coverType === "radio" && covers.length >= 3 ? (
                          <RadioCover
                            coverImages={covers.slice(0, 3)}
                            artistName={mix.artistNames?.[0]}
                            subtitle={`${artistLabel}${moreSuffix}`}
                            accentIndex={i}
                            className="rounded-xl"
                          />
                        ) : mix.coverType === "editorial" ? (
                          <EditorialHeroCover
                            coverImage={covers[0]}
                            title={mix.title}
                            subtitle={mix.subtitle}
                            accentIndex={i}
                            className="rounded-xl"
                          />
                        ) : mix.coverType === "chart" ? (
                          <ChartCover
                            coverImage={covers[0]}
                            title={mix.title}
                            subtitle={mix.subtitle}
                            accentIndex={i}
                            className="rounded-xl"
                          />
                        ) : (
                          <CollageCover
                            coverImages={covers.slice(0, 4)}
                            accentIndex={i}
                            label={mix.title}
                            className="rounded-xl"
                          />
                        )}
                        <div className="absolute bottom-3 right-3 z-10">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (mix.songs?.[0]) playSong(mix.songs, 0);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                          >
                            <Play className="h-5 w-5 fill-black text-black" />
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                    <p className="mt-2 truncate text-[13px] font-bold text-white">{mix.title}</p>
                    <p className="truncate text-[11px] text-white/50">{mix.subtitle}</p>
                  </motion.div>
                );
              })}
            </HorizontalScroll>
          )}
        </section>
      )}

      
      {(moods.length > 0 || loadingMoods) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">{t("moodCategories") ?? "Ruh haline göre"}</h2>
          </div>
          {loadingMoods ? (
            <HorizontalScroll>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll>
              {moods.map((mood) => (
                <Link
                  key={mood.id}
                  href={`/section/mood-${mood.slug}`}
                  className="group relative w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
                >
                  <MagicCard className="cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]">
                    <div
                      className="relative aspect-square overflow-hidden rounded-xl transition-colors duration-200 group-hover:brightness-110"
                      style={{ background: `linear-gradient(135deg, ${mood.color}99, ${mood.color}44)` }}
                    />
                  </MagicCard>
                  <p className="mt-2 truncate font-semibold text-white">{mood.name}</p>
                  <p className="truncate text-xs text-muted">{t("moodMix") ?? "Ruh hali mix"}</p>
                </Link>
              ))}
            </HorizontalScroll>
          )}
        </section>
      )}

      
      {showFriendsSection && (friendsActivity.length > 0 || loadingFriends) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <Users className="h-5 w-5" />
              {t("friendsActivity")}
            </h2>
          </div>
          {loadingFriends ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg bg-white/5 px-4 py-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="h-4 flex-1 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : friendsActivity.length > 0 ? (
            <div className="space-y-1">
              {friendsActivity.slice(0, 10).map((act, idx) => {
                const s = act.song as { id: string; title: string; duration: number; coverImage: string | null; audioUrl: string; artist?: { id: string; name: string } | null };
                const song: SongType = {
                  ...s,
                  artistId: s.artist?.id ?? "",
                  albumId: null,
                  genreId: null,
                  previewVideoUrl: null,
                  playCount: 0,
                  isPublished: true,
                  createdAt: new Date(),
                  artist: s.artist ? { id: s.artist.id, name: s.artist.name, userId: "", bio: null, profileImage: null, bannerImage: null, verified: false, monthlyListeners: 0, createdAt: new Date() } : undefined,
                  album: undefined,
                };
                return (
                  <SongContextMenu key={`friend-${idx}-${act.userId}-${song.id}`} song={song}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => playSong([song], 0)}
                      className="group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                        {act.userAvatar ? (
                          <Image src={act.userAvatar} alt={act.userName || "User"} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/10">
                            <Users className="h-5 w-5 text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-muted">
                          <span className="font-medium text-white">{act.userName ?? t("user")}</span> {t("listenedTo")}{" "}
                          <span className="text-white">{song.title}</span>
                          {song.artist?.name && (
                            <span className="text-muted"> · {song.artist.name}</span>
                          )}
                        </p>
                      </div>
                      <Play className="h-4 w-4 flex-shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </motion.div>
                  </SongContextMenu>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
              <p className="text-sm text-muted">{t("noFriendsActivity")}</p>
              <p className="mt-1 text-xs text-muted">{t("friendsActivityHint")}</p>
            </div>
          )}
        </section>
      )}

      
      {session?.user && (continueSongs.length > 0 || loadingContinue) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">{t("homeDiscoverUniqueTitle")}</h2>
              <p className="text-xs text-muted">{t("homeDiscoverUniqueSubtitle")}</p>
            </div>
            <Link href="/recently-played" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-white hover:underline">
              {t("showAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingContinue ? (
            <HorizontalScroll>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll>
              {continueSongs.map((song, idx) => (
                <SongSquareCard
                  key={`cont-${idx}-${song.id}`}
                  song={song}
                  index={idx}
                  onPlay={() => playSong(continueSongs, idx)}
                  onAddQueue={() => addToQueueWithSimilar(song)}
                  openModal={() => openSongModal(song)}
                />
              ))}
            </HorizontalScroll>
          )}
        </section>
      )}

      
      {(recentlyPlayed.length > 0 || loadingRecent) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">{t("recentlyPlayed")}</h2>
            <Link href="/recently-played" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-white hover:underline">
              {t("showAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingRecent ? (
            <HorizontalScroll>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll>
              {recentlyPlayed.slice(0, 12).map((song, idx) => (
                <SongSquareCard
                  key={`recent-${idx}-${song.id}`}
                  song={song}
                  index={idx}
                  onPlay={() => playSong(recentlyPlayed, idx)}
                  onAddQueue={() => addToQueueWithSimilar(song)}
                  openModal={() => openSongModal(song)}
                />
              ))}
            </HorizontalScroll>
          )}
        </section>
      )}

      
      {(loadingRecs || recommendations.length > 0) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white">{t("forYouRecommendations")}</h2>
            <Link href="/recommendations" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-white hover:underline">
              {t("showAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingRecs ? (
            <HorizontalScroll>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[180px] w-[180px] flex-shrink-0 animate-pulse rounded-xl bg-white/5" />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll>
              {recommendations.slice(0, 12).map((song, idx) => (
                <SongSquareCard
                  key={`rec-${idx}-${song.id}`}
                  song={song}
                  index={idx}
                  onPlay={() => playSong(recommendations, idx)}
                  onAddQueue={() => addToQueueWithSimilar(song)}
                  openModal={() => openSongModal(song)}
                />
              ))}
            </HorizontalScroll>
          )}
        </section>
      )}

      <AdSenseUnit
        adSlot={getAdSenseHomeSlot()}
        className="mx-auto mt-8 w-full max-w-4xl min-h-[100px] overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-2"
      />
    </div>
  );
}

