"use client";

import { useState, useEffect, useCallback } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useModalStore } from "@/store/modalStore";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { ListMusic, Loader2, Check } from "lucide-react";
import Image from "next/image";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import type { PlaylistType } from "@/types";

export function AddToPlaylistModal() {
  const { t } = useTranslation();
  const { addToPlaylistSong, isAddToPlaylistOpen, closeAddToPlaylistModal } = useModalStore();
  const [playlists, setPlaylists] = useState<PlaylistType[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [alreadyIn, setAlreadyIn] = useState<Set<string>>(new Set());

  const fetchPlaylists = useCallback(
    (silent = false) => {
      if (!isAddToPlaylistOpen) return;
      if (!silent) setLoading(true);
      fetch("/api/playlists")
        .then((r) => r.json())
        .then((data) => {
          const list = data?.playlists ?? (Array.isArray(data) ? data : []);
          setPlaylists(list);
        })
        .catch(() => setPlaylists([]))
        .finally(() => !silent && setLoading(false));
    },
    [isAddToPlaylistOpen]
  );

  useEffect(() => {
    if (!isAddToPlaylistOpen) return;
    setAddedTo(new Set());
    setAlreadyIn(new Set());
    fetchPlaylists();
  }, [isAddToPlaylistOpen, fetchPlaylists]);

  useRefreshInterval(() => fetchPlaylists(true), 5000, isAddToPlaylistOpen);

  const handleAdd = async (playlistId: string) => {
    if (!addToPlaylistSong) return;
    setAddingTo(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: addToPlaylistSong.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAddedTo((prev) => new Set(prev).add(playlistId));
        window.dispatchEvent(new Event("playlist-updated"));
      } else if (res.status === 409) {
        setAlreadyIn((prev) => new Set(prev).add(playlistId));
      }
    } catch {}
    setAddingTo(null);
  };

  if (!addToPlaylistSong) return null;

  return (
    <AnimatedModal
      isOpen={isAddToPlaylistOpen}
      onClose={closeAddToPlaylistModal}
      className="max-w-md"
    >
      <div className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("addToPlaylist")}
        </h2>
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
            <Image
              src={proxiedImageUrl(addToPlaylistSong.coverImage, addToPlaylistSong.audioUrl) || "/images/placeholder-song.svg"}
              alt={addToPlaylistSong.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white">{addToPlaylistSong.title}</p>
            <p className="truncate text-sm text-muted">
              {addToPlaylistSong.artist?.name || t("unknownArtist")}
            </p>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("noPlaylistsYet")}
            </p>
          ) : (
            <div className="space-y-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  disabled={addingTo === pl.id || addedTo.has(pl.id) || alreadyIn.has(pl.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/10">
                    {pl.coverImage ? (
                      <Image
                        src={proxiedImageUrl(pl.coverImage) || "/images/placeholder-song.svg"}
                        alt={pl.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ListMusic className="h-5 w-5 text-muted" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-white">
                    {pl.title}
                  </span>
                  {addingTo === pl.id ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-accent" />
                  ) : addedTo.has(pl.id) ? (
                    <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
                  ) : alreadyIn.has(pl.id) ? (
                    <span className="text-xs text-muted">{t("alreadyInPlaylist")}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
}
