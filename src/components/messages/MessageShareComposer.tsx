"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Loader2,
  ListMusic,
  Music2,
  Search,
  Plus,
} from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { usePlayerStore } from "@/store/playerStore";
import { useDebounce } from "@/hooks/useDebounce";
import type { SongType } from "@/types";
import type { PlaylistType } from "@/types";
import { chatComposerMotionProps } from "@/components/messages/chatComposerMotion";
import { StevenActionMenu } from "@/components/navigation/StevenActionMenu";
import { AnimatedModal } from "@/components/ui/animated-modal";

type SharePayloadOut =
  | { type: "playlist"; playlistId: string }
  | { type: "song_now"; songId: string }
  | { type: "song"; songId: string };

interface MessageShareComposerProps {
  receiverId: string | null;
  disabled: boolean;
  caption: string;
  onSent: (createdMessage?: unknown) => void;
  onError: (msg: string) => void;
}

export function MessageShareComposer({
  receiverId,
  disabled,
  caption,
  onSent,
  onError,
}: MessageShareComposerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [songSearchOpen, setSongSearchOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistType[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [songQuery, setSongQuery] = useState("");
  const debouncedSong = useDebounce(songQuery, 350);
  const [songResults, setSongResults] = useState<SongType[]>([]);
  const [songSearchLoading, setSongSearchLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeSong = usePlayerStore((s) => s.activeSong);

  const sendShare = useCallback(
    async (sharePayload: SharePayloadOut) => {
      if (!receiverId || disabled || sending) return;
      setSending(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            receiverId,
            content: caption.trim(),
            sharePayload,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail =
            typeof data?.details === "string" && data.details.length < 400
              ? ` (${data.details})`
              : "";
          onError(
            (typeof data?.error === "string" ? data.error : "Gönderilemedi") + detail
          );
          return;
        }
        setMenuOpen(false);
        setPlaylistOpen(false);
        setSongSearchOpen(false);
        onSent(data);
      } catch {
        onError("Bağlantı hatası");
      } finally {
        setSending(false);
      }
    },
    [receiverId, disabled, sending, caption, onError, onSent]
  );

  const openPlaylists = () => {
    setMenuOpen(false);
    setPlaylistOpen(true);
    setLoadingPlaylists(true);
    fetch("/api/playlists", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPlaylists(Array.isArray(d.playlists) ? d.playlists : []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoadingPlaylists(false));
  };

  useEffect(() => {
    if (!songSearchOpen || !debouncedSong.trim()) {
      setSongResults([]);
      return;
    }
    setSongSearchLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedSong.trim())}`)
      .then((r) => r.json())
      .then((d) => setSongResults(Array.isArray(d.songs) ? d.songs.slice(0, 20) : []))
      .catch(() => setSongResults([]))
      .finally(() => setSongSearchLoading(false));
  }, [debouncedSong, songSearchOpen]);

  const handleNowPlaying = () => {
    if (!activeSong?.id) {
      onError("Önce bir şarkı çalın.");
      setMenuOpen(false);
      return;
    }
    void sendShare({ type: "song_now", songId: activeSong.id });
  };

  const plusDisabled = disabled || sending || !receiverId;
  const { whileHover, whileTap, transition } = chatComposerMotionProps(plusDisabled, "ghost");

  return (
    <>
      <div className="relative flex-shrink-0" ref={wrapRef}>
        <motion.button
          type="button"
          title="Paylaş"
          disabled={plusDisabled}
          onClick={() => setMenuOpen(true)}
          whileHover={whileHover}
          whileTap={whileTap}
          animate={{ rotate: menuOpen ? 45 : 0 }}
          transition={transition}
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white/5 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 ${
            menuOpen
              ? "border-green-500/40 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              : "border-white/10 text-muted"
          }`}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          )}
        </motion.button>
      </div>

      <StevenActionMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Paylaş"
        closeLabel="Kapat"
        items={[
          {
            id: "playlist",
            label: "Playlistini paylaş",
            icon: ListMusic,
            onClick: () => openPlaylists(),
          },
          {
            id: "now-playing",
            label: "Şimdiki şarkını paylaş",
            icon: Music2,
            onClick: () => {
              setMenuOpen(false);
              handleNowPlaying();
            },
          },
          {
            id: "search-song",
            label: "Şarkı ara ve paylaş",
            icon: Search,
            onClick: () => {
              setMenuOpen(false);
              setSongQuery("");
              setSongResults([]);
              setSongSearchOpen(true);
            },
          },
        ]}
      />

      <AnimatedModal
        isOpen={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        title="Playlist seç"
        className="max-w-md"
      >
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loadingPlaylists ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Playlist yok</p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => void sendShare({ type: "playlist", playlistId: pl.id })}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {proxiedImageUrl(pl.coverImage) ? (
                    <Image src={proxiedImageUrl(pl.coverImage)!} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">♪</div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate font-medium text-white">{pl.title}</span>
              </button>
            ))
          )}
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={songSearchOpen}
        onClose={() => setSongSearchOpen(false)}
        title="Şarkı ara"
        className="max-w-md"
      >
        <div className="flex flex-col">
          <div className="border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                value={songQuery}
                onChange={(e) => setSongQuery(e.target.value)}
                placeholder="Şarkı veya sanatçı…"
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted focus:border-white/16 focus:outline-none"
              />
            </div>
          </div>
          <div className="min-h-[200px] max-h-[55vh] overflow-y-auto p-2">
            {songSearchLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
              </div>
            ) : songResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                {songQuery.trim().length < 2 ? "En az 2 karakter yazın" : "Sonuç yok"}
              </p>
            ) : (
              songResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void sendShare({ type: "song", songId: s.id })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {proxiedImageUrl(s.coverImage) ? (
                      <Image src={proxiedImageUrl(s.coverImage)!} alt="" fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted">♪</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{s.title}</p>
                    <p className="truncate text-xs text-muted">{s.artist?.name ?? "—"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
