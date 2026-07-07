"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Play, Pause, SkipForward, X, GripHorizontal } from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { usePipStore } from "@/store/pipStore";
import { useAudio } from "@/components/providers/AudioProvider";
import { useTranslation } from "@/hooks/useTranslation";
import type { SongType } from "@/types";

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number;
        height?: number;
      }) => Promise<Window>;
      readonly window: Window | null;
    };
  }
}

const PIP_ROOT_ID = "aciusfy-pip-root";

function copyThemeStylesToPipDocument(pipDoc: Document) {
  const src = getComputedStyle(document.documentElement);
  const names = [
    "--background",
    "--foreground",
    "--card",
    "--muted",
    "--border",
    "--player-bg",
    "--accent",
  ] as const;
  let rootCss = ":root{";
  for (const n of names) {
    rootCss += `${n}:${src.getPropertyValue(n).trim() || "initial"};`;
  }
  rootCss += "}";
  const base = `
    ${rootCss}
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--player-bg); color: var(--foreground); -webkit-font-smoothing: antialiased; }
    button { font: inherit; cursor: pointer; border: none; background: transparent; color: inherit; padding: 0; }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
  `;
  const el = pipDoc.createElement("style");
  el.textContent = base;
  pipDoc.head.appendChild(el);
}

function getPipMountNode(pipWindow: Window): HTMLElement {
  const doc = pipWindow.document;
  let node = doc.getElementById(PIP_ROOT_ID);
  if (!node) {
    node = doc.createElement("div");
    node.id = PIP_ROOT_ID;
    doc.body.appendChild(node);
  }
  return node;
}

type PipChromeProps = {
  song: SongType;
  isPlaying: boolean;
  isDownloading: boolean;
  progress: number;
  duration: number;
  searchingLabel: string;
  playLabel: string;
  pauseLabel: string;
  nextLabel: string;
  closeLabel: string;
  miniPlayerLabel: string;
  unknownArtist: string;
  onPlayPause: () => void;
  onNext: () => void;
  onSeek: (value: number) => void;
  onClose: () => void;
  variant: "document" | "overlay"
  dragHandleProps?: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
};

