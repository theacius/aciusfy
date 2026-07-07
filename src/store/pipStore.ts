import { create } from "zustand";

interface PipState {
  isPipOpen: boolean;
  setPipOpen: (v: boolean) => void;
}

export const usePipStore = create<PipState>((set) => ({
  isPipOpen: false,
  setPipOpen: (v) => set({ isPipOpen: v }),
}));
