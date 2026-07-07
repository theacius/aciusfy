import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { ACIUSFY_LOGO_PNG } from "@/lib/branding";
import { showErrorToast } from "@/store/toastStore";
import {
  Play,
  Shuffle,
  Clock,
  Trash2,
  Loader2,
  Music,
  Pencil,
  ListPlus,
  ListMusic,
  GripVertical,
  Share2,
  Sparkles,
  Heart,
  PlusCircle,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PlaylistEditModal } from "@/components/modals/PlaylistEditModal";
import { AddSimilarSongsModal } from "@/components/modals/AddSimilarSongsModal";
import { PlaylistComments } from "@/components/playlist/PlaylistComments";
import { ShineButton } from "@/components/ui/shine-button";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAddToQueueWithSimilar } from "@/hooks/useAddToQueueWithSimilar";
import { useModalStore } from "@/store/modalStore";
import { SongContextMenu } from "@/components/ui/context-menu";
import { formatDuration, formatPlaylistDurationLabel } from "@/lib/utils";
import type { SongType, PlaylistType, PlaylistSongType } from "@/types";

interface PlaylistUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface PlaylistCollaborator {
  id: string;
  userId: string;
  user: PlaylistUser;
}

interface PlaylistUserWithUsername extends PlaylistUser {
  username?: string | null;
}

interface BlendUser {
  id: string;
  name: string | null;
  avatar: string | null;
  username?: string | null;
}

interface BlendData {
  id: string;
  creatorId: string;
  invitedId: string;
  matchPercentage?: number | null;
  creator: BlendUser;
  invited: BlendUser;
}

interface PlaylistSongWithAddedBy extends PlaylistSongType {
  song: SongType;
  addedBy?: BlendUser | null;
}

