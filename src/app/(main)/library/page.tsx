"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GlowingCard } from "@/components/ui/glowing-cards";
import { cn, formatDuration } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { usePlayerStore } from "@/store/playerStore";
import { showErrorToast } from "@/store/toastStore";
import { useQueueStore } from "@/store/queueStore";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Disc,
  Users,
  ListMusic,
  Play,
  Music,
  WifiOff,
} from "lucide-react";
import { SpotifyPlaylistImportModal } from "@/components/SpotifyPlaylistImportModal";
import { PlaylistContextMenu } from "@/components/ui/playlist-context-menu";
import { SavedSectionContextMenu } from "@/components/ui/saved-section-context-menu";
import { SongContextMenu } from "@/components/ui/context-menu";
import { useSettingsStore } from "@/store/settingsStore";
import { useOfflineStore } from "@/store/offlineStore";
import { listOfflineSongIds, listOfflineSongsWithMeta } from "@/lib/offline-storage";
import type {
  SongType,
  ArtistType,
  AlbumType,
  PlaylistType,
} from "@/types";

type TabId = "playlists" | "liked" | "albums" | "artists" | "offline";

const getTabs = (t: (k: string) => string) => [
  { id: "playlists" as const, label: t("playlists"), icon: ListMusic },
  { id: "liked" as const, label: t("likedSongs"), icon: Heart },
  { id: "albums" as const, label: t("albums"), icon: Disc },
  { id: "artists" as const, label: t("artists"), icon: Users },
  { id: "offline" as const, label: t("offline"), icon: WifiOff },
];

interface SavedSectionType {
  sectionId: string;
  title: string;
  coverImage: string | null;
}

interface TabData {
  playlists: PlaylistType[];
  savedSections: SavedSectionType[];
  liked: SongType[];
  albums: AlbumType[];
  artists: ArtistType[];
  offline: SongType[];
}

const getEmptyMessages = (t: (k: string) => string): Record<TabId, { title: string; subtitle: string }> => ({
  playlists: { title: t("noPlaylistsYet"), subtitle: t("noPlaylistsSubtitle") },
  liked: { title: t("noLikedSongsYet"), subtitle: t("noLikedSongsSubtitle") },
  albums: { title: t("noSavedAlbums"), subtitle: t("noSavedAlbumsSubtitle") },
  artists: { title: t("noFollowedArtists"), subtitle: t("noFollowedArtistsSubtitle") },
  offline: { title: t("noOfflineSongs"), subtitle: t("noOfflineSongsSubtitle") },
});

