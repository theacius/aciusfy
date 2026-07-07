import { create } from "zustand";
import { SongType } from "@/types";

export interface PlaylistPlayback {
  playlistId: string;
  playlistTitle?: string;
  songs: SongType[];
  currentIndex: number;
}

interface QueueState {
  queue: SongType[]
  originalQueue: SongType[];
  currentIndex: number;
  isQueueOpen: boolean;
  queueSource: "queue" | null
  playlistPlayback: PlaylistPlayback | null
  autoplayList: SongType[]
  autoplayIndex: number;

  setQueue: (songs: SongType[], startIndex?: number, source?: "queue") => void;
  setAutoplayList: (songs: SongType[], startIndex?: number) => void;
  clearAutoplayList: () => void;
  setPlaylistPlayback: (playlistId: string, songs: SongType[], currentIndex: number, playlistTitle?: string) => void;
  clearPlaylistPlayback: () => void;
  addToQueue: (song: SongType) => void;
  addToQueueBatch: (songs: SongType[], options?: { insertAfterCurrent?: boolean }) => void;
  removeFromQueue: (index: number) => void;
  nextSong: () => SongType | null;
  peekNextSong: () => SongType | null;
  prevSong: () => SongType | null;
  shuffleQueue: () => void;
  unshuffleQueue: () => void;
  toggleQueueOpen: () => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  isInQueue: (songId: string) => boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  originalQueue: [],
  currentIndex: 0,
  isQueueOpen: false,
  queueSource: null,
  playlistPlayback: null,
  autoplayList: [],
  autoplayIndex: 0,

  setQueue: (songs, startIndex = 0, source) =>
    set(() => ({
      queue: songs,
      originalQueue: songs,
      currentIndex: startIndex,
      queueSource: source ?? null,
      playlistPlayback: null,
      ...(source !== "queue" && { isQueueOpen: false }),
    })),

  setPlaylistPlayback: (playlistId, songs, currentIndex, playlistTitle) =>
    set(() => ({
      queue: [],
      originalQueue: [],
      currentIndex: 0,
      playlistPlayback: { playlistId, playlistTitle, songs, currentIndex },
      queueSource: null,
      autoplayList: [],
      autoplayIndex: 0,
    })),

  clearPlaylistPlayback: () => set({ playlistPlayback: null, autoplayList: [], autoplayIndex: 0 }),

  setAutoplayList: (songs, startIndex = 0) =>
    set({ autoplayList: songs, autoplayIndex: startIndex }),

  clearAutoplayList: () => set({ autoplayList: [], autoplayIndex: 0 }),

  addToQueue: (song) =>
    set((state) => ({
      queue: [...state.queue, song],
      originalQueue: [...state.originalQueue, song],
    })),

  addToQueueBatch: (songs, options) =>
    set((state) => {
      if (options?.insertAfterCurrent && songs.length > 0) {
        const idx = state.currentIndex;
        const newQueue = [...state.queue.slice(0, idx + 1), ...songs, ...state.queue.slice(idx + 1)];
        const newOriginal = [...state.originalQueue.slice(0, idx + 1), ...songs, ...state.originalQueue.slice(idx + 1)];
        return { queue: newQueue, originalQueue: newOriginal };
      }
      return {
        queue: [...state.queue, ...songs],
        originalQueue: [...state.originalQueue, ...songs],
      };
    }),

  removeFromQueue: (index) =>
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      return {
        queue: newQueue,
        currentIndex:
          index < state.currentIndex
            ? state.currentIndex - 1
            : state.currentIndex,
      };
    }),

  nextSong: () => {
    const { queue, currentIndex, queueSource, playlistPlayback, autoplayList, autoplayIndex } = get();
    if (queueSource === "queue" && currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      set({ currentIndex: nextIdx });
      return queue[nextIdx];
    }
    if (playlistPlayback) {
      const { songs, currentIndex: idx } = playlistPlayback;
      if (idx < songs.length - 1) {
        const nextIdx = idx + 1;
        set({ playlistPlayback: { ...playlistPlayback, currentIndex: nextIdx } });
        return songs[nextIdx];
      }
    }
    if (autoplayList.length > 0 && autoplayIndex < autoplayList.length - 1) {
      const nextIdx = autoplayIndex + 1;
      set({ autoplayIndex: nextIdx });
      return autoplayList[nextIdx];
    }
    return null;
  },

  peekNextSong: () => {
    const { queue, currentIndex, queueSource, playlistPlayback, autoplayList, autoplayIndex } = get();
    if (queueSource === "queue" && currentIndex < queue.length - 1) return queue[currentIndex + 1];
    if (playlistPlayback) {
      const { songs, currentIndex: idx } = playlistPlayback;
      if (idx < songs.length - 1) return songs[idx + 1];
    }
    if (autoplayList.length > 0 && autoplayIndex < autoplayList.length - 1) return autoplayList[autoplayIndex + 1];
    return null;
  },

  prevSong: () => {
    const { queue, currentIndex, queueSource, playlistPlayback, autoplayList, autoplayIndex } = get();
    if (queueSource === "queue" && currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      set({ currentIndex: prevIdx });
      return queue[prevIdx];
    }
    if (playlistPlayback) {
      const { songs, currentIndex: idx } = playlistPlayback;
      if (idx > 0) {
        const prevIdx = idx - 1;
        set({ playlistPlayback: { ...playlistPlayback, currentIndex: prevIdx } });
        return songs[prevIdx];
      }
    }
    if (autoplayList.length > 0 && autoplayIndex > 0) {
      const prevIdx = autoplayIndex - 1;
      set({ autoplayIndex: prevIdx });
      return autoplayList[prevIdx];
    }
    return null;
  },

  reorderQueue: (fromIndex, toIndex) =>
    set((state) => {
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      let newCurrentIndex = state.currentIndex;
      if (fromIndex === state.currentIndex) {
        newCurrentIndex = toIndex;
      } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
        newCurrentIndex = state.currentIndex - 1;
      } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
        newCurrentIndex = state.currentIndex + 1;
      }
      return { queue: newQueue, currentIndex: newCurrentIndex };
    }),

  isInQueue: (songId) => get().queue.some((s) => s.id === songId),

  shuffleQueue: () =>
    set((state) => {
      const currentSong = state.queue[state.currentIndex];
      const remaining = state.queue.filter((_, i) => i !== state.currentIndex);
      const shuffled = shuffleArray(remaining);
      return {
        queue: [currentSong, ...shuffled],
        currentIndex: 0,
      };
    }),

  unshuffleQueue: () =>
    set((state) => {
      const currentSong = state.queue[state.currentIndex];
      const originalIdx = state.originalQueue.findIndex(
        (s) => s.id === currentSong?.id
      );
      return {
        queue: state.originalQueue,
        currentIndex: originalIdx >= 0 ? originalIdx : 0,
      };
    }),

  toggleQueueOpen: () =>
    set((state) => ({ isQueueOpen: !state.isQueueOpen })),

  clearQueue: () =>
    set({ queue: [], originalQueue: [], currentIndex: 0, queueSource: null, playlistPlayback: null }),
}));