function PipChrome({
  song,
  isPlaying,
  isDownloading,
  progress,
  duration,
  searchingLabel,
  playLabel,
  pauseLabel,
  nextLabel,
  closeLabel,
  miniPlayerLabel,
  unknownArtist,
  onPlayPause,
  onNext,
  onSeek,
  onClose,
  variant,
  dragHandleProps,
}: PipChromeProps) {
  const coverSrc =
    proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg";
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  if (variant === "document") {
    const wrap: CSSProperties = {
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      padding: "10px 12px",
      gap: "8px",
    };
    const row: CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      minWidth: 0,
    };
    const img: CSSProperties = {
      width: 60,
      height: 60,
      borderRadius: 6,
      objectFit: "cover",
      flexShrink: 0,
      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    };
    const meta: CSSProperties = {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    };
    const title: CSSProperties = {
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: "var(--foreground)",
    };
    const artist: CSSProperties = {
      fontSize: 11,
      color: "var(--muted)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    };
    const controls: CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginLeft: "auto",
    };
    const iconBtn: CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: "50%",
      color: "var(--foreground)",
      transition: "background 0.15s",
    };
    const playBtn: CSSProperties = {
      ...iconBtn,
      background: "var(--foreground)",
      color: "var(--player-bg)",
    };
    const barTrack: CSSProperties = {
      height: 3,
      borderRadius: 2,
      background: "rgba(255,255,255,0.12)",
      position: "relative",
      overflow: "hidden",
    };
    const barFill: CSSProperties = {
      height: "100%",
      width: `${progressPercent}%`,
      borderRadius: 2,
      background: "var(--accent)",
    };
    const closeBtn: CSSProperties = {
      position: "absolute",
      top: 6,
      right: 6,
      width: 28,
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      color: "var(--muted)",
    };
    const rangeWrap: CSSProperties = {
      position: "relative",
      width: "100%",
      height: 14,
      display: "flex",
      alignItems: "center",
    };

    return (
      <div style={{ position: "relative", ...wrap }}>
        <button type="button" style={closeBtn} onClick={onClose} title={closeLabel} aria-label={closeLabel}>
          <X size={16} strokeWidth={2} />
        </button>
        <div style={row}>
          
          <img src={coverSrc} alt="" width={60} height={60} style={img} />
          <div style={meta}>
            <span style={title}>{isDownloading ? searchingLabel : song.title}</span>
            <span style={artist}>{song.artist?.name || unknownArtist}</span>
          </div>
          <div style={controls}>
            <button
              type="button"
              style={playBtn}
              onClick={onPlayPause}
              title={isPlaying ? pauseLabel : playLabel}
              aria-label={isPlaying ? pauseLabel : playLabel}
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </button>
            <button type="button" style={iconBtn} onClick={onNext} title={nextLabel} aria-label={nextLabel}>
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        </div>
        <div style={rangeWrap}>
          <div style={{ ...barTrack, flex: 1 }}>
            <div style={barFill} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              margin: 0,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[min(100vw-24px,320px)] flex-col gap-2 rounded-xl border border-border bg-player-bg/98 p-3 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <button
          type="button"
          className="flex touch-none items-center justify-center rounded-md p-1 text-muted hover:bg-white/10 hover:text-foreground"
          title={miniPlayerLabel}
          aria-label={miniPlayerLabel}
          {...(dragHandleProps ?? {})}
        >
          <GripHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-md p-1 text-muted hover:bg-white/10 hover:text-foreground"
          onClick={onClose}
          title={closeLabel}
          aria-label={closeLabel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        
        <img
          src={coverSrc}
          alt=""
          width={60}
          height={60}
          className="h-[60px] w-[60px] shrink-0 rounded-md object-cover shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {isDownloading ? searchingLabel : song.title}
          </p>
          <p className="truncate text-xs text-muted">{song.artist?.name || unknownArtist}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPlayPause}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"
            title={isPlaying ? pauseLabel : playLabel}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}
          </button>
          <button type="button" onClick={onNext} className="p-2 text-muted hover:text-foreground" title={nextLabel}>
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
        </div>
      </div>
      <div className="relative h-1 w-full rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}

