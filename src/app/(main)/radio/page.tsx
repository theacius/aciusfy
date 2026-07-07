"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Radio, Brain, Compass, Shuffle, Heart, Music, Loader2,
  Play, Pause, Waves,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { useTranslation } from "@/hooks/useTranslation";
import { GenreRadioPoster } from "@/components/radio/GenreRadioPoster";
import type { SongType } from "@/types";

interface RadioChannel {
  id: string;
  type: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  mode: string;
  moodId?: string;
  genreId?: string;
  genreSlug?: string;
  imageUrl?: string;
}

const ICON_MAP: Record<string, typeof Radio> = {
  brain: Brain,
  compass: Compass,
  shuffle: Shuffle,
  heart: Heart,
  music: Music,
  radio: Radio,
};

function ChannelIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] || Radio;
  return <Icon className={className} />;
}

export default function RadioPage() {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingChannel, setPlayingChannel] = useState<string | null>(null);
  const [loadingChannel, setLoadingChannel] = useState<string | null>(null);

  const activeSong = usePlayerStore((s) => s.activeSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setQueue = useQueueStore((s) => s.setQueue);
  const clearPlaylistPlayback = useQueueStore((s) => s.clearPlaylistPlayback);
  const queueSource = useQueueStore((s) => s.queueSource);

  useEffect(() => {
    fetch("/api/smart-radio/channels")
      .then((r) => r.json())
      .then((d) => setChannels(d.channels ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startRadio = useCallback(async (channel: RadioChannel) => {
    if (loadingChannel) return;

    if (playingChannel === channel.id && activeSong) {
      setIsPlaying(!isPlaying);
      return;
    }

    setLoadingChannel(channel.id);
    try {
      const params = new URLSearchParams({ mode: channel.mode, limit: "40" });
      if (channel.moodId) params.set("moodId", channel.moodId);
      if (channel.genreId) params.set("genreId", channel.genreId);

      const res = await fetch(`/api/smart-radio?${params}`);
      const data = await res.json();
      const songs: SongType[] = data.songs ?? [];

      if (songs.length > 0) {
        clearPlaylistPlayback();
        setQueue(songs, 0, "queue");
        setActiveSong(songs[0]);
        setPlayingChannel(channel.id);
      }
    } catch {}
    setLoadingChannel(null);
  }, [loadingChannel, playingChannel, activeSong, isPlaying, setIsPlaying, clearPlaylistPlayback, setQueue, setActiveSong]);

  useEffect(() => {
    if (queueSource !== "queue" && playingChannel) {
      setPlayingChannel(null);
    }
  }, [queueSource, playingChannel]);

  const smartChannels = channels.filter((c) => c.type === "smart");
  const moodChannels = channels.filter((c) => c.type === "mood");
  const genreChannels = channels.filter((c) => c.type === "genre");

  return (
    <div className="min-h-screen px-4 pb-40 pt-6 sm:px-6 lg:px-8">
      
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-500/20">
            <Radio className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("smartRadio")}</h1>
            <p className="text-sm text-muted">{t("smartRadioDesc")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {smartChannels.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t("smartChannels")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {smartChannels.map((ch, i) => (
                  <SmartChannelCard
                    key={ch.id}
                    channel={ch}
                    index={i}
                    isActive={playingChannel === ch.id}
                    isPlaying={playingChannel === ch.id && isPlaying}
                    isLoading={loadingChannel === ch.id}
                    onPlay={() => startRadio(ch)}
                  />
                ))}
              </div>
            </section>
          )}

          
          {moodChannels.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t("moodRadio")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {moodChannels.map((ch, i) => (
                  <MoodChannelCard
                    key={ch.id}
                    channel={ch}
                    index={i}
                    isActive={playingChannel === ch.id}
                    isPlaying={playingChannel === ch.id && isPlaying}
                    isLoading={loadingChannel === ch.id}
                    onPlay={() => startRadio(ch)}
                  />
                ))}
              </div>
            </section>
          )}

          
          {genreChannels.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t("genreRadio")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {genreChannels.map((ch, i) => (
                  <GenreChannelCard
                    key={ch.id}
                    channel={ch}
                    index={i}
                    isActive={playingChannel === ch.id}
                    isPlaying={playingChannel === ch.id && isPlaying}
                    isLoading={loadingChannel === ch.id}
                    onPlay={() => startRadio(ch)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface ChannelCardProps {
  channel: RadioChannel;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
}

function SmartChannelCard({ channel, index, isActive, isPlaying, isLoading, onPlay }: ChannelCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all ${
        isActive
          ? "border-accent/40 bg-accent/10 ring-1 ring-accent/20"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]"
      }`}
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${channel.color}30, ${channel.color}15)`,
          border: `1px solid ${channel.color}40`,
        }}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: channel.color }} />
        ) : isPlaying ? (
          <Waves className="h-6 w-6 animate-pulse" style={{ color: channel.color }} />
        ) : (
          <ChannelIcon icon={channel.icon} className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{channel.name}</p>
        <p className="mt-0.5 text-xs text-muted line-clamp-1">{channel.description}</p>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          isActive
            ? "bg-accent text-white shadow-lg"
            : "bg-white/5 text-muted group-hover:bg-white/10 group-hover:text-foreground"
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </div>
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ background: `radial-gradient(ellipse at 30% 50%, ${channel.color}, transparent 70%)` }}
        />
      )}
    </motion.button>
  );
}

function MoodChannelCard({ channel, index, isActive, isPlaying, isLoading, onPlay }: ChannelCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-4 text-left transition-all ${
        isActive
          ? "border-accent/40 bg-accent/10"
          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${channel.color}20`, border: `1px solid ${channel.color}30` }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: channel.color }} />
        ) : (
          <ChannelIcon icon={channel.icon} className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{channel.name}</p>
        <p className="text-[11px] text-muted line-clamp-1">{channel.description}</p>
      </div>
      {isPlaying && <Waves className="h-4 w-4 flex-shrink-0 animate-pulse text-accent" />}
    </motion.button>
  );
}

function GenreChannelCard({ channel, index, isActive, isPlaying, isLoading, onPlay }: ChannelCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onPlay}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all ${
        isActive
          ? "border-accent/40 bg-accent/10"
          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/10">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-black/35">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: channel.color }} />
          </div>
        ) : channel.imageUrl ? (
          <img
            src={channel.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : channel.genreSlug ? (
          <GenreRadioPoster genreSlug={channel.genreSlug} color={channel.color} size={40} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-lg"
            style={{ background: `${channel.color}22` }}
          >
            <Music className="h-4 w-4" style={{ color: channel.color }} />
          </div>
        )}
      </div>
      <p className="flex-1 truncate text-sm font-medium text-foreground">{channel.name}</p>
      {isPlaying && <Waves className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-accent" />}
    </motion.button>
  );
}
