"use client";

import { useCallback } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import type { SongType } from "@/types";

export function useStartRadio() {
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setQueue = useQueueStore((s) => s.setQueue);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);

  return useCallback(
    async (song: SongType) => {
      clearPlaylistPlayback();
      const params = new URLSearchParams({ songId: song.id, limit: "30" });
      try {
        const res = await fetch(`/api/radio?${params}`);
        const songs: SongType[] = res.ok ? await res.json() : [];
        if (songs.length > 0) {
          setQueue(songs, 0, "queue");
          setActiveSong(songs[0]);
        } else {
          setQueue([song], 0, "queue");
          setActiveSong(song);
        }
      } catch {
        setQueue([song], 0, "queue");
        setActiveSong(song);
      }
    },
    [setActiveSong, setQueue, clearPlaylistPlayback]
  );
}
