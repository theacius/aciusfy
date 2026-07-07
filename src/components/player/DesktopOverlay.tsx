"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import Image from "next/image";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { motion, AnimatePresence } from "framer-motion";

export function DesktopOverlay() {
  const { t } = useTranslation();
  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const showDesktopOverlay = useSettingsStore((s) => s.showDesktopOverlay);
  const [visible, setVisible] = useState(false);
  const [lastMediaKeyTime, setLastMediaKeyTime] = useState(0);

  useEffect(() => {
    if (!showDesktopOverlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const mediaKeys = ["MediaPlayPause", "MediaNextTrack", "MediaPreviousTrack"];
      if (mediaKeys.includes(e.code) && activeSong) {
        setLastMediaKeyTime(Date.now());
        setVisible(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDesktopOverlay, activeSong]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [visible, lastMediaKeyTime]);

  if (!showDesktopOverlay || !activeSong) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 z-[200] flex items-center gap-4 rounded-xl border border-white/10 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur-xl"
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white/5">
            {activeSong.coverImage ? (
              <Image
                src={proxiedImageUrl(activeSong.coverImage, activeSong.audioUrl) || activeSong.coverImage}
                alt={activeSong.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-muted">
                ♪
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {activeSong.title}
            </p>
            <p className="truncate text-xs text-muted">
              {activeSong.artist?.name ?? t("unknown")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {isPlaying ? t("playing") : t("paused")}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
