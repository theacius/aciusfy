"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useMediaSessionSync, type UnlockAndPlayFn } from "@/hooks/useMediaSessionSync";
import { createContext, useContext } from "react";

function MediaSessionRegistrar(
  {
    seekTo,
    unlockAndPlay,
  }: {
    seekTo: (time: number) => void;
    unlockAndPlay: UnlockAndPlayFn;
  }
) {
  useMediaSessionSync(seekTo, unlockAndPlay);
  return null;
}

interface AudioContextType {
  seekTo: (time: number) => void;
  unlockAndPlay: (song?: { id: string; audioUrl?: string } | null) => void;
}

const AudioContext = createContext<AudioContextType>({ seekTo: () => {}, unlockAndPlay: () => {} });

export function useAudio() {
  return useContext(AudioContext);
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { seekTo, unlockAndPlay } = useAudioPlayer();

  return (
    <AudioContext.Provider value={{ seekTo, unlockAndPlay: unlockAndPlay as AudioContextType["unlockAndPlay"] }}>
      <MediaSessionRegistrar seekTo={seekTo} unlockAndPlay={unlockAndPlay} />
      {children}
    </AudioContext.Provider>
  );
}
