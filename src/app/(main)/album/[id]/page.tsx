import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { showErrorToast } from "@/store/toastStore";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Shuffle,
  Heart,
  Clock,
  Loader2,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ShineButton } from "@/components/ui/shine-button";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { formatDuration } from "@/lib/utils";
import type { SongType, AlbumType, ArtistType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

interface AlbumData extends AlbumType {
  artist: ArtistType;
  songs: SongType[];
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setPlaylistPlayback = useQueueStore((s) => s.setPlaylistPlayback);

  const refetchAlbum = useCallback(
    (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      Promise.all([
        fetch(`/api/albums/${id}`).then((r) => r.json()),
        fetch("/api/saved-albums").then((r) => r.json()).catch(() => { showErrorToast(t("loadError")); return []; }),
      ])
        .then(([albumData, savedAlbums]) => {
          setAlbum(albumData);
          if (Array.isArray(savedAlbums)) {
            setSaved(savedAlbums.some((a: AlbumType) => a.id === id));
          }
        })
        .catch(() => {})
        .finally(() => !silent && setLoading(false));
    },
    [id]
  );

  useEffect(() => {
    refetchAlbum();
  }, [refetchAlbum]);

  useRefreshInterval(() => refetchAlbum(true), 5000, !!id);

  const handlePlaySong = (song: SongType, index: number) => {
    if (!album) return;
    setPlaylistPlayback(`album-${id}`, album.songs, index, album.title);
    setActiveSong(song);
  };

  const handlePlayAll = () => {
    if (!album?.songs?.length) return;
    setPlaylistPlayback(`album-${id}`, album.songs, 0, album.title);
    setActiveSong(album.songs[0]);
  };

  const handleShufflePlay = () => {
    if (!album?.songs?.length) return;
    const shuffled = [...album.songs].sort(() => Math.random() - 0.5);
    setPlaylistPlayback(`album-${id}`, shuffled, 0, album.title);
    setActiveSong(shuffled[0]);
  };

  const handleSave = async () => {
    if (!id || saveLoading) return;
    setSaveLoading(true);
    try {
      await fetch("/api/saved-albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: id }),
      });
      setSaved((prev) => !prev);
    } catch (err) {
      devError(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const totalDuration = album?.songs?.reduce((sum, s) => sum + (s.duration ?? 0), 0) ?? 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-end gap-6">
          <div className="h-56 w-56 flex-shrink-0 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-16 rounded bg-white/5" />
            <div className="h-10 w-64 rounded bg-white/5" />
            <div className="h-4 w-48 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-32 rounded-full bg-white/5" />
          <div className="h-12 w-12 rounded-full bg-white/5" />
          <div className="h-12 w-12 rounded-full bg-white/5" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-8 rounded bg-white/5" />
              <div className="h-4 flex-1 rounded bg-white/5" />
              <div className="h-4 w-12 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted">{t("albumNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScrollReveal>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div className="relative h-56 w-56 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
            <Image
              src={proxiedImageUrl(album.coverImage) || "/images/placeholder-song.svg"}
              alt={album.title}
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              {album.albumType === "SINGLE"
                ? t("single")
                : album.albumType === "EP"
                  ? t("ep")
                  : t("album")}
            </p>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              {album.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted sm:justify-start">
              <Link
                href={`/artist/${album.artist.id}`}
                className="font-semibold text-white hover:underline"
              >
                {album.artist.name}
              </Link>
              <span>&middot;</span>
              <span>{new Date(album.releaseDate).getFullYear()}</span>
              <span>&middot;</span>
              <span>
                {album.songs?.length ?? 0} {t("song")}, {Math.floor(totalDuration / 60)} {t("min")}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex items-center gap-4">
          <ShineButton size="lg" variant="primary" onClick={handlePlayAll}>
            <span className="flex items-center gap-2">
              <Play className="h-5 w-5 fill-white" />
              Tümünü Çal
            </span>
          </ShineButton>
          <button
            onClick={handleShufflePlay}
            className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <Shuffle className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-accent"
          >
            {saveLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : saved ? (
              <BookmarkCheck className="h-5 w-5 text-accent" />
            ) : (
              <BookmarkPlus className="h-5 w-5" />
            )}
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="rounded-xl">
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted">
            <span className="w-8 text-center">#</span>
            <span>Başlık</span>
            <span className="flex items-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          {(album.songs ?? []).map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              onClick={() => handlePlaySong(song, index)}
              className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
            >
              <span className="w-8 text-center text-sm text-muted group-hover:hidden">
                {index + 1}
              </span>
              <Play className="hidden h-4 w-4 w-8 text-center text-white group-hover:block" />
              <div>
                <p className="text-sm font-medium text-white">{song.title}</p>
                {song.artist && (
                  <p className="text-xs text-muted">
                    {typeof song.artist === "object" && "name" in song.artist
                      ? (song.artist as ArtistType).name
                      : album.artist.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 text-transparent transition-colors group-hover:text-muted" />
                <span className="text-sm text-muted">
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
