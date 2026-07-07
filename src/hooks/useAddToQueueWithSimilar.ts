"use client";

import { useCallback } from "react";
import { useQueueStore } from "@/store/queueStore";
import type { SongType } from "@/types";

const SIMILAR_LIMIT = 8;

export interface UseAddToQueueWithSimilarOptions {
  insertAfterCurrent?: boolean
}

export function useAddToQueueWithSimilar(options?: UseAddToQueueWithSimilarOptions) {
  const queue = useQueueStore((s) => s.queue);
  const addToQueue = useQueueStore((s) => s.addToQueue);
  const addToQueueBatch = useQueueStore((s) => s.addToQueueBatch);
  const insertAfterCurrent = options?.insertAfterCurrent ?? false;

  const queueKey = (s: SongType) =>
    `${s.artistId}|${(s.title ?? "").trim().toLowerCase()}`;

  return useCallback(
    async (song: SongType) => {
      const queueIds = new Set(queue.map((s) => s.id));
      const queueByKey = new Set(queue.map((s) => queueKey(s)));
      const toAdd: SongType[] = [];

      if (!queueIds.has(song.id) && !queueByKey.has(queueKey(song))) {
        toAdd.push(song);
        queueIds.add(song.id);
        queueByKey.add(queueKey(song));
      }

      try {
        const res = await fetch(
          `/api/songs/similar?songId=${encodeURIComponent(song.id)}&limit=${SIMILAR_LIMIT}`
        );
        if (res.ok) {
          const similar: SongType[] = await res.json();
          for (const s of similar) {
            if (!queueIds.has(s.id) && !queueByKey.has(queueKey(s))) {
              toAdd.push(s);
              queueIds.add(s.id);
              queueByKey.add(queueKey(s));
            }
          }
        }
      } catch {}

      if (toAdd.length === 0) return;
      if (toAdd.length === 1 && !insertAfterCurrent) addToQueue(toAdd[0]);
      else addToQueueBatch(toAdd, insertAfterCurrent ? { insertAfterCurrent: true } : undefined);
    },
    [queue, addToQueue, addToQueueBatch, insertAfterCurrent]
  );
}
