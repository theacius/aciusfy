import { create } from "zustand";

export type SleepTimerMode = "timer" | "endOfTrack" | "endOfPlaylist";

interface SleepTimerState {
  endTime: number | null;
  remainingMs: number;
  isActive: boolean;
  mode: SleepTimerMode;
  setSleepTimer: (minutes: number) => void;
  setSleepMode: (mode: SleepTimerMode) => void;
  clearSleepTimer: () => void;
  tick: () => void;
}

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  endTime: null,
  remainingMs: 0,
  isActive: false,
  mode: "timer",

  setSleepTimer: (minutes) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    set({ endTime, remainingMs: minutes * 60 * 1000, isActive: true, mode: "timer" });
  },

  setSleepMode: (mode) => {
    set({ isActive: true, mode, endTime: null, remainingMs: 0 });
  },

  clearSleepTimer: () => {
    set({ endTime: null, remainingMs: 0, isActive: false, mode: "timer" });
  },

  tick: () => {
    const { endTime, mode } = get();
    if (mode !== "timer" || !endTime) return;
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      set({ endTime: null, remainingMs: 0, isActive: false });
    } else {
      set({ remainingMs: remaining });
    }
  },
}));
