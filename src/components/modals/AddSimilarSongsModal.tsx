"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { Loader2, Music, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDuration } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import type { SongType } from "@/types";

interface SimilarSong {
  id: string;
  title: string;
  duration: number;
  coverImage: string | null;
  artist?: { id: string; name: string } | null;
}

interface AddSimilarSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  seedSongs: SongType[];
  existingSongIds: string[];
  onAdded?: (count: number) => void;
}

export function AddSimilarSongsModal({
  isOpen,
  onClose,
  playlistId,
  seedSongs,
  existingSongIds,
  onAdded,
}: AddSimilarSongsModalProps) {
  const { t } = useTranslation();
  const existingIdsKey = useMemo(() => existingSongIds.join(","), [existingSongIds]);
  const [suggestions, setSuggestions] = useState<SimilarSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || seedSongs.length === 0) {
      setSuggestions([]);
      setSelected(new Set());
      setError(null);
      return;
    }
    const existing = new Set(existingSongIds);
    setLoading(true);
    setError(null);
    const seen = new Set<string>();
    const results: SimilarSong[] = [];
    const toFetch = seedSongs.slice(0, 4);

    Promise.all(
      toFetch.map((s) =>
        fetch(`/api/songs/similar?songId=${encodeURIComponent(s.id)}&limit=8`).then((r) =>
          r.ok ? r.json() : []
        )
      )
    )
      .then((arrays) => {
        for (const arr of arrays) {
          for (const s of arr ?? []) {
            if (!s?.id || seen.has(s.id) || existing.has(s.id)) continue;
            seen.add(s.id);
            results.push({
              id: s.id,
              title: s.title,
              duration: s.duration ?? 0,
              coverImage: s.coverImage ?? null,
              artist: s.artist ? { id: s.artist.id, name: s.artist.name } : null,
            });
          }
        }
        setSuggestions(results.slice(0, 20));
      })
      .catch(() => setError("suggestionsLoadError"))
      .finally(() => setLoading(false));
  }, [isOpen, seedSongs, existingIdsKey]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((s) => s.id)));
    }
  };

  const handleAdd = async () => {
    if (selected.size === 0 || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        onAdded?.(data.added ?? selected.size);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
        onClose();
      } else {
        setError(data?.error ?? "addSongsError");
      }
    } catch {
      setError("connectionError");
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4 p-6 pt-12">
        <h2 className="text-xl font-bold text-white">{t("addSimilarSongs") ?? "Benzer şarkılar ekle"}</h2>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-muted" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-8 text-center text-muted">
            {error ? (
              <p>
                {error === "suggestionsLoadError"
                  ? (t("suggestionsLoadError") ?? "Öneriler yüklenemedi")
                  : error === "addSongsError"
                    ? (t("addSongsError") ?? "Şarkılar eklenemedi")
                    : error === "connectionError"
                      ? t("connectionError")
                      : error}
              </p>
            ) : (
              <>
                <Music className="h-12 w-12 opacity-50" />
                <p>{t("noSimilarSongs") ?? "Benzer şarkı bulunamadı"}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm font-medium text-white hover:underline"
              >
                {selected.size === suggestions.length ? t("deselectAll") ?? "Tümünü kaldır" : t("selectAll") ?? "Tümünü seç"}
              </button>
              <span className="text-sm text-muted">
                {selected.size} / {suggestions.length}
              </span>
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-1 rounded-lg border border-white/10 p-1">
              {suggestions.map((song) => (
                <label
                  key={song.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(song.id)}
                    onChange={() => toggleSelect(song.id)}
                    className="h-4 w-4 rounded border-white/30"
                  />
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                    {proxiedImageUrl(song.coverImage) ? (
                      <Image src={proxiedImageUrl(song.coverImage)!} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10">
                        <Music className="h-5 w-5 text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{song.title}</p>
                    <p className="truncate text-xs text-muted">{song.artist?.name ?? t("unknownArtist")}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDuration(song.duration)}</span>
                </label>
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-400">
                {error === "suggestionsLoadError"
                  ? t("suggestionsLoadError")
                  : error === "addSongsError"
                    ? t("addSongsError")
                    : error === "connectionError"
                      ? t("connectionError")
                      : error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                {t("cancel") ?? "İptal"}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={selected.size === 0 || adding}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:bg-white/90 disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {adding ? (t("saving") ?? "Ekleniyor...") : `${t("add") ?? "Ekle"} (${selected.size})`}
              </button>
            </div>
          </>
        )}
      </div>
    </AnimatedModal>
  );
}
