"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type LandingScrollContextValue = {
  /** 0 = hero üst, 1 = features bölgesine yaklaşıldı */
  progress: number;
  setProgress: (v: number) => void;
};

const LandingScrollContext = createContext<LandingScrollContextValue>({
  progress: 0,
  setProgress: () => {},
});

export function useLandingScroll() {
  return useContext(LandingScrollContext);
}

export function LandingScrollProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  return (
    <LandingScrollContext.Provider value={{ progress, setProgress }}>
      {children}
    </LandingScrollContext.Provider>
  );
}
