"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import {
  Loader2,
  ListMusic,
  Music2,
  Play,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { MessageSharePayload } from "@/types/messageShare";
import type { SongType } from "@/types";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { MagicCard } from "@/components/ui/MagicCard";

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const springIn = { type: "spring" as const, stiffness: 380, damping: 30 };

function cardInnerClasses(isMe: boolean) {
  return isMe
    ? "border-indigo-400/25 bg-gradient-to-br from-indigo-600/25 via-violet-600/15 to-black/25 shadow-[0_8px_32px_rgba(79,70,229,0.12)]"
    : "border-white/12 bg-gradient-to-br from-indigo-500/12 via-slate-800/40 to-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
}

interface MessageShareCardProps {
  payload: MessageSharePayload;
  isMe: boolean;
  createdAt: string;
  hideFooterTime?: boolean;
}

export function MessageShareCard({ payload, isMe, createdAt, hideFooterTime }: MessageShareCardProps) {
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const [loading, setLoading] = useState(false);

  const playSong = async () => {
    if (payload.type === "playlist") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/songs/${payload.songId}`);
      const song = (await res.json()) as SongType & { error?: string };
      if (!res.ok || !song?.id) return;
      clearPlaylistPlayback();
      setActiveSong(song);
    } finally {
      setLoading(false);
    }
  };

  const timeEl = !hideFooterTime && (
    <span
      className="pointer-events-none absolute bottom-2 right-2 z-[6] text-[10px] tabular-nums text-white/45"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {formatMessageTime(createdAt)}
    </span>
  );

  if (payload.type === "playlist") {
    return (
      <div className="w-full min-w-[240px] max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springIn}
        >
          <MagicCard tint="indigo">
            <div
              className={`relative h-[108px] overflow-hidden rounded-2xl border pb-7 backdrop-blur-sm ${cardInnerClasses(isMe)}`}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent"
                aria-hidden
              />
              <Link
                href={`/playlist/${payload.playlistId}`}
                className="group flex h-full items-center gap-3 px-3 py-2 transition-colors"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-black/30">
                  {proxiedImageUrl(payload.coverImage) ? (
                    <Image
                      src={proxiedImageUrl(payload.coverImage)!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-600/50 to-violet-800/50">
                      <ListMusic className="h-8 w-8 text-white/90" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                </div>

                <div className="min-h-0 min-w-0 flex-1 self-stretch pr-9">
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springIn, delay: 0.05 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-indigo-500/15 px-2 py-0.5"
                  >
                    <ListMusic className="h-3 w-3 text-indigo-300" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-200/95">
                      Playlist
                    </span>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springIn, delay: 0.1 }}
                    className="mt-1 line-clamp-2 text-[14px] font-semibold leading-tight tracking-tight text-white"
                  >
                    {payload.title}
                  </motion.p>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.16, duration: 0.25 }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-white/55 transition-colors group-hover:text-indigo-200/90"
                  >
                    Playlist’i aç
                    <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </motion.span>
                </div>
              </Link>
              {timeEl}
            </div>
          </MagicCard>
        </motion.div>
      </div>
    );
  }

  const isNow = payload.type === "song_now";

  return (
    <div className="w-full min-w-[240px] max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springIn}
      >
        <MagicCard tint="indigo">
          <div
            className={`relative flex h-[136px] flex-col overflow-hidden rounded-2xl border pb-7 backdrop-blur-sm ${cardInnerClasses(isMe)}`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent"
              aria-hidden
            />
            {isNow && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="flex shrink-0 items-center gap-1.5 border-b border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5"
              >
                <motion.span
                  animate={{ scale: [1, 1.12, 1], opacity: [1, 0.88, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-3 w-3 text-indigo-300" />
                </motion.span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-200/95">
                  Şu an çalıyor
                </span>
              </motion.div>
            )}

            <div className="flex min-h-0 flex-1 items-center gap-3 px-3 py-2 pr-10">
              <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-black/30">
                {proxiedImageUrl(payload.coverImage) ? (
                  <Image
                    src={proxiedImageUrl(payload.coverImage)!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-600/50 to-violet-800/50">
                    <Music2 className="h-8 w-8 text-white/90" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-0.5">
                {!isNow && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springIn, delay: 0.05 }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-400/25 bg-indigo-500/15 px-2 py-0.5"
                  >
                    <Music2 className="h-3 w-3 text-indigo-300" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-200/95">
                      Şarkı
                    </span>
                  </motion.div>
                )}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springIn, delay: isNow ? 0.05 : 0.1 }}
                  className={`line-clamp-2 text-[14px] font-semibold leading-tight tracking-tight text-white ${!isNow ? "mt-0.5" : ""}`}
                >
                  {payload.title}
                </motion.p>
                {payload.artistName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="truncate text-[12px] leading-tight text-white/55"
                  >
                    {payload.artistName}
                  </motion.p>
                )}
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void playSong();
                  }}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.03, y: loading ? 0 : -1 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-indigo-950/30 ring-1 ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  Dinle
                </motion.button>
              </div>
            </div>
            {timeEl}
          </div>
        </MagicCard>
      </motion.div>
    </div>
  );
}
