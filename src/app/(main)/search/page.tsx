"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePlayerStore } from "@/store/playerStore";
import { SongType, ArtistType, AlbumType, GenreType } from "@/types";
import {
  Search,
  Music,
  Mic2,
  Disc3,
  Play,
  Loader2,
  X,
  PlusCircle,
  Heart,
  ListPlus,
  ListMusic,
  User,
} from "lucide-react";
import { SongContextMenu } from "@/components/ui/context-menu";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

type SearchTab = "all" | "songs" | "artists" | "albums" | "users";

interface SearchUserHit {
  id: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
}

interface SearchResults {
  songs: SongType[];
  artists: ArtistType[];
  albums: AlbumType[];
  users: SearchUserHit[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const getSearchTabs = (
  t: (k: string) => string,
  includeUsers: boolean
): { id: SearchTab; label: string }[] => {
  const base: { id: SearchTab; label: string }[] = [
    { id: "all", label: t("all") },
    { id: "songs", label: t("songs") },
    { id: "artists", label: t("artists") },
    { id: "albums", label: t("albums") },
  ];
  if (includeUsers) base.push({ id: "users", label: t("users") });
  return base;
};

export default function SearchPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const showUserSearch = !!session?.user?.id;
  const TABS = useMemo(() => getSearchTabs(t, showUserSearch), [t, showUserSearch]);
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlTab = (searchParams.get("tab") as SearchTab) || "all";

  const validTabs = useMemo<SearchTab[]>(
    () =>
      showUserSearch
        ? ["all", "songs", "artists", "albums", "users"]
        : ["all", "songs", "artists", "albums"],
    [showUserSearch]
  );

  const [query, setQuery] = useState(urlQuery);

  const [results, setResults] = useState<SearchResults | null>(null);
  const [genreSongs, setGenreSongs] = useState<SongType[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>(urlGenre);
  const [activeTab, setActiveTab] = useState<SearchTab>(
    validTabs.includes(urlTab) ? urlTab : "all"
  );
  const [genres, setGenres] = useState<GenreType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const openSongModal = useModalStore((s) => s.openSongModal);
  const openAddToPlaylistModal = useModalStore((s) => s.openAddToPlaylistModal);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const isInQueue = useQueueStore((s) => s.isInQueue);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const commitSearchToUrl = useCallback(() => {
    const q = query.trim();
    const next = new URLSearchParams(searchParams.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    const qs = next.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }, [query, router, searchParams]);

  useEffect(() => {
    if (urlGenre) setActiveGenre(urlGenre);
  }, [urlGenre]);

  useEffect(() => {
    if (validTabs.includes(urlTab)) {
      setActiveTab(urlTab as SearchTab);
    } else {
      setActiveTab("all");
    }
  }, [urlTab, validTabs]);

  useEffect(() => {
    if (!showUserSearch && urlTab === "users") {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("tab");
      const qs = next.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    }
  }, [showUserSearch, urlTab, router, searchParams]);

  useEffect(() => {
    setIsLoadingGenres(true);
    fetch("/api/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data))
      .catch(() => setGenres([]))
      .finally(() => setIsLoadingGenres(false));
  }, []);

  useEffect(() => {
    if (!activeGenre) { setGenreSongs([]); return; }
    setIsSearching(true);
    fetch(`/api/songs?genre=${activeGenre}&limit=30`)
      .then((r) => r.json())
      .then((data) => setGenreSongs(Array.isArray(data) ? data : []))
      .catch(() => setGenreSongs([]))
      .finally(() => setIsSearching(false));
  }, [activeGenre]);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setActiveGenre("");
    setIsSearching(true);
    try {
      const qEnc = encodeURIComponent(q.trim());
      const [localRes, deezerRes, userRes] = await Promise.all([
        fetch(`/api/search?q=${qEnc}`),
        fetch(`/api/jamendo/tracks?q=${qEnc}&limit=10`),
        showUserSearch
          ? fetch(`/api/users/search?q=${qEnc}`, { credentials: "include" })
          : Promise.resolve(null),
      ]);
      const localData = (await localRes.json()) as Omit<SearchResults, "users"> & { users?: SearchUserHit[] };
      const deezerData = await deezerRes.json();
      const deezerSongs = Array.isArray(deezerData)
        ? (deezerData as SongType[])
        : [];
      let users: SearchUserHit[] = [];
      if (userRes?.ok) {
        const u = (await userRes.json()) as { users?: SearchUserHit[] };
        users = Array.isArray(u.users) ? u.users : [];
      }
      setResults({
        songs: [...(localData.songs ?? []), ...deezerSongs],
        artists: localData.artists ?? [],
        albums: localData.albums ?? [],
        users,
      });
    } catch {
      setResults({ songs: [], artists: [], albums: [], users: [] });
    } finally {
      setIsSearching(false);
    }
  }, [showUserSearch]);

  useEffect(() => {
    const q = urlQuery.trim();
    if (!q) {
      setResults(null);
      return;
    }
    fetchResults(q);
  }, [urlQuery, fetchResults]);

  const hasResults =
    results &&
    (results.songs.length > 0 ||
      results.artists.length > 0 ||
      results.albums.length > 0 ||
      results.users.length > 0);

  const showEmpty = results && !hasResults && urlQuery.trim();

  const showTabs = hasResults;

  return (
    <div className="space-y-6 pb-8">
      
      <ScrollReveal>
        <div className="group relative mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => commitSearchToUrl()}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/25 transition-colors hover:text-white/60"
            aria-label="Ara"
          >
            <Search className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearchToUrl();
              }
            }}
            placeholder={t("searchPagePlaceholder")}
            className="w-full rounded-2xl border-0 bg-white/[0.04] py-4 pl-14 pr-12 text-lg text-white ring-1 ring-white/[0.06] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-purple-500/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                const next = new URLSearchParams(searchParams.toString());
                next.delete("q");
                const qs = next.toString();
                router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </ScrollReveal>

      
      {showTabs && !isSearching && (
        <nav className="flex gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={
                urlQuery
                  ? `/search?q=${encodeURIComponent(urlQuery)}&tab=${tab.id}`
                  : `/search?tab=${tab.id}`
              }
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white/[0.08] text-white ring-1 ring-white/[0.08]"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}

      
      {isSearching && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400/60" />
            <span className="text-xs text-white/20">Aranıyor...</span>
          </div>
        </div>
      )}

      
      {!isSearching && hasResults && (
        <div className="space-y-10">
          
          {(activeTab === "all" || activeTab === "songs") && results.songs.length > 0 && (
            <ScrollReveal>
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-400/60" />
                  <h2 className="text-lg font-bold text-white">Şarkılar</h2>
                </div>
                <div className="space-y-0.5">
                  {results.songs.map((song, idx) => (
                    <SongContextMenu key={`${song.id}-${idx}`} song={song}>
                      <div
                        onClick={() => openSongModal(song)}
                        className="group flex w-full cursor-pointer items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.04]"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); clearPlaylistPlayback(); setActiveSong(song); }}
                          className="w-6 text-center"
                        >
                          <span className="text-sm text-muted group-hover:hidden">{idx + 1}</span>
                          <Play className="hidden h-4 w-4 text-white group-hover:block" />
                        </button>
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
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
                            <p className="truncate text-sm font-medium text-white">
                              {song.title}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {song.artist?.name || t("unknownArtist")}
                            </p>
                          </div>
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
                              fetch("/api/likes", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ songId: song.id }),
                              });
                            }}
                            className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                            title={t("like")}
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openAddToPlaylistModal(song); }}
                            className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                            title={t("addToPlaylist")}
                          >
                            <ListPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); addToQueueWithSimilar(song); }}
                            className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                            title={t("addToQueue")}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs text-muted">
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </SongContextMenu>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          
          {(activeTab === "all" || activeTab === "users") && results.users.length > 0 && (
            <ScrollReveal delay={0.08}>
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold text-white">{t("users")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {results.users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${encodeURIComponent(u.username || u.id)}`}
                      className="group flex flex-col items-center gap-3 rounded-xl p-4 transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-28 w-28 overflow-hidden rounded-full sm:h-32 sm:w-32">
                        {u.avatar ? (
                          <Image
                            src={u.avatar}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 112px, 128px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white/80">
                            {(u.name || u.username || "?")[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="truncate text-sm font-semibold text-white">
                          {u.name || u.username || t("unknownArtist")}
                        </p>
                        {u.username ? (
                          <p className="truncate text-xs text-muted">@{u.username}</p>
                        ) : (
                          <p className="text-xs text-muted">{t("profile")}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          
          {(activeTab === "all" || activeTab === "artists") && results.artists.length > 0 && (
            <ScrollReveal delay={0.1}>
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold text-white">{t("artists")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {results.artists.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artist/${artist.id}`}
                      className="group flex flex-col items-center gap-3 rounded-xl p-4 transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-28 w-28 overflow-hidden rounded-full sm:h-32 sm:w-32">
                        <Image
                          src={
                            artist.profileImage ||
                            "/images/placeholder-song.svg"
                          }
                          alt={artist.name}
                          fill
                          sizes="(max-width: 640px) 112px, 128px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-center">
                        <p className="truncate text-sm font-semibold text-white">
                          {artist.name}
                        </p>
                        <p className="text-xs text-muted">{t("artist")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          
          {(activeTab === "all" || activeTab === "albums") && results.albums.length > 0 && (
            <ScrollReveal delay={0.2}>
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Disc3 className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold text-white">{t("albums")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {results.albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.id}`}
                      className="group rounded-xl bg-card/50 p-3 transition-colors hover:bg-card-hover"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={
                            proxiedImageUrl(album.coverImage) ||
                            "/images/placeholder-song.svg"
                          }
                          alt={album.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {album.title}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {album.artist?.name || t("unknownArtist")} ·{" "}
                          {album.albumType === "ALBUM"
                            ? t("album")
                            : album.albumType === "SINGLE"
                              ? t("single")
                              : album.albumType === "EP"
                                ? t("ep")
                                : album.albumType}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          
          {activeTab !== "all" &&
            ((activeTab === "songs" && results.songs.length === 0) ||
              (activeTab === "artists" && results.artists.length === 0) ||
              (activeTab === "albums" && results.albums.length === 0) ||
              (activeTab === "users" && results.users.length === 0)) && (
              <div className="py-12 text-center text-muted">
                <p className="text-sm">
                  &quot;{urlQuery}&quot; için {TABS.find((t) => t.id === activeTab)?.label} bulunamadı
                </p>
              </div>
            )}
        </div>
      )}

      
      {!isSearching && showEmpty && (
        <ScrollReveal>
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted/40" />
            <p className="text-lg font-medium text-white">
              &quot;{urlQuery}&quot; için sonuç bulunamadı
            </p>
            <p className="mt-2 text-sm text-muted">
              Farklı bir arama terimi deneyin
            </p>
          </div>
        </ScrollReveal>
      )}

      
      {!isSearching && activeGenre && genreSongs.length > 0 && !query && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {genres.find((g) => g.slug === activeGenre)?.name || activeGenre}
              </h2>
              <button
                onClick={() => setActiveGenre("")}
                className="rounded-full bg-white/10 p-1 text-muted transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted">{genreSongs.length} {t("song")}</span>
          </div>
          <div className="space-y-1">
            {genreSongs.map((song, idx) => (
              <SongContextMenu key={`${song.id}-${idx}`} song={song}>
                <div
                  onClick={() => openSongModal(song)}
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); clearPlaylistPlayback(); setActiveSong(song); }}
                    className="w-6 text-center"
                  >
                    <span className="text-sm text-muted group-hover:hidden">{idx + 1}</span>
                    <Play className="hidden h-4 w-4 text-white group-hover:block" />
                  </button>
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                    <Image src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"} alt={song.title} fill sizes="40px" className="object-cover" />
                  </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{song.title}</p>
                    <p className="truncate text-xs text-muted">{song.artist?.name || t("unknownArtist")}</p>
                  </div>
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
                        fetch("/api/likes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ songId: song.id }),
                        });
                      }}
                      className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                      title={t("like")}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddToPlaylistModal(song); }}
                      className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                      title={t("addToPlaylist")}
                    >
                      <ListPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToQueueWithSimilar(song); }}
                      className="p-1 text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                      title={t("addToQueue")}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted">{formatDuration(song.duration)}</span>
                </div>
              </SongContextMenu>
            ))}
          </div>
        </section>
      )}

      
      {!query && !activeGenre && (
        <section>
          <ScrollReveal delay={0.1}>
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">
              {t("allGenres")} <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">{t("exploreGenres")}</span>
            </h2>
          </ScrollReveal>

          {isLoadingGenres ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : genres.length > 0 ? (
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setActiveGenre(genre.slug)}
                    className="group relative overflow-hidden rounded-2xl p-5 text-left ring-1 ring-white/[0.06] transition-all hover:scale-[1.02] hover:ring-white/10"
                    style={{ backgroundColor: genre.color || "#7c3aed" }}
                  >
                    <div className="relative z-10">
                      <p className="text-lg font-bold text-white">
                        {genre.name}
                      </p>
                    </div>
                    {genre.imageUrl && (
                      <div className="absolute -bottom-2 -right-4 h-24 w-24 rotate-12 opacity-60 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                        <Image
                          src={genre.imageUrl}
                          alt={genre.name}
                          fill
                          sizes="96px"
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40" />
                  </button>
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              Türler yüklenemedi
            </p>
          )}
        </section>
      )}
    </div>
  );
}
