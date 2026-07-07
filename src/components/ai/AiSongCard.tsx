"use client";

import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { usePlayerStore } from "@/store/playerStore";
import type { SongType } from "@/types";

export interface AiSuggestedSong {
  id: string;
  title: string;
  duration: number;
  coverImage: string | null;
  artist: { id: string; name: string; profileImage: string | null } | null;
  album: { id: string; title: string; coverImage: string | null } | null;
}

function toSongType(s: AiSuggestedSong): SongType {
  return {
    id: s.id,
    title: s.title,
    duration: s.duration,
    coverImage: s.coverImage,
    artistId: s.artist?.id ?? "",
    albumId: s.album?.id ?? null,
    genreId: null,
    audioUrl: "",
    previewVideoUrl: null,
    playCount: 0,
    isPublished: true,
    createdAt: new Date(),
    artist: s.artist
      ? {
          id: s.artist.id,
          userId: "",
          name: s.artist.name,
          bio: null,
          profileImage: s.artist.profileImage,
          bannerImage: null,
          verified: false,
          monthlyListeners: 0,
          createdAt: new Date(),
        }
      : undefined,
    album: s.album
      ? {
          id: s.album.id,
          title: s.album.title,
          coverImage: s.album.coverImage,
          artistId: "",
          releaseDate: new Date(),
          albumType: "ALBUM" as const,
          createdAt: new Date(),
        }
      : undefined,
  };
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AiSongCardProps {
  song: AiSuggestedSong;
  className?: string;
}

export function AiSongCard({ song, className }: AiSongCardProps) {
  const { activeSong, isPlaying, setActiveSong, togglePlay } = usePlayerStore();
  const isActive = activeSong?.id === song.id;
  const cover =
    proxiedImageUrl(song.coverImage) ||
    proxiedImageUrl(song.album?.coverImage) ||
    "/images/placeholder-song.svg";

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
    } else {
      setActiveSong(toSongType(song));
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={cn(
        "group flex w-56 flex-shrink-0 items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/10",
        isActive && "ring-1 ring-accent/60 bg-accent/10",
        className,
      )}
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={cover}
          alt={song.title}
          fill
          sizes="48px"
          className="object-cover"
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {isActive && isPlaying ? (
            <Pause className="h-4 w-4 fill-white text-white" />
          ) : (
            <Play className="h-4 w-4 fill-white text-white" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isActive ? "text-accent" : "text-white")}>
          {song.title}
        </p>
        <p className="truncate text-xs text-white/50">
          {song.artist?.name ?? "Bilinmeyen Sanatçı"}
          {song.duration > 0 && ` · ${formatDuration(song.duration)}`}
        </p>
      </div>
    </button>
  );
}
