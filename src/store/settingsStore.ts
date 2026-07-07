import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "tr" | "en" | "de" | "ar" | "zh" | "es" | "fr" | "ru" | "pt" | "it" | "ja" | "ko" | "hi" | "pl" | "ku";
export type AudioQuality = "auto" | "low" | "normal" | "high";
export type VolumeLevel = "quiet" | "normal" | "loud";
export type Theme = "dark" | "light" | "system";

export interface SettingsState {
  language: Language
  theme: Theme;
  allowExplicit: boolean
  autoplay: boolean
  listeningQuality: AudioQuality
  downloadQuality: AudioQuality;
  autoAdjustQuality: boolean;
  libraryCompactView: boolean
  showLocalFiles: boolean;
  showNowPlayingOnPlay: boolean
  showCanvasInTracks: boolean;
  showDesktopOverlay: boolean;
  playerCompactMode: boolean;
  seeFriendsListening: boolean;
  sidebarCollapsed: boolean
  zoomLevel: number
  newPlaylistsVisible: boolean
  shareListeningActivity: boolean
  onlinePresenceEnabled: boolean
  profilePlaylistsVisible: boolean;
  profileFollowVisible: boolean;
  profileArtistsVisible: boolean;
  crossfade: boolean
  crossfadeSeconds: number;
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  volumeLevel: VolumeLevel;
  monoAudio: boolean;
  equalizerEnabled: boolean
  equalizerPreset: string;
  equalizerMode: "preset" | "manual";
  equalizerManualGains: number[];
  equalizerCustomGains: number[] | null;
  prefsSyncedFromServer: boolean
  setPrefsSyncedFromServer: (v: boolean) => void;

  setLanguage: (v: Language) => void;
  setTheme: (v: Theme) => void;
  setAllowExplicit: (v: boolean) => void;
  setAutoplay: (v: boolean) => void;
  setListeningQuality: (v: AudioQuality) => void;
  setDownloadQuality: (v: AudioQuality) => void;
  setAutoAdjustQuality: (v: boolean) => void;
  setLibraryCompactView: (v: boolean) => void;
  setShowLocalFiles: (v: boolean) => void;
  setShowNowPlayingOnPlay: (v: boolean) => void;
  setShowCanvasInTracks: (v: boolean) => void;
  setShowDesktopOverlay: (v: boolean) => void;
  setPlayerCompactMode: (v: boolean) => void;
  setSeeFriendsListening: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setZoomLevel: (v: number) => void;
  setNewPlaylistsVisible: (v: boolean) => void;
  setShareListeningActivity: (v: boolean) => void;
  setOnlinePresenceEnabled: (v: boolean) => void;
  setProfilePlaylistsVisible: (v: boolean) => void;
  setProfileFollowVisible: (v: boolean) => void;
  setProfileArtistsVisible: (v: boolean) => void;
  setCrossfade: (v: boolean) => void;
  setCrossfadeSeconds: (v: number) => void;
  setGaplessPlayback: (v: boolean) => void;
  setNormalizeVolume: (v: boolean) => void;
  setVolumeLevel: (v: VolumeLevel) => void;
  setMonoAudio: (v: boolean) => void;
  setEqualizerEnabled: (v: boolean) => void;
  setEqualizerPreset: (v: string) => void;
  setEqualizerMode: (v: "preset" | "manual") => void;
  setEqualizerManualGains: (v: number[]) => void;
  setEqualizerManualGain: (index: number, value: number) => void;
  saveCustomEQPreset: (gains: number[]) => void;
  hydrateFromServer: (data: Partial<SettingsState>) => void;
}

