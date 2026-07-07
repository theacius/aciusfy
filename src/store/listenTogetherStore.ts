import { create } from "zustand";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import type { SongType } from "@/types";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface ListenTogetherState {
  isActive: boolean;
  isHost: boolean;
  sessionCode: string | null;
  hostUserId: string | null;
  participants: Participant[];
  pollTimer: ReturnType<typeof setInterval> | null;
  hostSyncTimer: ReturnType<typeof setInterval> | null;
  lastSyncedSongId: string | null;

  createSession: () => Promise<string>;
  joinSession: (code: string) => Promise<boolean>;
  leaveSession: () => void;
  _startHostSync: () => void;
  _stopHostSync: () => void;
  _startPolling: () => void;
  _stopPolling: () => void;
}

export const useListenTogetherStore = create<ListenTogetherState>((set, get) => ({
  isActive: false,
  isHost: false,
  sessionCode: null,
  hostUserId: null,
  participants: [],
  pollTimer: null,
  hostSyncTimer: null,
  lastSyncedSongId: null,

  createSession: async () => {
    const res = await fetch("/api/listen-together", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409 && data.code) {
        set({
          isActive: true,
          isHost: true,
          sessionCode: data.code,
          hostUserId: null,
        });
        get()._startHostSync();
        get()._startPolling();
        return data.code;
      }
      throw new Error(data.error || "Failed to create session");
    }
    const session = await res.json();
    set({
      isActive: true,
      isHost: true,
      sessionCode: session.code,
      hostUserId: session.hostId,
      participants: session.participants.map((p: { user: Participant }) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
      })),
    });
    get()._startHostSync();
    get()._startPolling();
    return session.code;
  },

  joinSession: async (code: string) => {
    const res = await fetch(`/api/listen-together?code=${code.toUpperCase()}`);
    if (!res.ok) return false;

    const session = await res.json();
    set({
      isActive: true,
      isHost: false,
      sessionCode: session.code,
      hostUserId: session.hostId,
      participants: session.participants.map((p: { user: Participant }) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
      })),
    });
    get()._startPolling();
    return true;
  },

  leaveSession: () => {
    const { isHost, sessionCode } = get();
    get()._stopPolling();
    get()._stopHostSync();

    if (isHost && sessionCode) {
      fetch("/api/listen-together", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sessionCode }),
      }).catch(() => {});
    }

    set({
      isActive: false,
      isHost: false,
      sessionCode: null,
      hostUserId: null,
      participants: [],
      lastSyncedSongId: null,
    });
  },

  _startHostSync: () => {
    get()._stopHostSync();
    const timer = setInterval(() => {
      const { sessionCode, isHost, isActive } = get();
      if (!sessionCode || !isHost || !isActive) return;

      const { activeSong, isPlaying, progress } = usePlayerStore.getState();
      if (!activeSong) return;

      fetch("/api/listen-together/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: sessionCode,
          songId: activeSong.id,
          progress,
          isPlaying,
        }),
      }).catch(() => {});
    }, 2000);

    set({ hostSyncTimer: timer });
  },

  _stopHostSync: () => {
    const { hostSyncTimer } = get();
    if (hostSyncTimer) {
      clearInterval(hostSyncTimer);
      set({ hostSyncTimer: null });
    }
  },

  _startPolling: () => {
    get()._stopPolling();
    const timer = setInterval(async () => {
      const { sessionCode, isActive, isHost } = get();
      if (!sessionCode || !isActive) return;

      try {
        const res = await fetch(`/api/listen-together/sync?code=${sessionCode}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.ended || res.status === 404) {
            get().leaveSession();
          }
          return;
        }
        const data = await res.json();

        set({
          participants: (data.participants || []).map((p: Participant) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
          })),
        });

        if (!isHost && data.songId) {
          const playerState = usePlayerStore.getState();
          const currentSongId = playerState.activeSong?.id;

          if (currentSongId !== data.songId) {
            try {
              const songRes = await fetch(`/api/songs/${data.songId}`);
              if (songRes.ok) {
                const songData = await songRes.json() as SongType;
                useQueueStore.getState().clearQueue();
                usePlayerStore.getState().setActiveSong(songData);
                set({ lastSyncedSongId: data.songId });
              }
            } catch {}
          } else {
            const progressDiff = Math.abs((playerState.progress || 0) - (data.progress || 0));
            if (progressDiff > 4) {
              const audioCtx = document.querySelector<HTMLAudioElement>("audio");
              if (audioCtx) {
                audioCtx.currentTime = data.progress;
              }
              usePlayerStore.getState().setProgress(data.progress || 0);
            }

            if (data.isPlaying && !playerState.isPlaying) {
              usePlayerStore.getState().setIsPlaying(true);
            } else if (!data.isPlaying && playerState.isPlaying) {
              usePlayerStore.getState().setIsPlaying(false);
            }
          }
        }
      } catch {}
    }, 2000);

    set({ pollTimer: timer });
  },

  _stopPolling: () => {
    const { pollTimer } = get();
    if (pollTimer) {
      clearInterval(pollTimer);
      set({ pollTimer: null });
    }
  },
}));
