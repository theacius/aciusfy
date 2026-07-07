"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { StevenSelect } from "@/components/ui/StevenSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { cn, formatDuration } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { Loader2, Link2, Music, Copy, Check, ArrowLeft } from "lucide-react";
import Image from "next/image";

type Genre = { id: string; name: string; slug: string };

type PreviewTrack = {
  spotifyTrackId: string;
  title: string;
  artistLabel: string;
  durationMs: number;
  coverImage: string | null;
  openUrl: string;
};

type PreviewData = {
  name: string;
  coverImage: string | null;
  trackCount: number;
  tracks: PreviewTrack[];
};

export function SpotifyPlaylistImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [genreId, setGenreId] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    playlistId: string;
    title: string;
    added: number;
    skipped: number;
  } | null>(null);

  const loadGenres = useCallback(() => {
    fetch("/api/genres")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setGenres(d);
      })
      .catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      setPreview(null);
      setSelected(new Set());
      setCopiedId(null);
      loadGenres();
    }
  }, [isOpen, loadGenres]);

  const selectedCount = selected.size;
  const allIds = useMemo(() => (preview ? preview.tracks.map((x) => x.spotifyTrackId) : []), [preview]);

  const loadPreview = async () => {
    if (!url.trim()) {
      setError(t("spotifyImportNeedFields"));
      return;
    }
    setPreviewLoading(true);
    setError(null);
    setPreview(null);
    try {
      const q = new URLSearchParams({ url: url.trim() });
      const res = await fetch(`/api/playlists/preview-spotify?${q}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("spotifyImportPreviewFailed"));
        return;
      }
      if (!data.tracks || !Array.isArray(data.tracks)) {
        setError(t("spotifyImportPreviewFailed"));
        return;
      }
      const p: PreviewData = {
        name: data.name ?? "Playlist",
        coverImage: data.coverImage ?? null,
        trackCount: data.trackCount ?? data.tracks.length,
        tracks: data.tracks,
      };
      setPreview(p);
      setSelected(new Set(p.tracks.map((tr: PreviewTrack) => tr.spotifyTrackId)));
    } catch {
      setError(t("networkError"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyLink = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {}
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allIds));
  const selectNone = () => setSelected(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !genreId) {
      setError(t("spotifyImportNeedFields"));
      return;
    }
    if (preview && selectedCount === 0) {
      setError(t("spotifyImportNoTracksSelected"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: {
        spotifyUrl: string;
        genreId: string;
        spotifyTrackIds?: string[];
      } = { spotifyUrl: url.trim(), genreId };
      if (preview && selectedCount > 0) {
        body.spotifyTrackIds = Array.from(selected);
      }
      const res = await fetch("/api/playlists/import-spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("actionFailed"));
        return;
      }
      setResult({
        playlistId: data.playlistId,
        title: data.title,
        added: data.added ?? 0,
        skipped: data.skipped ?? 0,
      });
      onSuccess?.(data.playlistId);
      window.dispatchEvent(new Event("playlist-updated"));
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className={cn("max-h-[min(90vh,720px)] overflow-hidden p-0", preview && !result ? "max-w-2xl" : "max-w-md")}
    >
      <div className="flex max-h-[min(90vh,720px)] flex-col p-6 pt-5">
        <div className="mb-5 flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB954]/30 to-[#1ed760]/10">
            <Link2 className="h-5 w-5 text-[#1ed760]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t("spotifyImportTitle")}</h2>
            <p className="mt-1 text-sm text-white/50">{t("spotifyImportSubtitle")}</p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-white/90">
              {t("spotifyImportDone")}{" "}
              <span className="font-semibold text-white">{result.title}</span> — {result.added}{" "}
              {t("spotifyImportTracks")}, {result.skipped} {t("spotifyImportSkipped")}.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/playlist/${result.playlistId}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white/90"
              >
                <Music className="h-4 w-4" />
                {t("spotifyImportOpenPlaylist")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setUrl("");
                  setPreview(null);
                  setSelected(new Set());
                }}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                {t("spotifyImportAnother")}
              </button>
            </div>
          </div>
        ) : !preview ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadPreview();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                {t("spotifyImportUrlLabel")}
              </label>
              <input
                type="url"
                name="url"
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                disabled={previewLoading}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <p className="text-center text-[11px] text-white/35">{t("spotifyImportLimitNote")}</p>
            <button
              type="submit"
              disabled={previewLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] py-2.5 text-sm font-semibold text-black transition hover:bg-[#1ed760]",
                previewLoading && "opacity-70"
              )}
            >
              {previewLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("spotifyImportWorking")}
                </>
              ) : (
                t("spotifyImportLoadPreview")
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
            <p className="text-[11px] leading-snug text-white/45">{t("spotifyImportPreviewHint")}</p>
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-2">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/5">
                {preview.coverImage ? (
                  <Image
                    src={proxiedImageUrl(preview.coverImage) || "/images/placeholder-song.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                ) : null}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{preview.name}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                {t("spotifyImportGenreLabel")}
              </label>
              <StevenSelect
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                disabled={loading}
              >
                <option value="">{t("spotifyImportPickGenre")}</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </StevenSelect>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAll}
                className="text-emerald-400/90 hover:underline"
              >
                {t("spotifyImportSelectAll")} ({allIds.length})
              </button>
              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-white/50 hover:underline"
              >
                {t("spotifyImportSelectNone")}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[480px] text-left text-[12px] text-white/90">
                <thead className="sticky top-0 z-[1] bg-zinc-900/95 backdrop-blur">
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-white/40">
                    <th className="w-8 px-1 py-2" />
                    <th className="px-2 py-2">{t("spotifyImportColTrack")}</th>
                    <th className="px-2 py-2">Spotify</th>
                    <th className="w-12 px-1 py-2 text-right">⏱</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.tracks.map((tr) => {
                    const checked = selected.has(tr.spotifyTrackId);
                    return (
                      <tr
                        key={tr.spotifyTrackId}
                        className={cn("border-b border-white/5", !checked && "opacity-50")}
                      >
                        <td className="px-1 py-1.5 align-middle">
                          <input
                            type="checkbox"
                            className="rounded border-white/20"
                            checked={checked}
                            onChange={() => toggleOne(tr.spotifyTrackId)}
                            disabled={loading}
                          />
                        </td>
                        <td className="px-2 py-1.5 align-middle">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white/5">
                              {tr.coverImage ? (
                                <Image
                                  src={proxiedImageUrl(tr.coverImage) || "/images/placeholder-song.svg"}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                  unoptimized
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{tr.title}</p>
                              <p className="truncate text-[10px] text-white/40">{tr.artistLabel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 align-middle">
                          <button
                            type="button"
                            onClick={() => void copyLink(tr.openUrl, tr.spotifyTrackId)}
                            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/80 hover:bg-white/15"
                            title={t("spotifyImportCopySpotifyLink")}
                          >
                            {copiedId === tr.spotifyTrackId ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedId === tr.spotifyTrackId ? t("spotifyImportCopied") : t("spotifyImportCopySpotifyLink")}
                          </button>
                        </td>
                        <td className="pr-2 text-right text-[10px] text-white/50 tabular-nums">
                          {formatDuration(Math.floor(tr.durationMs / 1000))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setSelected(new Set());
                  setError(null);
                }}
                className="inline-flex items-center justify-center gap-1 text-sm text-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("spotifyImportBack")}
              </button>
              <button
                type="submit"
                disabled={loading || !genreId}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] py-2.5 text-sm font-semibold text-black transition hover:bg-[#1ed760] sm:w-auto sm:min-w-[200px]",
                  (loading || !genreId) && "opacity-60"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("spotifyImportWorking")}
                  </>
                ) : (
                  `${t("spotifyImportImportSelected")} (${selectedCount})`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AnimatedModal>
  );
}
