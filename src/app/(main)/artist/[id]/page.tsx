import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Heart,
  UserPlus,
  CheckCircle2,
  Loader2,
  UserCheck,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ShineButton } from "@/components/ui/shine-button";
import { ArtistInfoSlider } from "@/components/artist/ArtistInfoSlider";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useTranslation } from "@/hooks/useTranslation";
import { showErrorToast } from "@/store/toastStore";
import { formatDuration, formatPlayCount } from "@/lib/utils";
import type { SongType, ArtistType, AlbumType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

interface ArtistData extends ArtistType {
  songs: SongType[];
  albums: (AlbumType & { _count?: { songs: number } })[];
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [savedAlbumIds, setSavedAlbumIds] = useState<Set<string>>(new Set());
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setPlaylistPlayback = useQueueStore((s) => s.setPlaylistPlayback);

  const refetchArtist = useCallback(
    (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      Promise.all([
        fetch(`/api/artists/${id}`).then(async (r) => {
          const data = await r.json();
          if (!r.ok || data?.error) return null;
          return data;
        }),
        fetch("/api/follow").then((r) => r.json()).catch(() => { showErrorToast(t("loadError")); return []; }),
        fetch("/api/saved-albums").then((r) => r.json()).catch(() => { showErrorToast(t("loadError")); return []; }),
      ])
        .then(([artistData, followedArtists, savedAlbums]) => {
          setArtist(artistData);
          if (Array.isArray(followedArtists) && artistData) {
            setFollowing(followedArtists.some((a: ArtistType) => a.id === id));
          }
          if (Array.isArray(savedAlbums)) {
            setSavedAlbumIds(new Set(savedAlbums.map((a: AlbumType) => a.id)));
          }
        })
        .catch(() => {})
        .finally(() => !silent && setLoading(false));
    },
    [id]
  );

  useEffect(() => {
    refetchArtist();
  }, [refetchArtist]);

  useRefreshInterval(() => refetchArtist(true), 5000, !!id);

  const enrichSong = useCallback(
    (song: SongType): SongType =>
      song.artist
        ? song
        : {
            ...song,
            artist: {
              id: artist?.id ?? String(id),
              userId: artist?.userId ?? "",
              name: artist?.name ?? "",
              bio: artist?.bio ?? null,
              profileImage: artist?.profileImage ?? null,
              bannerImage: artist?.bannerImage ?? null,
              verified: artist?.verified ?? false,
              monthlyListeners: artist?.monthlyListeners ?? 0,
              createdAt: artist?.createdAt ?? new Date(),
            },
          },
    [artist, id],
  );

  const handlePlaySong = (song: SongType, index: number) => {
    if (!artist) return;
    const list = artist.songs.map(enrichSong);
    setPlaylistPlayback(`artist-${id}`, list, index, artist.name);
    setActiveSong(enrichSong(song));
  };

  const handlePlayAll = () => {
    if (!artist?.songs.length) return;
    const list = artist.songs.map(enrichSong);
    setPlaylistPlayback(`artist-${id}`, list, 0, artist.name);
    setActiveSong(list[0]!);
  };

  const handleFollow = async () => {
    if (!id || followLoading) return;
    setFollowLoading(true);
    try {
      await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: id }),
      });
      setFollowing((prev) => !prev);
    } catch (err) {
      devError(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveAlbum = async (e: React.MouseEvent, albumId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (saveLoadingId) return;
    setSaveLoadingId(albumId);
    try {
      await fetch("/api/saved-albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      setSavedAlbumIds((prev) => {
        const next = new Set(prev);
        if (next.has(albumId)) next.delete(albumId);
        else next.add(albumId);
        return next;
      });
    } catch (err) {
      devError(err);
    } finally {
      setSaveLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="relative -mx-6 -mt-4 min-h-[calc(100dvh-var(--navbar-height)-var(--player-height))] rounded-b-xl bg-white/5" />
        <div className="flex items-center gap-6">
          <div className="h-32 w-32 rounded-full bg-white/5" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 rounded bg-white/5" />
            <div className="h-4 w-32 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-28 rounded-full bg-white/5" />
          <div className="h-12 w-32 rounded-full bg-white/5" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-6 rounded bg-white/5" />
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-4 flex-1 rounded bg-white/5" />
              <div className="h-4 w-12 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted">{t("artistNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      <ScrollReveal>
        <ArtistInfoSlider
          artist={artist}
          albums={artist.albums}
          songs={artist.songs}
          headerText={artist.name.toUpperCase()}
        />
      </ScrollReveal>

      
      <ScrollReveal delay={0.1}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-2xl">
            <Image
              src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
              alt={artist.name}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            {artist.verified && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                  {t("verified")}
                </span>
              </div>
            )}
            <h1 className="text-4xl font-black text-white md:text-5xl">
              {artist.name}
            </h1>
            <p className="text-sm text-muted">
              {formatPlayCount(artist.monthlyListeners)} {t("monthlyListeners")}
            </p>
            <p className="text-xs text-white/45">
              {t("artistCatalogLine")
                .replace("{{songs}}", String(artist.songs.length))
                .replace("{{albums}}", String(artist.albums.length))}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <ShineButton size="lg" variant="primary" onClick={handlePlayAll}>
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5 fill-white" />
                  {t("play")}
                </span>
              </ShineButton>
              <ShineButton
                size="md"
                variant="secondary"
                onClick={handleFollow}
                disabled={followLoading}
              >
                <span className="flex items-center gap-2">
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : following ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {following ? t("following") : t("follow")}
                </span>
              </ShineButton>
            </div>
          </div>
        </div>
      </ScrollReveal>

      
      {artist.songs.length > 0 && (
        <section>
          <ScrollReveal delay={0.2}>
            <h2 className="mb-4 text-xl font-bold text-white">
              {t("popularSongs")}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            {artist.songs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                onClick={() => handlePlaySong(song, index)}
                className="group grid cursor-pointer grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
              >
                <span className="w-6 text-center text-sm text-muted group-hover:hidden">
                  {index + 1}
                </span>
                <Play className="hidden h-4 w-4 w-6 text-center text-white group-hover:block" />
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  <Image
                    src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
                    alt={song.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{song.title}</p>
                </div>
                <span className="text-sm text-muted">
                  {formatPlayCount(song.playCount)}
                </span>
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-transparent transition-colors group-hover:text-muted" />
                  <span className="text-sm text-muted">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </section>
      )}

      
      {artist.albums.length > 0 && (
        <section>
          <ScrollReveal delay={0.3}>
            <h2 className="mb-4 text-xl font-bold text-white">{t("discography")}</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {artist.albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="group relative w-44 flex-shrink-0 rounded-xl bg-card/50 p-3 transition-colors hover:bg-card-hover"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={proxiedImageUrl(album.coverImage) || "/images/placeholder-song.svg"}
                      alt={album.title}
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                    <button
                      onClick={(e) => handleSaveAlbum(e, album.id)}
                      disabled={saveLoadingId === album.id}
                      className={`absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:bg-black/80 disabled:opacity-100 ${
                        savedAlbumIds.has(album.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label={savedAlbumIds.has(album.id) ? t("saved") : t("saveAlbum")}
                    >
                      {saveLoadingId === album.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : savedAlbumIds.has(album.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-accent" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-white">
                    {album.title}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(album.releaseDate).getFullYear()} &middot;{" "}
                    {album.albumType === "SINGLE"
                      ? t("single")
                      : album.albumType === "EP"
                        ? t("ep")
                        : t("album")}
                  </p>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
