"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";

export function ListeningBroadcaster() {
  const { data: session, status } = useSession();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shareListening = useSettingsStore((s) => s.shareListeningActivity ?? true);
  const prefsSynced = useSettingsStore((s) => s.prefsSyncedFromServer);
  const pauseClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const send = useCallback(
    async (
      songId: string | null,
      snapshot?: { title: string; artistName: string | null; coverImage: string | null },
      listenOpts?: { isPlaying: boolean }
    ) => {
      if (status !== "authenticated" || !session?.user?.id) return;
      const { progress, duration } = usePlayerStore.getState();
      const durationSec = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : null;
      const progressSec = Number.isFinite(progress) && progress >= 0 ? Math.floor(progress) : null;
      const isPlaying = listenOpts?.isPlaying !== false;
      try {
        await fetch("/api/me/listening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            songId === null
              ? { songId: null }
              : {
                  songId,
                  snapshot,
                  progressSec,
                  durationSec,
                  isPlaying,
                }
          ),
        });
      } catch {}
    },
    [session?.user?.id, status]
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (!prefsSynced)
      return;

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    if (pauseClearTimer.current) {
      clearTimeout(pauseClearTimer.current);
      pauseClearTimer.current = null;
    }

    if (!shareListening) {
      void send(null);
      return;
    }

    if (!activeSong?.id) {
      void send(null);
      return;
    }

    const snapshot = {
      title: activeSong.title,
      artistName: activeSong.artist?.name ?? null,
      coverImage: activeSong.coverImage ?? null,
    };

    if (!isPlaying) {
      void send(activeSong.id, snapshot, { isPlaying: false });
      pauseClearTimer.current = setTimeout(() => void send(null), 8000);
      return () => {
        if (pauseClearTimer.current) clearTimeout(pauseClearTimer.current);
      };
    }

    void send(activeSong.id, snapshot, { isPlaying: true });
    heartbeatInterval.current = setInterval(
      () => void send(activeSong.id, snapshot, { isPlaying: true }),
      12_000
    );

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };
  }, [
    activeSong?.id,
    isPlaying,
    shareListening,
    prefsSynced,
    send,
    session?.user?.id,
    status,
  ]);

  return null;
}