interface PlaylistData extends Omit<PlaylistType, "songs"> {
  user: PlaylistUserWithUsername;
  sourceUser?: PlaylistUserWithUsername | null;
  creatorDisplayName?: string;
  creatorUserId?: string | null;
  creatorUsername?: string | null;
  isAciusfyPlaylist?: boolean;
  creatorForUserName?: string | null;
  creatorForUserId?: string | null;
  creatorForUsername?: string | null;
  collaborators?: PlaylistCollaborator[];
  songs: PlaylistSongWithAddedBy[];
  blend?: BlendData | null;
  isSavedByCurrentUser?: boolean;
  savedPlaylistId?: string | null;
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{ status?: number; message?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [similarModalOpen, setSimilarModalOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setPlaylistPlayback = useQueueStore((s) => s.setPlaylistPlayback);
  const addToQueueWithSimilar = useAddToQueueWithSimilar();
  const openAddToPlaylistModal = useModalStore((s) => s.openAddToPlaylistModal);
  const isInQueue = useQueueStore((s) => s.isInQueue);
  const playlistPlayback = useQueueStore((s) => s.playlistPlayback);

  const refetchPlaylist = useCallback(() => {
    if (!id) return;
    fetch(`/api/playlists/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setPlaylist(data))
      .catch(() => showErrorToast(t("playlistLoadError")));
  }, [id, t]);

  useRefreshInterval(refetchPlaylist, 5000, !!id);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchPlaylist = (retry = false) => {
      let willRetry = false;
      const url = `/api/playlists/${id}${retry ? `?t=${Date.now()}` : ""}`;
      fetch(url, { cache: "no-store", credentials: "same-origin" })
        .then(async (res) => {
          let data: unknown;
          try {
            data = await res.json();
          } catch {
            return { error: "Geçersiz yanıt", status: res.status };
          }
          if (!res.ok) {
            const err = data as { error?: string };
            return { error: err?.error, status: res.status };
          }
          return data;
        })
        .then((data) => {
          if (cancelled) return;
          const err = data as { error?: string; status?: number };
          if (err?.error && (err?.status === 404 || err?.status === 403)) {
            setFetchError({ status: err.status, message: err.error });
            if (err?.status === 404) {
              const isUuid = typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
              const isCuid = typeof id === "string" && /^c[a-z0-9]{20,30}$/i.test(id);
              const looksLikeSection =
                !isUuid &&
                !isCuid &&
                typeof id === "string" &&
                id.length < 40 &&
                (id.includes("-") || id === "popular" || /^[a-z0-9_-]+$/i.test(id));
              if (looksLikeSection) {
                router.replace(`/section/${id}`);
                return;
              }
              if (isUuid && !retry) {
                willRetry = true;
                setTimeout(() => fetchPlaylist(true), 600);
                return;
              }
            }
          } else {
            setFetchError(null);
          }
          const pl = data as { id?: string; songs?: unknown[] };
          setPlaylist(pl?.id != null || Array.isArray(pl?.songs) ? (pl as PlaylistData) : null);
        })
        .catch((err) => {
          if (!cancelled) {
            devError(err);
            setFetchError({ status: 0, message: err instanceof Error ? err.message : "Bağlantı hatası" });
            setPlaylist(null);
          }
        })
        .finally(() => {
          if (!cancelled && !willRetry) setLoading(false);
        });
    };

    setLoading(true);
    setFetchError(null);
    fetchPlaylist();
    return () => { cancelled = true; };
  }, [id, router]);

  useEffect(() => {
    const handler = () => refetchPlaylist();
    if (typeof window !== "undefined") {
      window.addEventListener("playlist-updated", handler);
      return () => window.removeEventListener("playlist-updated", handler);
    }
  }, [refetchPlaylist]);

  const allSongs = useMemo(
    () =>
      (playlist?.songs ?? [])
        .sort((a, b) => a.position - b.position)
        .map((ps) => ps.song)
        .filter(Boolean) as SongType[],
    [playlist?.songs]
  );

  useEffect(() => {
    if (!id || !playlist || allSongs.length === 0) return;
    const { playlistPlayback: pp } = useQueueStore.getState();
    if (pp?.playlistId === id) {
      const nextIndex = Math.min(Math.max(0, pp.currentIndex), allSongs.length - 1);
      useQueueStore.setState({
        playlistPlayback: {
          ...pp,
          songs: allSongs,
          playlistTitle: playlist.title,
          currentIndex: nextIndex,
        },
      });
      return;
    }
    const active = usePlayerStore.getState().activeSong;
    const songIdx = active ? allSongs.findIndex((s) => s.id === active.id) : -1;
    setPlaylistPlayback(id, allSongs, songIdx >= 0 ? songIdx : 0, playlist.title);
  }, [id, playlist?.id, playlist?.title, allSongs, setPlaylistPlayback]);

  const handlePlaySong = (song: SongType, index: number) => {
    setPlaylistPlayback(id!, allSongs, index, playlist?.title);
    setActiveSong(song);
  };

  const handlePlayAll = () => {
    if (!allSongs.length) return;
    setPlaylistPlayback(id!, allSongs, 0, playlist?.title);
    setActiveSong(allSongs[0]);
  };

  const handleShufflePlay = () => {
    if (!allSongs.length) return;
    const shuffled = [...allSongs].sort(() => Math.random() - 0.5);
    setPlaylistPlayback(id!, shuffled, 0, playlist?.title);
    setActiveSong(shuffled[0]);
  };

  const handleSaveToLibrary = async () => {
    if (!id || saving || !session?.user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/playlists/${id}/save`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPlaylist((p) =>
          p ? { ...p, isSavedByCurrentUser: true, savedPlaylistId: data.id } : p
        );
        router.push(`/playlist/${data.id}`);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
      } else {
        alert(data.error ?? "Kaydedilemedi");
      }
    } catch (err) {
      devError(err);
      alert("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    const url = typeof window !== "undefined" ? `${window.location.origin}/playlist/${id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      if (typeof window !== "undefined") {
        window.prompt(t("sharePlaylist") ?? "Playlist'i paylaş", url);
      }
    }
  };

  const handleDelete = async () => {
    if (!id || deleting) return;
    if (!confirm("Bu playlist'i silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
      router.push("/library");
    } catch (err) {
      devError(err);
      setDeleting(false);
    }
  };

  const isOwner = session?.user?.id === playlist?.userId;
  const isCollaborator = playlist?.isCollaborative && playlist?.collaborators?.some((c) => c.userId === session?.user?.id);
  const canEdit = (isOwner || !!isCollaborator) && !playlist?.isBuiltIn && !playlist?.blend;
  const totalDuration = (allSongs ?? []).reduce((sum, s) => sum + (s.duration ?? 0), 0);

  const featuredArtistsSummary = (() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const s of allSongs) {
      const n = s.artist?.name?.trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      names.push(n);
    }
    if (names.length === 0) return null;
    const head = names.slice(0, 4);
    const more = t("playlistArtistsMore");
    return names.length > 4 && more.includes("{names}")
      ? more.replace("{names}", head.join(", "))
      : names.join(", ");
  })();

  const sortedSongs = [...(playlist?.songs ?? [])].sort((a, b) => a.position - b.position);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit) return;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    const el = e.currentTarget as HTMLElement;
    if (el) el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el) el.style.opacity = "1";
    setDragIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!canEdit || !playlist || reordering || !id) return;
    const dragIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(dragIdx) || dragIdx === dropIndex || dragIdx < 0 || dragIdx >= sortedSongs.length) return;

    const newOrder = [...sortedSongs];
    const [removed] = newOrder.splice(dragIdx, 1);
    if (!removed?.songId) return;
    newOrder.splice(dropIndex, 0, removed);

    const songIds = newOrder.map((ps) => ps.songId).filter(Boolean);
    if (songIds.length !== newOrder.length) return;

    setPlaylist((p) =>
      p ? { ...p, songs: newOrder.map((ps, i) => ({ ...ps, position: i })) } : p
    );
    setReordering(true);
    const rollbackSongs = [...sortedSongs];

    try {
      const res = await fetch(`/api/playlists/${id}/songs/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Sıra güncellenemedi");
      }
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
    } catch (err) {
      devError(err);
      setPlaylist((p) =>
        p ? { ...p, songs: rollbackSongs.map((ps, i) => ({ ...ps, position: i })) } : p
      );
      alert(err instanceof Error ? err.message : "Sıra güncellenemedi");
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="-mx-3 -mt-3 rounded-b-2xl bg-gradient-to-b from-indigo-950/50 via-zinc-950/40 to-transparent p-6 ring-1 ring-white/[0.06] ring-inset sm:-mx-6 sm:-mt-4 sm:p-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-end">
            <div className="h-60 w-60 flex-shrink-0 rounded-lg bg-white/5 shadow-2xl shadow-black/40 sm:h-64 sm:w-64" />
            <div className="w-full flex-1 space-y-3 text-center lg:text-left">
              <div className="mx-auto h-3 w-40 rounded bg-white/5 lg:mx-0" />
              <div className="mx-auto h-10 w-full max-w-md rounded bg-white/5 lg:mx-0" />
              <div className="mx-auto h-4 w-full max-w-lg rounded bg-white/5 lg:mx-0" />
              <div className="mx-auto h-4 w-56 rounded bg-white/5 lg:mx-0" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-white/5" />
          <div className="h-12 w-12 rounded-full bg-white/5" />
          <div className="h-12 w-12 rounded-full bg-white/5" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-8 rounded bg-white/5" />
              <div className="h-10 w-10 rounded bg-white/5" />
              <div className="h-4 flex-1 rounded bg-white/5" />
              <div className="hidden h-4 w-24 rounded bg-white/5 md:block" />
              <div className="h-4 w-12 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    const errMsg = fetchError?.status === 403
      ? (t("accessDenied") ?? "Bu playlist'e erişim izniniz yok.")
      : fetchError?.message ?? (t("playlistNotFound") ?? "Playlist bulunamadı.");
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted">{errMsg}</p>
        {fetchError != null && (
          <p className="rounded bg-white/5 px-3 py-1.5 font-mono text-sm text-muted">
            {fetchError.status && fetchError.status >= 100
              ? `HTTP ${fetchError.status}`
              : fetchError.message}
          </p>
        )}
      </div>
    );
  }

  const playlistKindLabel = playlist.isPublic
    ? t("playlistKindPublic")
    : t("playlistKindPrivate");

  return (
    <div className="space-y-8">
      <ScrollReveal>
        
        <div className="-mx-3 -mt-3 overflow-hidden rounded-b-2xl bg-gradient-to-br from-indigo-950/70 via-slate-950/80 to-zinc-950 ring-1 ring-white/[0.06] ring-inset sm:-mx-6 sm:-mt-4">
          <div className="bg-gradient-to-b from-blue-950/30 to-transparent px-4 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-9">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end">
          <button
            type="button"
            onClick={() => canEdit && setEditModalOpen(true)}
            className={`relative h-60 w-60 flex-shrink-0 overflow-hidden rounded-lg shadow-2xl shadow-black/50 sm:h-64 sm:w-64 ${
              canEdit ? "cursor-pointer transition-opacity hover:opacity-90" : ""
            }`}
          >
            {playlist.blend ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-400 p-4">
                <div className="mb-2 flex items-center gap-3">
                  {[playlist.blend.creator, playlist.blend.invited].map((u) => (
                    <div key={u.id} className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/30 bg-black/20">
                      {u.avatar ? (
                        <Image src={u.avatar} alt={u.name || ""} width={48} height={48} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/80">
                          {(u.name || "?")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-lg font-extrabold uppercase tracking-widest text-white drop-shadow-lg">Blend</span>
              </div>
            ) : playlist.coverImage ? (
              <Image
                src={proxiedImageUrl(playlist.coverImage) || playlist.coverImage}
                alt={playlist.title}
                fill
                sizes="256px"
                className="object-cover"
                unoptimized={playlist.coverImage.startsWith("/uploads/")}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/5">
                <Music className="h-20 w-20 text-muted" />
              </div>
            )}
            {canEdit && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                <Pencil className="h-10 w-10 text-white" />
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1 space-y-3 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              {playlist.blend ? "Blend" : playlistKindLabel}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {playlist.title}
            </h1>
            {playlist.blend ? (
              <p className="text-sm text-white/70 sm:text-base">
                {playlist.blend.creator.name} ile {playlist.blend.invited.name} için Blend çalma listesi. Her gün yenilenir.
              </p>
            ) : (
              <>
                {featuredArtistsSummary && (
                  <p className="text-sm text-white/70 sm:text-base">
                    {featuredArtistsSummary}
                  </p>
                )}
                {playlist.description && (
                  <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                    {playlist.description}
                  </p>
                )}
              </>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/55 sm:justify-start">
              {playlist.creatorUserId ? (
                <Link
                  href={`/profile/${playlist.creatorUsername || playlist.creatorUserId}`}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                    {playlist.user?.avatar ? (
                      <Image
                        src={playlist.user.avatar}
                        alt={playlist.user.name ?? ""}
                        fill
                        sizes="24px"
                        className="object-cover"
                        unoptimized={playlist.user.avatar.startsWith("/uploads/")}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-medium text-white">
                        {(playlist.user?.name ?? "?")[0]}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-white">
                    {playlist.creatorDisplayName ?? playlist.user?.name ?? "Kullanıcı"}
                  </span>
                </Link>
              ) : playlist.isAciusfyPlaylist ? (
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
                  {playlist.creatorForUserId ? (
                    (() => {
                      const fmt = t("preparedFor") ?? "{name} için hazırlandı";
                      const [prefix, suffix] = fmt.split("{name}");
                      const name =
                        playlist.creatorForUserName === "senin"
                          ? (t("you") ?? "Senin")
                          : (playlist.creatorForUserName ?? "Senin");
                      return (
                        <>
                          {prefix && <span className="text-white/50">{prefix}</span>}
                          <Link
                            href={`/profile/${playlist.creatorForUsername || playlist.creatorForUserId}`}
                            className="text-white transition-opacity hover:opacity-80 hover:underline"
                          >
                            {name}
                          </Link>
                          {suffix && <span className="text-white/50">{suffix}</span>}
                        </>
                      );
                    })()
                  ) : (
                    (() => {
                      const fmt = t("preparedFor") ?? "{name} için hazırlandı";
                      const [prefix, suffix] = fmt.split("{name}");
                      const name =
                        playlist.creatorForUserName === "senin"
                          ? (t("you") ?? "Senin")
                          : (playlist.creatorForUserName ?? "Senin");
                      return (
                        <>
                          {prefix && <span className="text-white/50">{prefix}</span>}
                          <span className="text-white">{name}</span>
                          {suffix && <span className="text-white/50">{suffix}</span>}
                        </>
                      );
                    })()
                  )}
                </div>
              ) : (
                <span className="font-semibold text-white">
                  {playlist.creatorDisplayName ?? playlist.user?.name ?? "Kullanıcı"}
                </span>
              )}
              <span className="text-white/35">&middot;</span>
              <span>
                {allSongs.length} {t("song")}, {formatPlaylistDurationLabel(totalDuration)}
              </span>
            </div>
          </div>
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
            onClick={handleShare}
            className={`rounded-full p-3 transition-colors ${
              shareCopied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-muted hover:bg-white/10 hover:text-white"
            }`}
            title={shareCopied ? (t("linkCopied") ?? "Link kopyalandı") : (t("sharePlaylist") ?? "Playlist'i paylaş")}
          >
            <Share2 className="h-5 w-5" />
          </button>
          {!isOwner && session?.user && (
            playlist.isSavedByCurrentUser && playlist.savedPlaylistId ? (
              <ShineButton
                size="md"
                variant="secondary"
                onClick={() => router.push(`/playlist/${playlist.savedPlaylistId}`)}
              >
                <span className="flex items-center gap-2">
                  <ListPlus className="h-4 w-4" />
                  {t("inLibrary") ?? "Kütüphanede"}
                </span>
              </ShineButton>
            ) : (
              <ShineButton
                size="md"
                variant="secondary"
                onClick={handleSaveToLibrary}
                disabled={saving}
              >
                <span className="flex items-center gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ListPlus className="h-4 w-4" />
                  )}
                  {saving ? (t("saving") ?? "Kaydediliyor...") : (t("saveToLibrary") ?? "Kütüphaneme kaydet")}
                </span>
              </ShineButton>
            )
          )}
          {canEdit && (
            <>
              {allSongs.length > 0 && (
                <button
                  onClick={() => setSimilarModalOpen(true)}
                  className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-white"
                  title={t("addSimilarSongs") ?? "Benzer şarkılar ekle"}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setEditModalOpen(true)}
                className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-white"
                title={t("edit")}
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-white/5 p-3 text-muted transition-colors hover:bg-white/10 hover:text-red-500"
              >
                {deleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>
      </ScrollReveal>

      {canEdit && allSongs.length > 0 && (
        <AddSimilarSongsModal
          isOpen={similarModalOpen}
          onClose={() => setSimilarModalOpen(false)}
          playlistId={id!}
          seedSongs={allSongs.slice(0, 5)}
          existingSongIds={allSongs.map((s) => s.id)}
          onAdded={() => {
            const url = `/api/playlists/${id}`;
            fetch(url).then((r) => r.ok && r.json()).then((data) => setPlaylist(data)).catch(() => showErrorToast(t("playlistLoadError")));
          }}
        />
      )}
      {canEdit && (
        <PlaylistEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          playlist={{
            id: playlist.id,
            title: playlist.title,
            description: playlist.description,
            coverImage: playlist.coverImage,
            isBuiltIn: playlist.isBuiltIn,
            isCollaborative: playlist.isCollaborative,
          }}
          firstSongCover={proxiedImageUrl(allSongs[0]?.coverImage, allSongs[0]?.audioUrl) ?? allSongs[0]?.coverImage}
          isOwner={isOwner}
          collaborators={playlist.collaborators ?? []}
          onSuccess={(data) => {
            setPlaylist((p) =>
              p
                ? {
                    ...p,
                    title: data.title,
                    description: data.description,
                    coverImage: data.coverImage,
                    isCollaborative: data.isCollaborative ?? p.isCollaborative,
                  }
                : p
            );
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
          }}
          onCollaboratorsChange={(collaborators) => {
            setPlaylist((p) => (p ? { ...p, collaborators } : p));
          }}
        />
      )}

      <ScrollReveal delay={0.2}>
        <div className="w-full max-w-full rounded-xl">
          <div
            className={`flex w-full min-w-0 items-center gap-2 border-b border-white/5 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted sm:gap-3 sm:px-4 ${
              canEdit ? "pl-2" : ""
            }`}
          >
            <span className="w-7 shrink-0 text-center sm:w-8">#</span>
            {canEdit && <span className="w-5 shrink-0" aria-hidden />}
            <span className="w-9 shrink-0 sm:w-10" aria-hidden />
            <span className="min-w-0 flex-1 pr-2">Başlık</span>
            <span className="hidden w-36 shrink-0 truncate lg:w-44 xl:w-52 sm:block">
              {t("playlistColumnAlbum")}
            </span>
            {playlist.blend && (
              <span className="hidden w-28 shrink-0 truncate text-xs sm:block lg:w-32">
                Ekleyen
              </span>
            )}
            <span className="flex w-11 shrink-0 items-center justify-end tabular-nums sm:w-12">
              <Clock className="h-4 w-4" />
            </span>
            <span className="w-[5.5rem] shrink-0 sm:w-28" aria-hidden />
          </div>
          {sortedSongs.map((ps, index) => {
            const song = ps.song;
            if (!song) return null;
            return (
              <SongContextMenu key={ps.id ?? `${song.id}-${index}`} song={song}>
                <div
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handlePlaySong(song, index)}
                  className={`group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5 sm:gap-3 sm:px-4 ${
                    dragIndex === index ? "opacity-50" : ""
                  } ${reordering ? "pointer-events-none" : ""}`}
                >
                  <span className="w-7 shrink-0 text-center text-sm text-muted group-hover:hidden sm:w-8">
                    {index + 1}
                  </span>
                  {canEdit && (
                    <div
                      className="flex w-5 shrink-0 cursor-grab items-center justify-center text-muted active:cursor-grabbing sm:w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                  )}
                  <div className="relative flex w-9 shrink-0 items-center justify-center sm:w-10">
                    <Play className="pointer-events-none absolute z-10 hidden h-4 w-4 text-white drop-shadow-md group-hover:block" />
                    <div className="relative h-9 w-9 overflow-hidden rounded sm:h-10 sm:w-10">
                      <Image
                        src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
                        alt={song.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{song.title}</p>
                      <p className="truncate text-xs text-muted">
                        {song.artist?.name ?? t("unknownArtist")}
                      </p>
                    </div>
                    {playlistPlayback?.playlistId === id && playlistPlayback.songs[playlistPlayback.currentIndex]?.id === song.id && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                        {t("nowPlaying")}
                      </span>
                    )}
                    {isInQueue(song.id) && (
                      <span className="flex shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-muted" title={t("queue")}>
                        <ListMusic className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="hidden w-36 shrink-0 truncate text-sm text-muted lg:w-44 xl:w-52 sm:block">
                    {song.album?.title ?? "—"}
                  </span>
                  {playlist.blend && (
                    <span className="hidden w-28 shrink-0 sm:flex lg:w-32">
                      {ps.addedBy ? (
                        <Link
                          href={`/profile/${ps.addedBy.username || ps.addedBy.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 truncate text-sm text-muted transition-colors hover:text-white"
                        >
                          <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                            {ps.addedBy.avatar ? (
                              <Image
                                src={ps.addedBy.avatar}
                                alt={ps.addedBy.name || ""}
                                fill
                                sizes="20px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-white">
                                {(ps.addedBy.name || "?")[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="truncate">{ps.addedBy.name}</span>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </span>
                  )}
                  <span className="w-11 shrink-0 text-right text-sm tabular-nums text-muted sm:w-12">
                    {formatDuration(song.duration)}
                  </span>
                  <div
                    className="flex w-[5.5rem] shrink-0 items-center justify-end gap-0.5 sm:w-28 sm:gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch("/api/likes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ songId: song.id }),
                        });
                      }}
                      className="rounded-full p-2 text-muted opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      title={t("like")}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddToPlaylistModal(song);
                      }}
                      className="rounded-full p-2 text-muted opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      title={t("addToPlaylist")}
                    >
                      <ListPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueueWithSimilar(song);
                      }}
                      className="rounded-full p-2 text-muted opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      title={t("addToQueue")}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </SongContextMenu>
            );
          })}
        </div>
      </ScrollReveal>

      <div className="mt-12">
        <PlaylistComments playlistId={id!} isOwner={isOwner} />
      </div>
    </div>
  );
}
