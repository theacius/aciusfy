"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { showErrorToast } from "@/store/toastStore";
import { motion, AnimatePresence } from "framer-motion";
import { Podcast as PodcastIcon, Plus, Trash2, Play, Pause, Clock, Loader2, Rss, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  title: string;
  description?: string | null;
  audioUrl: string;
  duration: number;
  publishedAt?: string | null;
  imageUrl?: string | null;
  progress: number;
  completed: boolean;
}

interface PodcastData {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  episodes: Episode[];
}

function formatDuration(s: number) {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function PodcastsPage() {
  const { t } = useTranslation();
  const [podcasts, setPodcasts] = useState<PodcastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState("");
  const [expandedPodcast, setExpandedPodcast] = useState<string | null>(null);
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const fetchPodcasts = useCallback(() => {
    setLoading(true);
    fetch("/api/podcasts")
      .then((r) => r.json())
      .then((d) => setPodcasts(d.podcasts ?? []))
      .catch(() => showErrorToast(t("podcastLoadError")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPodcasts(); }, [fetchPodcasts]);

  const handleAdd = async () => {
    if (!feedUrl.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: feedUrl.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setAddError(d.error || "Error");
        return;
      }
      setFeedUrl("");
      setShowAddForm(false);
      fetchPodcasts();
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu podcasti silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/podcasts?id=${id}`, { method: "DELETE" });
    fetchPodcasts();
  };

  const playEpisode = (episode: Episode, podcast: PodcastData) => {
    const songLike = {
      id: episode.id,
      title: episode.title,
      audioUrl: episode.audioUrl,
      coverImage: episode.imageUrl || podcast.imageUrl || null,
      artist: { name: podcast.author || podcast.title } as { name: string; id?: string },
      duration: episode.duration,
    };
    usePlayerStore.getState().setActiveSong(songLike as import("@/types").SongType);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <PodcastIcon className="h-7 w-7 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">{t("podcasts")}</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
        >
          <Plus className="h-4 w-4" />
          {t("addPodcast")}
        </button>
      </motion.div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Rss className="h-4 w-4 text-muted" />
              <span className="text-sm font-medium text-foreground">{t("podcastFeedUrl")}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={adding || !feedUrl.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("addPodcast")}
              </button>
            </div>
            {addError && <p className="mt-2 text-sm text-danger">{addError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : podcasts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-20"
        >
          <PodcastIcon className="h-16 w-16 text-muted/30" />
          <p className="text-muted">{t("noPodcasts")}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {podcasts.map((podcast, pi) => (
            <motion.div
              key={podcast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.05 }}
              className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
            >
              <div
                className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-card-hover"
                onClick={() => setExpandedPodcast(expandedPodcast === podcast.id ? null : podcast.id)}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-card-hover">
                  {podcast.imageUrl ? (
                    <Image src={podcast.imageUrl} alt={podcast.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <PodcastIcon className="h-8 w-8 text-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">{podcast.title}</h3>
                  {podcast.author && <p className="truncate text-xs text-muted">{podcast.author}</p>}
                  <p className="text-xs text-muted">{podcast.episodes.length} {t("podcastEpisodes").toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(podcast.id); }}
                    className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedPodcast === podcast.id ? (
                    <ChevronUp className="h-4 w-4 text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedPodcast === podcast.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="max-h-80 divide-y divide-border overflow-y-auto">
                      {podcast.episodes.map((ep) => {
                        const isCurrentlyPlaying = activeSong?.id === ep.id;
                        return (
                          <div
                            key={ep.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card-hover",
                              isCurrentlyPlaying && "bg-accent/10"
                            )}
                          >
                            <button
                              onClick={() => playEpisode(ep, podcast)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-110"
                            >
                              {isCurrentlyPlaying && isPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={cn("truncate text-sm", isCurrentlyPlaying ? "font-semibold text-accent" : "text-foreground")}>
                                {ep.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted">
                                {ep.duration > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(ep.duration)}
                                  </span>
                                )}
                                {ep.publishedAt && <span>{formatDate(ep.publishedAt)}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