const tabEndpoints: Record<Exclude<TabId, "offline">, string> = {
  playlists: "/api/playlists",
  liked: "/api/likes",
  albums: "/api/saved-albums",
  artists: "/api/follow",
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-card p-4">
      <div className="aspect-square w-full rounded-xl bg-white/5" />
      <div className="mt-3 h-4 w-3/4 rounded bg-white/5" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg px-4 py-3">
      <div className="h-10 w-10 flex-shrink-0 rounded bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-white/5" />
        <div className="h-3 w-1/5 rounded bg-white/5" />
      </div>
      <div className="h-3 w-10 rounded bg-white/5" />
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabId | null;
  const importQ = searchParams.get("import");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const tabs = getTabs(t);
  const emptyMessages = getEmptyMessages(t);
  const [activeTab, setActiveTab] = useState<TabId>(
    urlTab && ["playlists", "liked", "albums", "artists", "offline"].includes(urlTab) ? urlTab : "playlists"
  );

  useEffect(() => {
    if (urlTab && ["playlists", "liked", "albums", "artists", "offline"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    if (importQ === "spotify") {
      setImportModalOpen(true);
    }
  }, [importQ]);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
    if (importQ === "spotify") {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("import");
      const q = p.toString();
      router.replace(q ? `/library?${q}` : "/library");
    }
  }, [importQ, searchParams, router]);
  const [data, setData] = useState<TabData>({
    playlists: [],
    savedSections: [],
    liked: [],
    albums: [],
    artists: [],
    offline: [],
  });
  const [loading, setLoading] = useState<Record<TabId, boolean>>({
    playlists: false,
    liked: false,
    albums: false,
    artists: false,
    offline: false,
  });
  const [fetched, setFetched] = useState<Record<TabId, boolean>>({
    playlists: false,
    liked: false,
    albums: false,
    artists: false,
    offline: false,
  });
  /** Keep latest fetch flags without listing `fetched` in fetchTab deps (avoids setFetched → new fetchTab → effects loop). */
  const fetchedRef = useRef(fetched);
  fetchedRef.current = fetched;

  const downloadedIds = useOfflineStore((s) => s.downloadedIds);
  const setDownloadedIds = useOfflineStore((s) => s.setDownloadedIds);

  useEffect(() => {
    if (activeTab === "offline") {
      listOfflineSongIds()
        .then((ids) => setDownloadedIds(ids))
        .catch(() => showErrorToast(t("loadError")));
    }
  }, [activeTab, setDownloadedIds]);

  const { setActiveSong } = usePlayerStore();
  const { setPlaylistPlayback } = useQueueStore();
  const libraryCompactView = useSettingsStore((s) => s.libraryCompactView);

  const fetchTab = useCallback(
    async (tab: TabId, force = false, silent = false) => {
      if (tab === "offline") {
        if (!silent) setLoading((prev) => ({ ...prev, offline: true }));
        try {
          const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
          if (isOffline) {
            const metaList = await listOfflineSongsWithMeta();
            const songs: SongType[] = metaList.map((m) => ({
              id: m.songId,
              title: m.title,
              artistId: "",
              albumId: null,
              genreId: null,
              duration: m.duration,
              audioUrl: "",
              coverImage: m.coverImage ?? null,
              previewVideoUrl: null,
              playCount: 0,
              isPublished: true,
              createdAt: new Date(),
              artist: m.artist ? { id: "", userId: "", name: m.artist, bio: null, profileImage: null, bannerImage: null, verified: false, monthlyListeners: 0, createdAt: new Date() } : undefined,
            }));
            setData((prev) => ({ ...prev, offline: songs }));
          } else if (downloadedIds.length === 0) {
            setData((prev) => ({ ...prev, offline: [] }));
          } else {
            const res = await fetch(`/api/songs?ids=${downloadedIds.join(",")}`);
            const json = res.ok ? await res.json() : [];
            setData((prev) => ({ ...prev, offline: Array.isArray(json) ? json : [] }));
          }
          setFetched((prev) => ({ ...prev, offline: true }));
        } catch {
          setData((prev) => ({ ...prev, offline: [] }));
          setFetched((prev) => ({ ...prev, offline: true }));
        } finally {
          if (!silent) setLoading((prev) => ({ ...prev, offline: false }));
        }
        return;
      }
      if (fetchedRef.current[tab] && !force) return;
      if (!silent) setLoading((prev) => ({ ...prev, [tab]: true }));
      try {
        const res = await fetch(tabEndpoints[tab as Exclude<TabId, "offline">]);
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        if (tab === "playlists" && json?.playlists !== undefined) {
          setData((prev) => ({
            ...prev,
            playlists: json.playlists ?? [],
            savedSections: json.savedSections ?? [],
          }));
        } else if (tab === "playlists" && Array.isArray(json)) {
          setData((prev) => ({ ...prev, playlists: json, savedSections: [] }));
        } else {
          setData((prev) => ({ ...prev, [tab]: json }));
        }
        setFetched((prev) => ({ ...prev, [tab]: true }));
      } catch {
        showErrorToast(t("loadError"));
      } finally {
        if (!silent) setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [downloadedIds]
  );

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  useEffect(() => {
    if (activeTab === "offline") {
      setFetched((prev) => ({ ...prev, offline: false }));
      fetchTab("offline");
    }
  }, [downloadedIds.join(","), activeTab, fetchTab]);

  useEffect(() => {
    const handler = () => {
      setFetched((prev) => ({ ...prev, playlists: false }));
      fetch(tabEndpoints.playlists)
        .then((r) => r.json())
        .then((json) => {
          setData((prev) => ({
            ...prev,
            playlists: json?.playlists ?? prev.playlists,
            savedSections: json?.savedSections ?? prev.savedSections,
          }));
        })
        .catch(() => showErrorToast(t("loadError")));
    };
    window.addEventListener("playlist-updated", handler);
    return () => window.removeEventListener("playlist-updated", handler);
  }, []);

  const refetchActiveTab = useCallback(() => {
    fetchTab(activeTab, true, true);
  }, [activeTab, fetchTab]);

  useRefreshInterval(refetchActiveTab, 5000, true);

  const handlePlaySong = (song: SongType, index: number) => {
    setPlaylistPlayback("library-liked", data.liked, index, t("likedSongs"));
    setActiveSong(song);
  };

  const tabIcon = (id: TabId) => {
    const icons: Record<TabId, React.ReactNode> = {
      playlists: <ListMusic className="h-8 w-8 text-muted" />,
      liked: <Heart className="h-8 w-8 text-muted" />,
      albums: <Disc className="h-8 w-8 text-muted" />,
      artists: <Users className="h-8 w-8 text-muted" />,
      offline: <WifiOff className="h-8 w-8 text-muted" />,
    };
    return icons[id];
  };

  const renderEmpty = (tab: TabId) => (
    <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          {tabIcon(tab)}
        </div>
        <p className="text-lg font-semibold text-white">
          {emptyMessages[tab].title}
        </p>
        <p className="mt-1 text-sm text-muted">
          {emptyMessages[tab].subtitle}
        </p>
      </div>
    </div>
  );

  const renderLoading = (type: "grid" | "list") => {
    if (type === "grid") {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  };

  const renderPlaylistCard = (
    href: string,
    title: string,
    rawCoverImage: string | null,
    subtitle: string,
    playlist?: PlaylistType,
    savedSection?: { sectionId: string }
  ) => {
    const coverImage = proxiedImageUrl(rawCoverImage);
    return (
    <Link key={href} href={href}>
      {playlist ? (
        <PlaylistContextMenu
          playlist={playlist}
          onProfileVisibilityChange={(next) =>
            setData((prev) => ({
              ...prev,
              playlists: prev.playlists.map((p) =>
                p.id === playlist.id ? { ...p, showOnProfile: next } : p
              ),
            }))
          }
          onRemove={() =>
            setData((prev) => ({
              ...prev,
              playlists: prev.playlists.filter((p) => p.id !== playlist.id),
            }))
          }
        >
          <GlowingCard className="group cursor-pointer p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/5">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-secondary/20">
                  <ListMusic className="h-12 w-12 text-muted" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 truncate text-xs text-muted">{subtitle}</p>
          </GlowingCard>
        </PlaylistContextMenu>
      ) : savedSection ? (
        <SavedSectionContextMenu
          sectionId={savedSection.sectionId}
          onRemove={() =>
            setData((prev) => ({
              ...prev,
              savedSections: prev.savedSections.filter((s) => s.sectionId !== savedSection.sectionId),
            }))
          }
        >
          <GlowingCard className="group cursor-pointer p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/5">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-secondary/20">
                  <ListMusic className="h-12 w-12 text-muted" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 truncate text-xs text-muted">{subtitle}</p>
          </GlowingCard>
        </SavedSectionContextMenu>
      ) : (
        <GlowingCard className="group cursor-pointer p-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/5">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-secondary/20">
                <ListMusic className="h-12 w-12 text-muted" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
            </div>
          </div>
          <h3 className="mt-3 truncate text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 truncate text-xs text-muted">{subtitle}</p>
        </GlowingCard>
      )}
    </Link>
  );
  };

  const renderPlaylists = () => {
    if (loading.playlists) return renderLoading("grid");
    if (data.playlists.length === 0 && data.savedSections.length === 0) return renderEmpty("playlists");

    return (
      <div
        className={cn(
          "grid gap-4",
          libraryCompactView
            ? "grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        )}
      >
        {data.savedSections.map((s) =>
          renderPlaylistCard(
            `/section/${s.sectionId}`,
            s.title,
            s.coverImage ?? null,
            t("mix"),
            undefined,
            s
          )
        )}
        {data.playlists.map((playlist) =>
          renderPlaylistCard(
            `/playlist/${playlist.id}`,
            playlist.title,
            playlist.coverImage ?? null,
            `${playlist.songs?.length ?? 0} ${t("song")}`,
            playlist
          )
        )}
      </div>
    );
  };

  const renderLiked = () => {
    if (loading.liked) return renderLoading("list");
    if (data.liked.length === 0) return renderEmpty("liked");

    return (
      <div className="rounded-xl">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted">
          <span className="w-8 text-center">#</span>
          <span>Başlık</span>
          <span className="flex items-center gap-1">
            <Music className="h-3.5 w-3.5" />
            Süre
          </span>
        </div>
        {data.liked.map((song, index) => (
          <button
            key={`${song.id}-${index}`}
            onClick={() => handlePlaySong(song, index)}
            className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
          >
            <span className="w-8 text-center text-sm text-muted group-hover:hidden">
              {index + 1}
            </span>
            <Play className="hidden h-4 w-4 w-8 text-center text-white group-hover:block" />
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/5">
                {proxiedImageUrl(song.coverImage) ? (
                  <Image
                    src={proxiedImageUrl(song.coverImage)!}
                    alt={song.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Music className="h-4 w-4 text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {song.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {song.artist?.name ?? t("unknownArtist")}
                </p>
              </div>
            </div>
            <span className="text-sm text-muted">
              {formatDuration(song.duration)}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderAlbums = () => {
    if (loading.albums) return renderLoading("grid");
    if (data.albums.length === 0) return renderEmpty("albums");

    return (
      <div
        className={cn(
          "grid gap-4",
          libraryCompactView
            ? "grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        )}
      >
        {data.albums.map((album) => (
          <Link key={album.id} href={`/album/${album.id}`}>
            <GlowingCard className="group cursor-pointer p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/5">
                {proxiedImageUrl(album.coverImage) ? (
                  <Image
                    src={proxiedImageUrl(album.coverImage)!}
                    alt={album.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-secondary/20">
                    <Disc className="h-12 w-12 text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg">
                    <Play className="h-5 w-5 fill-white text-white" />
                  </div>
                </div>
              </div>
              <h3 className="mt-3 truncate text-sm font-semibold text-white">
                {album.title}
              </h3>
              <p className="mt-1 truncate text-xs text-muted">
                {album.artist?.name ?? t("unknownArtist")} ·{" "}
                {new Date(album.releaseDate).getFullYear()}
              </p>
            </GlowingCard>
          </Link>
        ))}
      </div>
    );
  };

  const renderArtists = () => {
    if (loading.artists) return renderLoading("grid");
    if (data.artists.length === 0) return renderEmpty("artists");

    return (
      <div
        className={cn(
          "grid gap-4",
          libraryCompactView
            ? "grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        )}
      >
        {data.artists.map((artist) => (
          <Link key={artist.id} href={`/artist/${artist.id}`}>
            <GlowingCard className="group cursor-pointer p-4">
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-white/5">
                {artist.profileImage ? (
                  <Image
                    src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
                    alt={artist.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-secondary/20">
                    <Users className="h-12 w-12 text-muted" />
                  </div>
                )}
              </div>
              <h3 className="mt-3 truncate text-center text-sm font-semibold text-white">
                {artist.name}
              </h3>
              <p className="mt-1 truncate text-center text-xs text-muted">
                {t("artist")}
              </p>
            </GlowingCard>
          </Link>
        ))}
      </div>
    );
  };

  const handlePlayOfflineSong = (song: SongType, index: number) => {
    setPlaylistPlayback("library-offline", data.offline, index, t("offline"));
    setActiveSong(song);
  };

  const renderOffline = () => {
    if (loading.offline) return renderLoading("list");
    if (data.offline.length === 0) return renderEmpty("offline");

    return (
      <div className="rounded-xl">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted">
          <span className="w-8 text-center">#</span>
          <span>{t("title")}</span>
          <span className="flex items-center gap-1">
            <Music className="h-3.5 w-3.5" />
            {t("duration")}
          </span>
        </div>
        {data.offline.map((song, index) => (
          <SongContextMenu key={song.id} song={song}>
            <button
              onClick={() => handlePlayOfflineSong(song, index)}
              className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="w-8 text-center text-sm text-muted group-hover:hidden">
                {index + 1}
              </span>
              <Play className="hidden h-4 w-4 w-8 text-center text-white group-hover:block" />
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/5">
                  {proxiedImageUrl(song.coverImage) ? (
                    <Image
                      src={proxiedImageUrl(song.coverImage)!}
                      alt={song.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-4 w-4 text-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{song.title}</p>
                  <p className="truncate text-xs text-muted">
                    {song.artist?.name ?? t("unknownArtist")}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted">{formatDuration(song.duration)}</span>
            </button>
          </SongContextMenu>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "playlists":
        return renderPlaylists();
      case "liked":
        return renderLiked();
      case "albums":
        return renderAlbums();
      case "artists":
        return renderArtists();
      case "offline":
        return renderOffline();
    }
  };

  return (
    <div className="space-y-8">
      <SpotifyPlaylistImportModal
        isOpen={importModalOpen}
        onClose={closeImportModal}
        onSuccess={() => {
          setFetched((prev) => ({ ...prev, playlists: false }));
          fetchTab("playlists", true, true);
        }}
      />
      <ScrollReveal>
        <h1 className="text-3xl font-bold text-white">{t("myLibrary")}</h1>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "bg-white/5 text-muted hover:bg-white/10 hover:text-white"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>{renderContent()}</ScrollReveal>
    </div>
  );
}
