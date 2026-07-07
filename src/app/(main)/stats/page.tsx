"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Music2, Play, BarChart3, Mic2, Disc3, Users, Award } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { formatDuration } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { BadgeGrid } from "@/components/badges/BadgeGrid";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import type { SongType } from "@/types";

interface TopArtist {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TopTrack {
  id: string;
  title: string;
  duration: number;
  coverImage: string | null;
  audioUrl: string;
  artist: { id: string; name: string } | null;
}

export default function StatsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [uniqueArtistCount, setUniqueArtistCount] = useState(0);
  const [uniqueTrackCount, setUniqueTrackCount] = useState(0);
  const [topGenre, setTopGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);

  const refetchStats = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      fetch(`/api/profile/top-stats?period=${period}`)
        .then((r) => {
          if (!r.ok) throw new Error("fetch_failed");
          return r.json();
        })
        .then((data) => {
          setTopArtists(data.topArtists ?? []);
          setTopTracks(data.topTracks ?? []);
          setTotalDuration(data.totalListenDuration ?? 0);
          setUniqueArtistCount(data.uniqueArtistCount ?? 0);
          setUniqueTrackCount(data.uniqueTrackCount ?? 0);
          setTopGenre(data.topGenre ?? null);
        })
        .catch(() => setError("statsLoadError"))
        .finally(() => !silent && setLoading(false));
    },
    [period]
  );

  useEffect(() => {
    refetchStats();
  }, [refetchStats]);

  useRefreshInterval(() => refetchStats(true), 5000, true);

  const playTrack = (track: TopTrack) => {
    const song: SongType = {
      id: track.id,
      title: track.title,
      duration: track.duration,
      coverImage: track.coverImage,
      previewVideoUrl: null,
      artistId: track.artist?.id ?? "",
      albumId: null,
      genreId: null,
      audioUrl: track.audioUrl,
      playCount: 0,
      isPublished: true,
      createdAt: new Date(),
      artist: track.artist
        ? {
            id: track.artist.id,
            name: track.artist.name,
            userId: "",
            bio: null,
            profileImage: null,
            bannerImage: null,
            verified: false,
            monthlyListeners: 0,
            createdAt: new Date(),
          }
        : undefined,
      album: undefined,
    };
    useQueueStore.getState().clearPlaylistPlayback();
    setActiveSong(song);
  };

  const periodLabel = period === "week" ? t("thisWeek") : t("thisMonth");

  return (
    <div className="min-h-0">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <BarChart3 className="h-7 w-7" />
              {t("stats")}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {t("statsSubtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                period === "week"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t("thisWeek")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                period === "month"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t("thisMonth")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-16">
            <p className="text-red-400">{t("statsLoadError")}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetch(`/api/profile/top-stats?period=${period}`)
                  .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
                  .then((data) => {
                    setTopArtists(data?.topArtists ?? []);
                    setTopTracks(data?.topTracks ?? []);
                    setTotalDuration(data?.totalListenDuration ?? 0);
                    setError(null);
                  })
                  .catch(() => setError("statsLoadError"))
                  .finally(() => setLoading(false));
              }}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              {t("retry") ?? "Tekrar dene"}
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-900/5 p-5 ring-1 ring-purple-500/10"
              >
                <Disc3 className="mb-2 h-5 w-5 text-purple-400" />
                <p className="text-2xl font-bold text-white">
                  {Math.round(totalDuration / 60)}
                </p>
                <p className="text-xs text-white/40">{t("wrappedMinutes")}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 p-5 ring-1 ring-emerald-500/10"
              >
                <Users className="mb-2 h-5 w-5 text-emerald-400" />
                <p className="text-2xl font-bold text-white">
                  {uniqueArtistCount}
                </p>
                <p className="text-xs text-white/40">{t("wrappedDifferentArtists")}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-900/5 p-5 ring-1 ring-violet-500/10"
              >
                <Music2 className="mb-2 h-5 w-5 text-violet-400" />
                <p className="text-2xl font-bold text-white">
                  {uniqueTrackCount}
                </p>
                <p className="text-xs text-white/40">{t("wrappedDifferentSongs")}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-900/5 p-5 ring-1 ring-pink-500/10"
              >
                <Mic2 className="mb-2 h-5 w-5 text-pink-400" />
                <p className="text-2xl font-bold text-white">
                  {topGenre ?? "—"}
                </p>
                <p className="text-xs text-white/40">{t("wrappedTopGenre")}</p>
              </motion.div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">
                {periodLabel} {t("topArtistsSection")}
              </h2>
              {topArtists.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {topArtists.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artist/${artist.id}`}
                      className="group flex w-36 flex-shrink-0 flex-col items-center"
                    >
                      <div className="relative h-36 w-36 overflow-hidden rounded-full bg-white/10">
                        {artist.profileImage ? (
                          <Image
                            src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
                            alt={artist.name}
                            fill
                            sizes="144px"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music2 className="h-14 w-14 text-white/40" />
                          </div>
                        )}
                      </div>
                      <p className="mt-3 w-full truncate text-center font-medium text-white">
                        {artist.name}
                      </p>
                      <p className="text-sm text-muted">{t("artist")}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
                  <p className="text-muted">
                    {periodLabel} {t("noStatsYet")}
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">
                {periodLabel} {t("topTracksSection")}
              </h2>
              {topTracks.length > 0 ? (
                <div className="space-y-1">
                  {topTracks.map((track, index) => (
                    <div
                      key={track.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => playTrack(track)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && playTrack(track)
                      }
                      className="group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="w-6 text-center text-sm text-muted group-hover:hidden">
                        {index + 1}
                      </span>
                      <Play className="hidden h-4 w-4 w-6 text-white group-hover:block" />
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-white/10">
                        {proxiedImageUrl(track.coverImage) ? (
                          <Image
                            src={proxiedImageUrl(track.coverImage)!}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music2 className="h-6 w-6 text-white/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {track.title}
                        </p>
                        <p className="truncate text-sm text-muted">
                          {track.artist?.name ?? "Bilinmeyen"}
                        </p>
                      </div>
                      <span className="text-sm text-muted">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
                  <p className="text-muted">
                    {periodLabel} {t("noStatsYet")}
                  </p>
                </div>
              )}
            </section>

            {session?.user?.id && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Award className="h-5 w-5 text-yellow-400" />
                  {t("badges")}
                </h2>
                <div className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/[0.06]">
                  <BadgeGrid userId={session.user.id} />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
