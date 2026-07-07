import { create } from "zustand";
import { SongType } from "@/types";

interface PlayerState {
  activeSong: SongType | null;
  isPlaying: boolean;
  isDownloading: boolean;
  volume: number;
  progress: number;
  duration: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  isNowPlayingOpen: boolean;
  isLyricsOpen: boolean;
  streamError: string | null
  setStreamError: (msg: string | null) => void;

  setActiveSong: (song: SongType) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setIsDownloading: (v: boolean) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleNowPlaying: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeSong: null,
  isPlaying: false,
  isDownloading: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  isMuted: false,
  isShuffled: false,
  repeatMode: "off",
  isNowPlayingOpen: false,
  isLyricsOpen: false,
  streamError: null,
  setStreamError: (msg) => set({ streamError: msg }),

  setActiveSong: (song) =>
    set({ activeSong: song, isPlaying: true, isDownloading: false, progress: 0, streamError: null }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setIsDownloading: (v) => set({ isDownloading: v }),
  toggleMute: () =>
    set((state) => ({ isMuted: !state.isMuted })),
  toggleShuffle: () =>
    set((state) => ({ isShuffled: !state.isShuffled })),
  cycleRepeat: () =>
    set((state) => {
      const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
      const idx = modes.indexOf(state.repeatMode);
      return { repeatMode: modes[(idx + 1) % modes.length] };
    }),
  toggleNowPlaying: () =>
    set((state) => ({ isNowPlayingOpen: !state.isNowPlayingOpen, isLyricsOpen: state.isNowPlayingOpen ? state.isLyricsOpen : false })),
  setNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),
  toggleLyrics: () =>
    set((state) => ({ isLyricsOpen: !state.isLyricsOpen, isNowPlayingOpen: state.isLyricsOpen ? state.isNowPlayingOpen : false })),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
  reset: () =>
    set({
      activeSong: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      streamError: null,
    }),
}));
