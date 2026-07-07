"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { StevenSelect } from "@/components/ui/StevenSelect";

type TrackDto = {
  title: string;
  author: string;
  durationMs: number;
  url: string;
  thumbnail?: string | null;
};

type PlayerStateDto = {
  ok?: boolean;
  active: boolean;
  current: TrackDto | null;
  positionMs: number;
  durationMs: number;
  progress: number;
  volume: number;
  paused: boolean;
  loopMode: string;
  upcoming: { index: number; title: string; author: string; durationMs: number; url: string }[];
  error?: string;
};

type StatsDto = {
  ok?: boolean;
  listenMsApprox: number;
  leaderboard: {
    userId: string;
    username: string;
    panelActions: number;
    slashCommands: number;
    score: number;
  }[];
};

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtListenMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(ms / 1000)}s`;
}

const EFFECT_TYPES = [
  "clear",
  "bassboost",
  "nightcore",
  "vaporwave",
  "8D",
  "karaoke",
  "normalizer",
  "treble",
] as const;

export function DiscordBotStudioPanel({
  guildId,
  visible,
  pushLog,
  voiceChannelId,
  notifyChannelId,
}: {
  guildId: string;
  visible: boolean;
  pushLog: (line: string) => void;
  voiceChannelId?: string;
  notifyChannelId?: string;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<PlayerStateDto | null>(null);
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [seekPct, setSeekPct] = useState(0);
  const [playNextQ, setPlayNextQ] = useState("");
  const [moveFrom, setMoveFrom] = useState("1");
  const [moveTo, setMoveTo] = useState("2");
  const [lyricsQ, setLyricsQ] = useState("");
  const [lyricsOut, setLyricsOut] = useState<{ name: string; text: string } | null>(null);
  const [historyTracks, setHistoryTracks] = useState<{ title: string }[] | null>(null);
  const [diagPing, setDiagPing] = useState<number | null>(null);
  const [diagPlayer, setDiagPlayer] = useState<string | null>(null);
  const [effectPick, setEffectPick] = useState<(typeof EFFECT_TYPES)[number]>("bassboost");

  const notifyBridge = useMemo(
    () => (notifyChannelId ? { notifyChannelId } : {}),
    [notifyChannelId]
  );

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const r = await fetch(`/api/discord-bot/control/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, ...extra }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: r.ok, status: r.status, j };
    },
    [guildId]
  );

  const loadState = useCallback(async () => {
    const { ok, j } = await call("state");
    if (ok && j && typeof j === "object" && "active" in j) {
      const p = j as PlayerStateDto;
      setState(p);
      const dur = p.durationMs || 0;
      const pos = p.positionMs || 0;
      if (dur > 0) setSeekPct(Math.min(100, Math.max(0, (pos / dur) * 100)));
      else setSeekPct(0);
    } else {
      setState(null);
      const err = typeof j.error === "string" ? j.error : `HTTP`;
      pushLog(`[Kontrol] state: ${err}`);
    }
  }, [call, pushLog]);

  const loadStats = useCallback(async () => {
    const { ok, j } = await call("stats");
    if (ok && j && typeof j === "object" && "leaderboard" in j) {
      setStats(j as StatsDto);
    } else {
      setStats(null);
    }
  }, [call]);

  const refreshAll = useCallback(async () => {
    await loadState();
    await loadStats();
  }, [loadState, loadStats]);

  useEffect(() => {
    if (!visible || !guildId) return;
    void refreshAll();
    const id = window.setInterval(() => {
      void loadState();
    }, 2800);
    return () => window.clearInterval(id);
  }, [visible, guildId, loadState, refreshAll]);

  async function run(
    action: string,
    extra: Record<string, unknown> = {},
    logLabel?: string
  ): Promise<boolean> {
    setBusy(true);
    try {
      const { ok, j } = await call(action, extra);
      const err =
        (typeof j.error === "string" && j.error) ||
        (typeof j.message === "string" && j.message) ||
        "";
      if (ok) {
        if (logLabel) pushLog(`[Kontrol] ${logLabel}`);
        await loadState();
        await loadStats();
        return true;
      }
      pushLog(`[Kontrol] ${logLabel ?? action}: ${err || t("discordBotStudioErr")}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const dur = state?.durationMs ?? 0;
  const live = state?.current?.durationMs === 0 || (state?.current?.title && dur === 0);

  async function commitSeek() {
    if (!state?.active || live || dur <= 0) return;
    const ms = Math.floor((seekPct / 100) * dur);
    await run("seek", { positionMs: ms }, "Seek");
  }

  const btn =
    "rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm";
  const btnPrimary =
    "rounded-xl border border-violet-500/40 bg-violet-600/25 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/35 disabled:opacity-40 sm:text-sm";
  const loopActive = (mode: string) =>
    state?.loopMode === mode ? "ring-1 ring-violet-400/60 bg-violet-500/20" : "";

  const hasVoice = Boolean(voiceChannelId && voiceChannelId.length > 0);
  const detailsCls =
    "group rounded-2xl border border-white/[0.08] bg-zinc-950/40 [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:marker:hidden";

  async function runNotify(
    action: string,
    extra: Record<string, unknown>,
    logLabel?: string
  ): Promise<boolean> {
    return run(action, { ...notifyBridge, ...extra }, logLabel);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("discordBotStudioTitle")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{t("discordBotStudioIntro")}</p>
          <p className="mt-2 max-w-2xl text-xs text-zinc-600">{t("discordBotStudioSlashParityNote")}</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void refreshAll()} className={btnPrimary}>
          {t("discordBotStudioRefresh")}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("discordBotStudioJoinSection")}
        </p>
        <p className="mt-1 text-xs text-zinc-600">{t("discordBotStudioJoinHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !hasVoice}
            className={btnPrimary}
            onClick={() =>
              void runNotify("join", { channelId: voiceChannelId! }, t("discordBotStudioJoin"))
            }
          >
            {t("discordBotStudioJoin")}
          </button>
          <button
            type="button"
            disabled={busy}
            className={btn}
            onClick={() => void run("leave", {}, t("discordBotStudioLeave"))}
          >
            {t("discordBotStudioLeave")}
          </button>
        </div>
      </div>

      {!state?.active ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          {t("discordBotStudioInactive")}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("discordBotStudioNowPlaying")}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                className={btnPrimary}
                onClick={() => void runNotify("syncpanel", {}, "syncpanel")}
              >
                {t("discordBotStudioSyncPanel")}
              </button>
            </div>
            <p className="mt-2 text-base font-medium text-white">
              {state.current?.title ?? "—"}
              {live ? (
                <span className="ml-2 text-xs font-normal text-amber-400/90">({t("discordBotStudioLive")})</span>
              ) : null}
            </p>
            <p className="text-sm text-zinc-500">{state.current?.author || ""}</p>
            {!live && dur > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{fmtTime((seekPct / 100) * dur)}</span>
                  <span>{fmtTime(dur)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={seekPct}
                  disabled={busy}
                  onChange={(e) => setSeekPct(Number(e.target.value))}
                  onPointerUp={() => void commitSeek()}
                  onMouseUp={() => void commitSeek()}
                  className="h-2 w-full cursor-pointer accent-violet-500"
                />
                <p className="text-[11px] text-zinc-600">{t("discordBotStudioSeekHint")}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("discordBotStudioVol")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() => void run("volume", { level: 0 }, "Sessiz")}
              >
                {t("discordBotStudioMute")}
              </button>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() => void run("voldelta", { delta: -10 }, "Ses −")}
              >
                {t("discordBotStudioVolDown")}
              </button>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() => void run("voldelta", { delta: 10 }, "Ses +")}
              >
                {t("discordBotStudioVolUp")}
              </button>
              <button
                type="button"
                disabled={busy}
                className={btn}
                onClick={() => void run("volume", { level: 100 }, "Ses max")}
              >
                {t("discordBotStudioVolMax")}
              </button>
              <span className="flex items-center px-2 text-sm text-zinc-400">%{state.volume}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {state.paused ? (
              <button type="button" disabled={busy} className={btnPrimary} onClick={() => void run("resume", {}, "Devam")}>
                {t("discordBotStudioResume")}
              </button>
            ) : (
              <button type="button" disabled={busy} className={btn} onClick={() => void run("pause", {}, "Duraklat")}>
                {t("discordBotStudioPause")}
              </button>
            )}
            <button type="button" disabled={busy} className={btn} onClick={() => void run("skip", {}, "Atla")}>
              {t("discordBotStudioSkip")}
            </button>
            <button type="button" disabled={busy} className={btn} onClick={() => void run("back", {}, "back")}>
              {t("discordBotStudioBack")}
            </button>
            <button type="button" disabled={busy} className={btn} onClick={() => void run("replay", {}, "replay")}>
              {t("discordBotStudioReplay")}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-40 sm:text-sm"
              onClick={() => void run("stop", {}, "Durdur")}
            >
              {t("discordBotStudioStop")}
            </button>
            <button type="button" disabled={busy} className={btn} onClick={() => void run("shuffle", {}, "Karıştır")}>
              {t("discordBotStudioShuffle")}
            </button>
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={() => void run("clearqueue", {}, "Sıra temiz")}
            >
              {t("discordBotStudioClearQueue")}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("discordBotStudioLoop")}</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["off", "discordBotStudioLoopOff"],
                  ["track", "discordBotStudioLoopTrack"],
                  ["queue", "discordBotStudioLoopQueue"],
                  ["autoplay", "discordBotStudioLoopAutoplay"],
                ] as const
              ).map(([mode, key]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={busy}
                  className={`${btn} ${loopActive(mode)}`}
                  onClick={() => void run("loop", { mode }, `Loop ${mode}`)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("discordBotStudioUpcoming")}
            </p>
            {state.upcoming.length === 0 ? (
              <p className="text-sm text-zinc-600">—</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {state.upcoming.map((row) => (
                  <li
                    key={row.index}
                    className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-zinc-600">#{row.index}</span>{" "}
                      <span className="text-sm text-zinc-200">{row.title}</span>
                      <p className="truncate text-xs text-zinc-500">{row.author}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className={btnPrimary}
                        onClick={() => void run("skipto", { index: row.index }, `Sıra #${row.index}`)}
                      >
                        {t("discordBotStudioPlayThis")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={btn}
                        onClick={() => void run("remove", { index: row.index }, `Sil #${row.index}`)}
                      >
                        {t("discordBotStudioRemove")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioExtraPlayTitle")}
        </summary>
        <div className="space-y-3 border-t border-white/[0.06] px-4 py-4">
          <label className="block text-xs text-zinc-500">{t("discordBotStudioPlaynextLabel")}</label>
          <input
            value={playNextQ}
            onChange={(e) => setPlayNextQ(e.target.value)}
            placeholder={t("discordBotQueryPlaceholder")}
            disabled={busy}
            className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
          />
          <button
            type="button"
            disabled={busy || !hasVoice || !playNextQ.trim()}
            className={btnPrimary}
            onClick={() =>
              void runNotify(
                "playnext",
                { channelId: voiceChannelId!, query: playNextQ.trim() },
                "playnext"
              ).then((ok) => {
                if (ok) setPlayNextQ("");
              })
            }
          >
            {t("discordBotStudioPlaynext")}
          </button>
        </div>
      </details>

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioMoveTitle")}
        </summary>
        <div className="flex flex-wrap items-end gap-3 border-t border-white/[0.06] px-4 py-4">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            {t("discordBotStudioMoveFrom")}
            <input
              value={moveFrom}
              onChange={(e) => setMoveFrom(e.target.value)}
              inputMode="numeric"
              className="w-20 rounded-lg border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            {t("discordBotStudioMoveTo")}
            <input
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              inputMode="numeric"
              className="w-20 rounded-lg border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-sm text-zinc-100"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={() => {
              const from = Number.parseInt(moveFrom, 10);
              const to = Number.parseInt(moveTo, 10);
              if (!Number.isFinite(from) || !Number.isFinite(to)) return;
              void run("move", { from, to }, "move");
            }}
          >
            {t("discordBotStudioMoveApply")}
          </button>
        </div>
      </details>

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioLyricsTitle")}
        </summary>
        <div className="space-y-3 border-t border-white/[0.06] px-4 py-4">
          <input
            value={lyricsQ}
            onChange={(e) => setLyricsQ(e.target.value)}
            placeholder={t("discordBotStudioLyricsPlaceholder")}
            disabled={busy}
            className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/40"
          />
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={async () => {
              setBusy(true);
              try {
                const ex = lyricsQ.trim() ? { query: lyricsQ.trim() } : {};
                const { ok, j } = await call("lyrics", ex);
                if (ok && j && typeof j === "object" && "text" in j) {
                  setLyricsOut({
                    name: String((j as { name?: string }).name ?? ""),
                    text: String((j as { text?: string }).text ?? ""),
                  });
                  pushLog("[Kontrol] lyrics");
                } else {
                  setLyricsOut(null);
                  const err = typeof (j as { error?: string }).error === "string" ? (j as { error: string }).error : "";
                  pushLog(`[Kontrol] lyrics: ${err || "err"}`);
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("discordBotStudioLyricsFetch")}
          </button>
          {lyricsOut ? (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <p className="text-sm font-medium text-violet-200">{lyricsOut.name}</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{lyricsOut.text}</pre>
            </div>
          ) : null}
        </div>
      </details>

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioHistoryTitle")}
        </summary>
        <div className="space-y-3 border-t border-white/[0.06] px-4 py-4">
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={async () => {
              setBusy(true);
              try {
                const { ok, j } = await call("history", {});
                if (ok && j && typeof j === "object" && "tracks" in j) {
                  setHistoryTracks((j as { tracks: { title: string }[] }).tracks);
                } else {
                  setHistoryTracks(null);
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("discordBotStudioHistoryLoad")}
          </button>
          {historyTracks?.length ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-400">
              {historyTracks.map((h, i) => (
                <li key={`${h.title}-${i}`}>{h.title}</li>
              ))}
            </ol>
          ) : historyTracks?.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("discordBotStudioHistoryEmpty")}</p>
          ) : null}
        </div>
      </details>

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioEffectTitle")}
        </summary>
        <div className="flex flex-wrap items-end gap-3 border-t border-white/[0.06] px-4 py-4">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            {t("discordBotStudioEffectPick")}
            <StevenSelect
              value={effectPick}
              onChange={(e) => setEffectPick(e.target.value as (typeof EFFECT_TYPES)[number])}
            >
              {EFFECT_TYPES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </StevenSelect>
          </label>
          <button
            type="button"
            disabled={busy}
            className={btnPrimary}
            onClick={() => void run("effect", { effect: effectPick }, `effect ${effectPick}`)}
          >
            {t("discordBotStudioEffectApply")}
          </button>
          <button
            type="button"
            disabled={busy}
            className={btn}
            onClick={() => void run("autoplaytoggle", {}, "autoplay")}
          >
            {t("discordBotStudioAutoplayToggle")}
          </button>
        </div>
      </details>

      <details className={detailsCls}>
        <summary className="px-4 py-3 text-sm font-medium text-violet-200/95">
          {t("discordBotStudioDiagTitle")}
        </summary>
        <div className="space-y-3 border-t border-white/[0.06] px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={async () => {
                setBusy(true);
                try {
                  const { ok, j } = await call("ping", {});
                  if (ok && j && typeof (j as { pingMs?: unknown }).pingMs === "number") {
                    setDiagPing((j as { pingMs: number }).pingMs);
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("discordBotStudioPing")}
            </button>
            <button
              type="button"
              disabled={busy}
              className={btn}
              onClick={async () => {
                setBusy(true);
                try {
                  const { ok, j } = await call("playerstats", {});
                  if (ok && j) {
                    const o = j as {
                      queuesCount?: number;
                      queryCacheEnabled?: boolean;
                      queues?: { tracksCount: number; historySize: number; playing: boolean }[];
                    };
                    const lines = [
                      `${t("discordBotStudioDiagQueues")}: ${o.queuesCount ?? "—"}`,
                      `${t("discordBotStudioDiagCache")}: ${o.queryCacheEnabled ? "on" : "off"}`,
                      ...(o.queues ?? []).map(
                        (q, i) =>
                          `#${i + 1} · ${q.tracksCount} tr · ${q.historySize} hist · ${q.playing ? "▶" : "■"}`
                      ),
                    ];
                    setDiagPlayer(lines.join("\n"));
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("discordBotStudioPlayerStats")}
            </button>
          </div>
          {diagPing !== null ? (
            <p className="font-mono text-sm text-zinc-300">
              {t("discordBotStudioPingMs").replace("{{ms}}", String(diagPing))}
            </p>
          ) : null}
          {diagPlayer ? (
            <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-xs text-zinc-400">
              {diagPlayer}
            </pre>
          ) : null}
        </div>
      </details>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">{t("discordBotStudioStatsTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500">{t("discordBotStudioListenApprox")}</p>
        <p className="mt-2 font-mono text-lg text-violet-200">{fmtListenMs(stats?.listenMsApprox ?? 0)}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("discordBotStudioLeaderboard")}
        </p>
        {!stats?.leaderboard?.length ? (
          <p className="mt-2 text-sm text-zinc-600">{t("discordBotStudioNoStats")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-2 font-medium">{t("discordBotStudioColUser")}</th>
                  <th className="py-2 pr-2 font-medium">{t("discordBotStudioColPanel")}</th>
                  <th className="py-2 pr-2 font-medium">{t("discordBotStudioColSlash")}</th>
                  <th className="py-2 font-medium">{t("discordBotStudioColScore")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((row, i) => (
                  <tr key={row.userId} className="border-b border-white/[0.04] text-zinc-300">
                    <td className="py-2 pr-2 text-zinc-600">{i + 1}</td>
                    <td className="max-w-[140px] truncate py-2 pr-2" title={row.username}>
                      {row.username}
                    </td>
                    <td className="py-2 pr-2">{row.panelActions}</td>
                    <td className="py-2 pr-2">{row.slashCommands}</td>
                    <td className="py-2 font-medium text-violet-200">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
