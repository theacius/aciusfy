"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play } from "lucide-react";
import { useHoverPreview } from "@/hooks/useHoverPreview";
import { useModalStore } from "@/store/modalStore";
import { usePlayerStore } from "@/store/playerStore";
import { SongType } from "@/types";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { useRef, useEffect } from "react";

interface SongCardProps {
  song: SongType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SongCard({ song, className, size = "md" }: SongCardProps) {
  const { t } = useTranslation();
  const { isPreviewActive, onMouseEnter, onMouseLeave } = useHoverPreview(2000);
  const { openSongModal } = useModalStore();
  const { setActiveSong } = usePlayerStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const sizeClasses = {
    sm: "w-36",
    md: "w-44",
    lg: "w-56",
  };

  const imageSizes = {
    sm: "h-36",
    md: "h-44",
    lg: "h-56",
  };

  useEffect(() => {
    if (isPreviewActive && videoRef.current && song.previewVideoUrl) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPreviewActive, song.previewVideoUrl]);

  const handleClick = () => {
    openSongModal(song);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSong(song);
  };

  return (
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      className={cn(
        "group cursor-pointer rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.04] transition-all hover:bg-white/[0.06] hover:ring-white/[0.08]",
        sizeClasses[size],
        className
      )}
    >
      <div className={cn("relative overflow-hidden rounded-xl", imageSizes[size])}>
        <Image
          src={proxiedImageUrl(song.coverImage, song.audioUrl) || "/images/placeholder-song.svg"}
          alt={song.title}
          fill
          sizes="(max-width: 640px) 50vw, 200px"
          className={cn(
            "object-cover transition-all duration-500",
            isPreviewActive && song.previewVideoUrl && "opacity-0"
          )}
        />

        <AnimatePresence>
          {isPreviewActive && song.previewVideoUrl && (
            <motion.video
              ref={videoRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={song.previewVideoUrl}
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPreviewActive && !song.previewVideoUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="h-16 w-16 animate-ping rounded-full bg-accent/20" />
              <div className="absolute h-12 w-12 rounded-full bg-accent/30" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          onClick={handlePlay}
          className={cn(
            "absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all",
            "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
          style={{ transition: "opacity 0.2s, transform 0.2s" }}
        >
          <Play className="h-5 w-5 translate-x-[1px] fill-black text-black" />
        </motion.button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="truncate text-sm font-medium text-white">{song.title}</p>
        <p className="truncate text-xs text-white/35">
          {song.artist?.name || t("unknownArtist")}
        </p>
      </div>
    </motion.div>
  );
}
