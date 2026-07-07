import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { showErrorToast } from "@/store/toastStore";
import Image from "next/image";
import Link from "next/link";
import { Play, Shuffle, ChevronLeft, Music, PlusCircle, BookmarkPlus, BookmarkCheck, Loader2, ListMusic } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ShineButton } from "@/components/ui/shine-button";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { formatDuration } from "@/lib/utils";
import { SongContextMenu } from "@/components/ui/context-menu";
import { useSettingsStore } from "@/store/settingsStore";
import {
  DailyMixCover,
  CollageCover,
  RadioCover,
  EditorialHeroCover,
  ChartCover,
} from "@/components/covers/PlaylistCovers";
import type { SongType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { ACIUSFY_LOGO_PNG } from "@/lib/branding";

const KNOWN_MIX_IDS = new Set([
  "top-50-turkiye", "top-50-global", "viral-hits", "turkce-rap-hits", "pop-hits", "rock-classics",
  "rap-x-pop", "rock-x-electronic", "rnb-x-hiphop", "turkce-pop-x-arabesk", "lofi-x-jazz",
]);

interface SectionData {
  id: string;
  title: string;
  icon: string;
  genreLabel: string;
  songs: SongType[];
  sectionType?: "artist" | "genre" | "popular";
  artistName?: string;
  limit?: number;
  genreTitle?: string;
  coverType?: "radio" | "editorial" | "chart" | "collage";
  coverImages?: (string | null)[];
  artistNames?: string[];
}

export default function SectionPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [section, setSection] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setPlaylistPlayback = useQueueStore((s) => s.setPlaylistPlayback);
  const playlistPlayback = useQueueStore((s) => s.playlistPlayback);
  const isInQueue = useQueueStore((s) => s.isInQueue);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const openSongModal = useModalStore((s) => s.openSongModal);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const strId = typeof id === "string" ? id : "";
    const isMood = strId.startsWith("mood-");
    const isGeneratedMix = strId.startsWith("radio-") || strId.startsWith("this-is-") || strId.startsWith("top-") || strId.startsWith("viral-") || strId.startsWith("rap-x-") || strId.startsWith("rock-x-") || strId.startsWith("rnb-x-") || strId.startsWith("pop-x-") || strId.startsWith("lofi-x-") || strId.startsWith("turkce-pop-x-") || KNOWN_MIX_IDS.has(strId);

    const url = isMood
      ? `/api/moods/${encodeURIComponent(strId.replace(/^mood-/, ""))}`
      : isGeneratedMix
        ? `/api/generated-mixes?id=${encodeURIComponent(strId)}`
        : `/api/home-sections?sectionId=${encodeURIComponent(strId)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMood && data?.songs != null) {
          setSection({
            id: data.id ?? id,
            title: data.name ?? id,
            icon: "heart",
            genreLabel: data.name ?? "",
            songs: data.songs ?? [],
            sectionType: "genre",
            genreTitle: data.name,
          });
        } else if (isGeneratedMix && data?.songs != null) {
          setSection({
            id: data.id ?? id,
            title: data.title ?? id,
            icon: "music",
            genreLabel: data.subtitle ?? "",
            songs: data.songs ?? [],
            sectionType: "genre",
            genreTitle: data.title,
            coverType: data.coverType,
            coverImages: data.coverImages,
            artistNames: data.artistNames,
          });
        } else {
          setSection(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const refetchSaved = useCallback(() => {
    if (!session?.user || !id) return;
    const isMood = typeof id === "string" && id.startsWith("mood-");
    if (isMood) return;
    fetch("/api/saved-sections")
      .then((r) => r.json())
      .then((list) => setIsSaved(Array.isArray(list) && list.some((s: { sectionId: string }) => s.sectionId === id)))
      .catch(() => showErrorToast(t("loadError")));
  }, [session?.user, id]);

  useEffect(() => {
    refetchSaved();
  }, [refetchSaved]);

  useRefreshInterval(refetchSaved, 5000, !!session?.user && !!id && typeof id === "string" && !id.startsWith("mood-"));

  const songs = section?.songs ?? [];

  const handlePlaySong = (song: SongType, index: number) => {
    setPlaylistPlayback(id!, songs, index, section?.title);
    setActiveSong(song);
  };

  const handlePlayAll = () => {
    if (!songs.length) return;
    setPlaylistPlayback(id!, songs, 0, section?.title);
    setActiveSong(songs[0]);
  };

  const handleShufflePlay = () => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setPlaylistPlayback(id!, shuffled, 0, section?.title);
    setActiveSong(shuffled[0]);
  };

  const getSectionTitle = () => {
    if (!section) return "";
    if (section.sectionType === "artist" && section.artistName && section.limit != null) {
      return `${section.artistName} - ${t("bestSongsFormat").replace("{n}", String(section.limit))}`;
    }
    if (section.sectionType === "genre" && section.genreTitle) return `${section.genreTitle} ${t("mix")}`;
    if (section.sectionType === "popular") return t("popularMix");
    return section.title;
  };

  const handleSaveToLibrary = async () => {
    if (!session?.user || !id || saveLoading) return;
    const title = getSectionTitle();
    if (!title?.trim()) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/saved-sections?sectionId=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Kaldırılamadı");
        setIsSaved(false);
      } else {
        const res = await fetch("/api/saved-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: id,
            title,
            coverImage: songs[0]?.coverImage ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Eklenemedi");
        setIsSaved(true);
      }
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
    } catch (err) {
      devError(err);
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-end gap-6">
          <div className="h-56 w-56 flex-shrink-0 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-16 rounded bg-white/5" />
            <div className="h-10 w-64 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-32 rounded-full bg-white/5" />
          <div className="h-12 w-12 rounded-full bg-white/5" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-8 rounded bg-white/5" />
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-4 flex-1 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!section || songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted">{t("sectionNotFound")}</p>
        <Link
          href="/home"
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  const sec = section;
  const firstCover = songs[0]?.coverImage;
  const totalDuration = songs.reduce((sum, s) => sum + (s.duration ?? 0), 0);

  const songCovers = songs.map((s) => s.coverImage).filter(Boolean) as string[];
  const artistCovers = songs
    .map((s) => s.artist?.profileImage || s.coverImage)
    .filter(Boolean) as string[];

  const sectionTitle = getSectionTitle();
  const subtitle = songs.slice(0, 3).map((s) => s.artist?.name).filter(Boolean).join(", ");

  function renderSectionCover() {
    const strId = typeof id === "string" ? id : "";
    const isGeneratedMix = strId.startsWith("radio-") || strId.startsWith("this-is-") || KNOWN_MIX_IDS.has(strId) || !!sec.coverType;

    if (isGeneratedMix && sec.coverType) {
      const covers = (sec.coverImages ?? []).filter(Boolean) as string[];
      if (sec.coverType === "radio" && covers.length >= 3) {
        return <RadioCover coverImages={covers.slice(0, 3)} artistName={sec.artistNames?.[0]} subtitle={subtitle} accentIndex={0} className="h-full w-full rounded-xl" />;
      }
      if (sec.coverType === "chart") {
        return <ChartCover coverImage={covers[0]} title={sectionTitle} subtitle={sec.genreLabel} accentIndex={0} className="h-full w-full rounded-xl" />;
      }
      if (sec.coverType === "editorial") {
        return <EditorialHeroCover coverImage={covers[0]} title={sectionTitle} subtitle={sec.genreLabel} accentIndex={0} className="h-full w-full rounded-xl" />;
      }
      if (sec.coverType === "collage" && covers.length >= 4) {
        return <CollageCover coverImages={covers.slice(0, 4)} accentIndex={0} label={sectionTitle} className="h-full w-full rounded-xl" />;
      }
    }

    if (sec.sectionType === "artist" && artistCovers.length >= 3) {
      return <RadioCover coverImages={artistCovers.slice(0, 3)} artistName={sec.artistName} subtitle={subtitle} accentIndex={0} className="h-full w-full rounded-xl" />;
    }

    if (sec.sectionType === "genre" && songCovers.length >= 4) {
      return <CollageCover coverImages={songCovers.slice(0, 4)} accentIndex={0} label={sectionTitle} className="h-full w-full rounded-xl" />;
    }

    if (songCovers.length >= 4) {
      return <CollageCover coverImages={songCovers.slice(0, 4)} accentIndex={0} label={sectionTitle} className="h-full w-full rounded-xl" />;
    }

    if (firstCover) {
      return <EditorialHeroCover coverImage={firstCover} title={sectionTitle} subtitle={subtitle} accentIndex={0} className="h-full w-full rounded-xl" />;
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl">
        <Music className="h-20 w-20 text-white/60" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <Link
            href="/home"
            className="absolute left-0 top-0 rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="relative h-56 w-56 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
            {renderSectionCover()}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              {t("mix")}
            </p>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              {section.sectionType === "artist" && section.artistName && section.limit != null
                ? `${section.artistName} - ${t("bestSongsFormat").replace("{n}", String(section.limit))}`
                : section.sectionType === "genre" && section.genreTitle
                  ? `${section.genreTitle} ${t("mix")}`
                  : section.sectionType === "popular"
                    ? t("popularMix")
                    : section.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted sm:justify-start">
              <div className="flex items-center gap-2 font-semibold text-white">
                <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={ACIUSFY_LOGO_PNG}
                    alt="Aciusfy"
                    fill
                    sizes="48px"
                    className="object-contain"
                    quality={100}
                  />
                </div>
                {session?.user?.id ? (
                  (() => {
                    const fmt = t("preparedFor") ?? "{name} için hazırlandı";
                    const [prefix, suffix] = fmt.split("{name}");
                    const name = session.user.name ?? (t("you") ?? "Senin");
                    return (
                      <>
                        {prefix && <span className="text-muted">{prefix}</span>}
                        <Link
                          href={`/profile/${(session.user as { username?: string | null }).username || session.user.id}`}
                          className="transition-opacity hover:opacity-80 hover:underline"
                        >
                          {name}
                        </Link>
                        {suffix && <span className="text-muted">{suffix}</span>}
                      </>
                    );
                  })()
                ) : (
                  (() => {
                    const fmt = t("preparedFor") ?? "{name} için hazırlandı";
                    const [prefix, suffix] = fmt.split("{name}");
                    const name = t("you") ?? "Senin";
                    return (
                      <>
                        {prefix && <span className="text-muted">{prefix}</span>}
                        <span>{name}</span>
                        {suffix && <span className="text-muted">{suffix}</span>}
                      </>
                    );
                  })()
                )}
              </div>
              <span>&middot;</span>
              <span>{songs.length} {t("song")}</span>
              <span>&middot;</span>
              <span>{Math.floor(totalDuration / 60)} {t("min")}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex items-center gap-4">
          <ShineButton size="lg" variant="primary" onClick={handlePlayAll}>
            <span className="flex items-center gap-2">
              <Play className="h-5 w-5 fill-white" />
              {t("playAll")}
            </span>
          </ShineButton>
          <button
            onClick={handleShufflePlay}
            className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-white"
            title={t("shuffle")}
          >
            <Shuffle className="h-5 w-5" />
          </button>
          {session?.user && (
            <button
              onClick={handleSaveToLibrary}
              disabled={saveLoading}
              className={`rounded-full p-3 transition-colors disabled:opacity-70 ${
                isSaved
                  ? "bg-accent/20 text-accent hover:bg-accent/30"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-accent"
              }`}
              title={isSaved ? (t("removeFromLibrary") ?? "Kütüphaneden kaldır") : (t("saveToLibrary") ?? "Kütüphaneme kaydet")}
            >
              {saveLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <BookmarkPlus className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="rounded-xl">
          <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 border-b border-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted">
            <span className="w-8 text-center">#</span>
            <span className="w-10" />
            <span>{t("title")}</span>
            <span className="flex items-center">
              <Music className="h-4 w-4" />
            </span>
          </div>
          {songs.map((song, index) => (
            <SongContextMenu key={song.id} song={song}>
              <div
                onClick={() => handlePlaySong(song, index)}
                className="group grid cursor-pointer grid-cols-[auto_auto_1fr_auto] items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
              >
                <span className="w-8 text-center text-sm text-muted group-hover:hidden">
                  {index + 1}
                </span>
                <Play className="hidden h-4 w-4 w-8 text-center text-white group-hover:block" />
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  <Image
                    src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
                    alt={song.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{song.title}</p>
                    <p className="text-xs text-muted">
                      {song.artist?.name ?? t("unknownArtist")}
                    </p>
                  </div>
                  {playlistPlayback?.playlistId === id && playlistPlayback.songs[playlistPlayback.currentIndex]?.id === song.id && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      {t("nowPlaying")}
                    </span>
                  )}
                  {isInQueue(song.id) && (
                    <span className="flex shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-muted" title={t("queue")}>
                      <ListMusic className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueueWithSimilar(song);
                    }}
                    className="rounded-full p-2 text-muted opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </div>
            </SongContextMenu>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