export function PipPlayer() {
  const { t } = useTranslation();
  const isPipOpen = usePipStore((s) => s.isPipOpen);
  const setPipOpen = usePipStore((s) => s.setPipOpen);

  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isDownloading = usePlayerStore((s) => s.isDownloading);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const nextSong = useQueueStore((s) => s.nextSong);

  const { seekTo, unlockAndPlay } = useAudio();

  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [surface, setSurface] = useState<"document" | "overlay" | null>(null);

  const pipWindowRef = useRef<Window | null>(null);
  pipWindowRef.current = pipWindow;

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [overlayDragging, setOverlayDragging] = useState(false);
  const dragStartRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const handlePlayPause = useCallback(() => {
    if (activeSong && !isPlaying) unlockAndPlay();
    else togglePlay();
  }, [activeSong, isPlaying, togglePlay, unlockAndPlay]);

  const handleNext = useCallback(() => {
    const next = nextSong();
    if (next) usePlayerStore.getState().setActiveSong(next);
  }, [nextSong]);

  const handleSeek = useCallback(
    (value: number) => {
      seekTo(value);
    },
    [seekTo],
  );

  const closePip = useCallback(() => {
    setPipOpen(false);
  }, [setPipOpen]);

  useEffect(() => {
    if (isPipOpen && !activeSong) {
      setPipOpen(false);
    }
  }, [isPipOpen, activeSong, setPipOpen]);

  useEffect(() => {
    if (!isPipOpen) {
      setDragOffset(null);
      setOverlayDragging(false);
      dragStartRef.current = null;
      const w = pipWindowRef.current;
      if (w && !w.closed) {
        (w as Window & { __aciusfyPipCleanup?: () => void }).__aciusfyPipCleanup?.();
        try {
          w.close();
        } catch {}
      }
      setPipWindow(null);
      setSurface(null);
      return;
    }

    if (!activeSong) {
      return;
    }

    let cancelled = false;

    const api = window.documentPictureInPicture;
    if (!api?.requestWindow) {
      setSurface("overlay");
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const w = await api.requestWindow({ width: 384, height: 168 });
        if (cancelled || !usePipStore.getState().isPipOpen) {
          try {
            w.close();
          } catch {}
          return;
        }
        copyThemeStylesToPipDocument(w.document);
        const onPageHide = () => {
          usePipStore.getState().setPipOpen(false);
        };
        w.addEventListener("pagehide", onPageHide);
        (w as Window & { __aciusfyPipCleanup?: () => void }).__aciusfyPipCleanup = () =>
          w.removeEventListener("pagehide", onPageHide);
        setPipWindow(w);
        setSurface("document");
      } catch {
        if (!cancelled && usePipStore.getState().isPipOpen) {
          setSurface("overlay");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPipOpen]);

  useEffect(() => {
    return () => {
      const w = pipWindowRef.current;
      if (w && !w.closed) {
        const cleanup = (w as Window & { __aciusfyPipCleanup?: () => void }).__aciusfyPipCleanup;
        cleanup?.();
        try {
          w.close();
        } catch {}
      }
    };
  }, []);

  const onOverlayPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragStartRef.current = {
        px: e.clientX,
        py: e.clientY,
        x: dragOffset?.x ?? 0,
        y: dragOffset?.y ?? 0,
      };
      setOverlayDragging(true);
    },
    [dragOffset?.x, dragOffset?.y],
  );

  useEffect(() => {
    if (!overlayDragging) return;
    const onMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.px;
      const dy = e.clientY - start.py;
      setDragOffset({ x: start.x + dx, y: start.y + dy });
    };
    const onUp = () => {
      dragStartRef.current = null;
      setOverlayDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [overlayDragging]);

  if (!isPipOpen || !activeSong) {
    return null;
  }

  const chromeProps: PipChromeProps = {
    song: activeSong,
    isPlaying,
    isDownloading,
    progress,
    duration,
    searchingLabel: t("searching"),
    playLabel: t("play"),
    pauseLabel: t("pause"),
    nextLabel: t("next"),
    closeLabel: t("closeMiniPlayer"),
    miniPlayerLabel: t("miniPlayer"),
    unknownArtist: t("unknownArtist"),
    onPlayPause: handlePlayPause,
    onNext: handleNext,
    onSeek: handleSeek,
    onClose: closePip,
    variant: "document",
  };

  const overlayStyle: CSSProperties =
    dragOffset == null
      ? {
          position: "fixed",
          zIndex: 200,
          right: 16,
          bottom:
            "calc(var(--player-bottom-offset, 0px) + var(--player-height, 80px) + 12px)",
          left: "auto",
          top: "auto",
        }
      : {
          position: "fixed",
          zIndex: 200,
          right: 16,
          bottom:
            "calc(var(--player-bottom-offset, 0px) + var(--player-height, 80px) + 12px)",
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        };

  return (
    <>
      {surface === "document" && pipWindow && !pipWindow.closed
        ? createPortal(
            <PipChrome {...chromeProps} variant="document" />,
            getPipMountNode(pipWindow),
          )
        : null}
      {surface === "overlay" ? (
        <div className="pointer-events-auto" style={overlayStyle}>
          <PipChrome
            {...chromeProps}
            variant="overlay"
            dragHandleProps={{
              onPointerDown: onOverlayPointerDown,
            }}
          />
        </div>
      ) : null}
    </>
  );
}
