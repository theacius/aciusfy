"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useAudio } from "@/components/providers/AudioProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatedModal } from "@/components/ui/animated-modal";

function isInputFocused(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (el.getAttribute("contenteditable") === "true") return true;
  return false;
}

export function KeyboardShortcuts() {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const volume = usePlayerStore((s) => s.volume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleNowPlaying = usePlayerStore((s) => s.toggleNowPlaying);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);
  const toggleQueueOpen = useQueueStore((s) => s.toggleQueueOpen);
  const { seekTo, unlockAndPlay } = useAudio();
  const nextSong = useQueueStore((s) => s.nextSong);
  const prevSong = useQueueStore((s) => s.prevSong);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (activeSong && !isPlaying) unlockAndPlay();
          else togglePlay();
          break;

        case "ArrowRight":
          if (e.target && (e.target as HTMLElement).closest("[data-seek-slider]")) return;
          e.preventDefault();
          if (ctrl) {
            seekTo(Math.min((usePlayerStore.getState().progress || 0) + 10, usePlayerStore.getState().duration || 0));
          } else {
            const next = nextSong();
            if (next) usePlayerStore.getState().setActiveSong(next);
            else seekTo(Math.min((usePlayerStore.getState().progress || 0) + 10, usePlayerStore.getState().duration || 0));
          }
          break;

        case "ArrowLeft":
          if (e.target && (e.target as HTMLElement).closest("[data-seek-slider]")) return;
          e.preventDefault();
          const progress = usePlayerStore.getState().progress || 0;
          if (ctrl || progress > 3) {
            seekTo(Math.max(0, progress - 10));
          } else {
            const prev = prevSong();
            if (prev) usePlayerStore.getState().setActiveSong(prev);
            else seekTo(0);
          }
          break;

        case "KeyM":
          if (ctrl) {
            e.preventDefault();
            toggleMute();
          }
          break;

        case "ArrowUp":
          if (ctrl) {
            e.preventDefault();
            setVolume(Math.min(1, volume + 0.1));
          }
          break;

        case "ArrowDown":
          if (ctrl) {
            e.preventDefault();
            setVolume(Math.max(0, volume - 0.1));
          }
          break;

        case "Slash":
          if (e.shiftKey && e.key === "?") {
            e.preventDefault();
            setShowHelp((v) => !v);
          }
          break;

        case "KeyL":
          if (!ctrl) break;
          e.preventDefault();
          toggleLyrics();
          break;

        case "KeyJ":
          if (!ctrl) break;
          e.preventDefault();
          toggleQueueOpen();
          break;

        case "KeyI":
          if (!ctrl) break;
          e.preventDefault();
          toggleNowPlaying();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeSong,
    isPlaying,
    togglePlay,
    unlockAndPlay,
    seekTo,
    nextSong,
    prevSong,
    setVolume,
    volume,
    toggleMute,
    toggleLyrics,
    toggleQueueOpen,
    toggleNowPlaying,
  ]);

  useEffect(() => {
    if (!showHelp) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setShowHelp(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showHelp]);

  const shortcuts = [
    { keys: "Space", desc: t("shortcutPlayPause") ?? "Çal / Duraklat" },
    { keys: "← →", desc: t("shortcutPrevNext") ?? "Önceki / Sonraki" },
    { keys: "Ctrl + ← →", desc: t("shortcutSeek") ?? "10 sn atla" },
    { keys: "Ctrl + ↑ ↓", desc: t("shortcutVolume") ?? "Ses" },
    { keys: "Ctrl + M", desc: t("shortcutMute") ?? "Sessiz" },
    { keys: "Ctrl + L", desc: t("shortcutLyrics") ?? "Şarkı sözleri" },
    { keys: "Ctrl + J", desc: t("shortcutQueue") ?? "Sıra" },
    { keys: "Ctrl + I", desc: t("shortcutNowPlaying") ?? "Şimdi çalıyor" },
    { keys: "?", desc: t("shortcutHelp") ?? "Kısayollar" },
  ];

  return (
    <AnimatedModal
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
      title={t("keyboardShortcuts") ?? "Klavye kısayolları"}
      className="max-w-md"
    >
      <div className="space-y-2 p-5">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2">
            <span className="text-sm text-muted">{s.desc}</span>
            <kbd className="rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-1 text-xs font-mono text-white">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
    </AnimatedModal>
  );
}
