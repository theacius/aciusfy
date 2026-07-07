"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import type { SongType } from "@/types";

export type UnlockAndPlayFn = (
  songOverride?: Pick<SongType, "id" | "title" | "audioUrl" | "coverImage" | "previewVideoUrl"> & {
    artist?: { name: string };
  } | null
) => void;

function resolveArtworkUrl(cover: string | null | undefined): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const fallback = `${origin}/images/placeholder-song.svg`;
  if (!cover) return fallback;
  if (cover.startsWith("http://") || cover.startsWith("https://") || cover.startsWith("data:")) {
    return cover;
  }
  if (cover.startsWith("/")) return `${origin}${cover}`;
  return cover;
}

export function useMediaSessionSync(seekTo: (time: number) => void, unlockAndPlay: UnlockAndPlayFn) {
  const seekRef = useRef(seekTo);
  const unlockRef = useRef(unlockAndPlay);

  useEffect(() => {
    seekRef.current = seekTo;
    unlockRef.current = unlockAndPlay;
  }, [seekTo, unlockAndPlay]);

  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    const ms = navigator.mediaSession;

    const handlePlay = () => {
      const s = usePlayerStore.getState();
      if (!s.activeSong) return;
      if (!s.isPlaying) unlockRef.current();
    };

    const handlePause = () => {
      const s = usePlayerStore.getState();
      if (s.activeSong && s.isPlaying) usePlayerStore.getState().togglePlay();
    };

    const handlePrev = () => {
      const prev = useQueueStore.getState().prevSong();
      if (prev) usePlayerStore.getState().setActiveSong(prev);
    };

    const handleNext = () => {
      const next = useQueueStore.getState().nextSong();
      if (next) usePlayerStore.getState().setActiveSong(next);
    };

    const handleSeekBack = (details?: MediaSessionActionDetails) => {
      const offset =
        details && typeof details.seekOffset === "number" && details.seekOffset > 0
          ? details.seekOffset
          : 10;
      const s = usePlayerStore.getState();
      if (!s.activeSong) return;
      seekRef.current(Math.max(0, s.progress - offset));
    };

    const handleSeekForward = (details?: MediaSessionActionDetails) => {
      const offset =
        details && typeof details.seekOffset === "number" && details.seekOffset > 0
          ? details.seekOffset
          : 10;
      const s = usePlayerStore.getState();
      if (!s.activeSong) return;
      const dur = s.duration > 0 ? s.duration : s.progress + offset;
      seekRef.current(Math.min(dur, s.progress + offset));
    };

    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime != null && Number.isFinite(details.seekTime)) {
        seekRef.current(Math.max(0, details.seekTime));
      }
    };

    ms.setActionHandler("play", handlePlay);
    ms.setActionHandler("pause", handlePause);
    ms.setActionHandler("previoustrack", handlePrev);
    ms.setActionHandler("nexttrack", handleNext);
    ms.setActionHandler("seekbackward", handleSeekBack);
    ms.setActionHandler("seekforward", handleSeekForward);
    try {
      ms.setActionHandler("seekto", handleSeekTo);
    } catch {}

    return () => {
      (["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"] as const).forEach(
        (action) => {
          try {
            ms.setActionHandler(action, null);
          } catch {}
        }
      );
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    const ms = navigator.mediaSession;

    if (!activeSong) {
      ms.metadata = null;
      ms.playbackState = "none";
      try {
        ms.setPositionState();
      } catch {}
      return;
    }

    const title = activeSong.title;
    const artist = activeSong.artist?.name?.trim() || "Unknown Artist";
    const src = resolveArtworkUrl(activeSong.coverImage);
    const mime = src.includes(".svg") ? "image/svg+xml" : "image/jpeg";

    try {
      ms.metadata = new MediaMetadata({
        title,
        artist,
        artwork: src ? [{ src, sizes: "512x512", type: mime }] : [],
      });
    } catch {}

    ms.playbackState = isPlaying ? "playing" : "paused";
  }, [activeSong, isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    if (!activeSong) return;

    if (!Number.isFinite(duration) || duration <= 0) {
      try {
        navigator.mediaSession.setPositionState();
      } catch {}
      return;
    }

    const pos = Math.min(Math.max(progress, 0), duration);
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: isPlaying ? 1 : 0,
        position: pos,
      });
    } catch {}
  }, [activeSong?.id, progress, duration, isPlaying]);
}