const defaults = {
  language: "tr" as Language,
  theme: "dark" as Theme,
  allowExplicit: true,
  autoplay: true,
  listeningQuality: "auto" as AudioQuality,
  downloadQuality: "high" as AudioQuality,
  autoAdjustQuality: true,
  libraryCompactView: false,
  showLocalFiles: false,
  showNowPlayingOnPlay: true,
  showCanvasInTracks: true,
  showDesktopOverlay: true,
  playerCompactMode: false,
  seeFriendsListening: true,
  sidebarCollapsed: false,
  zoomLevel: 90,
  newPlaylistsVisible: true,
  shareListeningActivity: true,
  onlinePresenceEnabled: true,
  profilePlaylistsVisible: true,
  profileFollowVisible: false,
  profileArtistsVisible: false,
  crossfade: true,
  crossfadeSeconds: 4,
  gaplessPlayback: true,
  normalizeVolume: false,
  volumeLevel: "normal" as VolumeLevel,
  monoAudio: false,
  equalizerEnabled: false,
  equalizerPreset: "flat",
  equalizerMode: "preset" as const,
  equalizerManualGains: [0, 0, 0, 0, 0, 0],
  equalizerCustomGains: null,
  prefsSyncedFromServer: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setPrefsSyncedFromServer: (v) => set({ prefsSyncedFromServer: v }),
      setLanguage: (v) => set({ language: v }),
      setTheme: (v) => set({ theme: v }),
      setAllowExplicit: (v) => set({ allowExplicit: v }),
      setAutoplay: (v) => set({ autoplay: v }),
      setListeningQuality: (v) => set({ listeningQuality: v }),
      setDownloadQuality: (v) => set({ downloadQuality: v }),
      setAutoAdjustQuality: (v) => set({ autoAdjustQuality: v }),
      setLibraryCompactView: (v) => set({ libraryCompactView: v }),
      setShowLocalFiles: (v) => set({ showLocalFiles: v }),
      setShowNowPlayingOnPlay: (v) => set({ showNowPlayingOnPlay: v }),
      setShowCanvasInTracks: (v) => set({ showCanvasInTracks: v }),
      setShowDesktopOverlay: (v) => set({ showDesktopOverlay: v }),
      setPlayerCompactMode: (v) => set({ playerCompactMode: v }),
      setSeeFriendsListening: (v) => set({ seeFriendsListening: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setZoomLevel: (v) => set({ zoomLevel: Math.min(130, Math.max(70, v)) }),
      setNewPlaylistsVisible: (v) => set({ newPlaylistsVisible: v }),
      setShareListeningActivity: (v) => set({ shareListeningActivity: v }),
      setOnlinePresenceEnabled: (v) => set({ onlinePresenceEnabled: v }),
      setProfilePlaylistsVisible: (v) => set({ profilePlaylistsVisible: v }),
      setProfileFollowVisible: (v) => set({ profileFollowVisible: v }),
      setProfileArtistsVisible: (v) => set({ profileArtistsVisible: v }),
      setCrossfade: (v) => set({ crossfade: v }),
      setCrossfadeSeconds: (v) => set({ crossfadeSeconds: Math.min(12, Math.max(0, v)) }),
      setGaplessPlayback: (v) => set({ gaplessPlayback: v }),
      setNormalizeVolume: (v) => set({ normalizeVolume: v }),
      setVolumeLevel: (v) => set({ volumeLevel: v }),
      setMonoAudio: (v) => set({ monoAudio: v }),
      setEqualizerEnabled: (v) => set({ equalizerEnabled: v }),
      setEqualizerPreset: (v) => set({ equalizerPreset: v }),
      setEqualizerMode: (v) => set({ equalizerMode: v }),
      setEqualizerManualGains: (v) => set({ equalizerManualGains: v }),
      setEqualizerManualGain: (index, value) =>
        set((s) => {
          const next = [...s.equalizerManualGains];
          next[index] = Math.max(-12, Math.min(12, value));
          return { equalizerManualGains: next };
        }),
      saveCustomEQPreset: (gains) =>
        set({
          equalizerCustomGains: gains.length === 6 ? [...gains] : null,
          equalizerPreset: "custom",
          equalizerMode: "preset",
        }),
      hydrateFromServer: (data) =>
        set((s) => {
          const incoming = { ...(data as Record<string, unknown>) };
          const legacyPrivate = incoming.privateSession === true;
          delete incoming.privateSession;
          const merged = { ...incoming } as Partial<SettingsState>;
          if (legacyPrivate && merged.shareListeningActivity === undefined) {
            merged.shareListeningActivity = false;
          } else if (merged.shareListeningActivity === undefined) {
            merged.shareListeningActivity = true;
          }
          if (merged.onlinePresenceEnabled === undefined) {
            merged.onlinePresenceEnabled = true;
          }
          return { ...s, ...merged };
        }),
    }),
    {
      name: "aciusfy-settings",
      merge: (persisted, current) => {
        const p = { ...((persisted ?? {}) as Record<string, unknown>) };
        const legacyPrivate = p.privateSession === true;
        delete p.privateSession;
        const next = { ...current, ...p } as SettingsState;
        if (legacyPrivate && (persisted as Partial<SettingsState> | undefined)?.shareListeningActivity === undefined) {
          next.shareListeningActivity = false;
        } else {
          next.shareListeningActivity = next.shareListeningActivity ?? true;
        }
        next.onlinePresenceEnabled = next.onlinePresenceEnabled ?? true;
        return next;
      },
      partialize: (s) => {
        const { prefsSyncedFromServer: _p, ...rest } = s;
        return rest;
      },
    }
  )
);
