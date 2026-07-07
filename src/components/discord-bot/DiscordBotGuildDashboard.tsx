"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Inbox,
  LayoutDashboard,
  Layers,
  Link2,
  ListMusic,
  Music2,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import { AciusfyLogoMark } from "@/components/branding/AciusfyLogoMark";
import { DiscordAccountLinkAnimation } from "@/components/discord-bot/DiscordAccountLinkAnimation";
import { DiscordGlyph } from "@/components/discord-bot/DiscordGlyph";
import { DiscordBotAmbientLayer } from "@/components/discord-bot/DiscordBotMotionDecor";
import { StevenSelect } from "@/components/ui/StevenSelect";
import { DiscordBotStudioPanel } from "@/components/discord-bot/DiscordBotStudioPanel";
import { DISCORD_BOT_CAPABILITY_GROUPS } from "@/lib/discord-bot-panel-capabilities";
import { DISCORD_BOT_SLASH_COMMANDS } from "@/lib/discord-bot-panel-reference";
import { getTranslation } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";

type SessionUser = { id: string; username: string; avatarUrl: string | null };
type GuildRow = { id: string; name: string; iconUrl: string | null };
type VoiceCh = { id: string; name: string };
type TextCh = { id: string; name: string };
type PanelSection =
  | "overview"
  | "music"
  | "studio"
  | "features"
  | "commands"
  | "customize"
  | "logs"
  | "settings";
type PanelLogEntry = { id: string; ts: number; line: string };

const LOG_STORAGE_KEY = "aciusfy-discord-panel-logs";
const PANEL_PREFS_KEY = "aciusfy-discord-panel-prefs";

type PanelPrefs = { defaultVoiceChannelId?: string; panelNotifyChannelId?: string };

function loadPanelPrefs(guildId: string): PanelPrefs {
  if (typeof window === "undefined" || !guildId) return {};
  try {
    const raw = localStorage.getItem(`${PANEL_PREFS_KEY}:${guildId}`);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return {};
    const id = (o as { defaultVoiceChannelId?: unknown }).defaultVoiceChannelId;
    const nid = (o as { panelNotifyChannelId?: unknown }).panelNotifyChannelId;
    const out: PanelPrefs = {};
    if (typeof id === "string" && id.length > 0) out.defaultVoiceChannelId = id;
    if (typeof nid === "string" && nid.length > 0) out.panelNotifyChannelId = nid;
    return out;
  } catch {
    return {};
  }
}

function savePanelPrefs(guildId: string, prefs: PanelPrefs) {
  if (typeof window === "undefined" || !guildId) return;
  try {
    const prev = loadPanelPrefs(guildId);
    const next = { ...prev, ...prefs };
    localStorage.setItem(`${PANEL_PREFS_KEY}:${guildId}`, JSON.stringify(next));
  } catch {}
}

function loadStoredLogs(guildId: string): PanelLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(`${LOG_STORAGE_KEY}:${guildId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PanelLogEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

function saveStoredLogs(guildId: string, entries: PanelLogEntry[]) {
  try {
    sessionStorage.setItem(`${LOG_STORAGE_KEY}:${guildId}`, JSON.stringify(entries.slice(0, 100)));
  } catch {}
}

function DiscordBotNotifyChannelSelect({
  t,
  textLoading,
  textChannels,
  value,
  onChange,
  lead,
  persistHint,
}: {
  t: (key: string) => string;
  textLoading: boolean;
  textChannels: TextCh[];
  value: string;
  onChange: (id: string) => void;
  lead?: string;
  persistHint?: boolean;
}) {
  return (
    <div className="space-y-2">
      {lead ? <p className="text-sm text-zinc-400">{lead}</p> : null}
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          {t("discordBotNotifyChannel")}
        </span>
        <StevenSelect
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={textLoading || textChannels.length === 0}
          className="max-w-md"
        >
          {textLoading ? (
            <option value="">{t("discordBotLoading")}</option>
          ) : textChannels.length === 0 ? (
            <option value="">{t("discordBotNoTextChannels")}</option>
          ) : (
            <>
              <option value="">{t("discordBotNotifyChannelAuto")}</option>
              {textChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </>
          )}
        </StevenSelect>
      </label>
      <p className="text-xs text-zinc-500">{t("discordBotCustomizeNotifyHint")}</p>
      {persistHint ? (
        <p className="text-xs text-zinc-600">{t("discordBotCustomizeNotifyPersistHint")}</p>
      ) : null}
    </div>
  );
}

export function DiscordBotGuildDashboard() {
  const { t, language } = useTranslation();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const params = useParams();
  const guildId = typeof params.guildId === "string" ? params.guildId : "";

  const [oauthAnimOpen, setOauthAnimOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [guilds, setGuilds] = useState<GuildRow[] | null>(null);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [section, setSection] = useState<PanelSection>("overview");

  const [voiceChannels, setVoiceChannels] = useState<VoiceCh[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [textChannels, setTextChannels] = useState<TextCh[]>([]);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [notifyChannelId, setNotifyChannelId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [query, setQuery] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [panelLogs, setPanelLogs] = useState<PanelLogEntry[]>([]);

  type SongReqRow = { id: string; query: string; requesterDiscordUsername: string | null };
  const [songReqQuery, setSongReqQuery] = useState("");
  const [songReqBusy, setSongReqBusy] = useState(false);
  const [songModQueue, setSongModQueue] = useState<SongReqRow[] | "forbidden" | null>(null);
  const [ltShareCode, setLtShareCode] = useState("");
  const [ltCopied, setLtCopied] = useState(false);

  const pushLog = useCallback(
    (line: string) => {
      const entry: PanelLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ts: Date.now(),
        line,
      };
      setPanelLogs((prev) => {
        const next = [entry, ...prev].slice(0, 100);
        if (guildId) saveStoredLogs(guildId, next);
        return next;
      });
    },
    [guildId]
  );

  const refreshSession = useCallback(async () => {
    const r = await fetch("/api/discord-bot/session", { credentials: "include" });
    const j = (await r.json()) as { user: SessionUser | null };
    setUser(j.user ?? null);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!guildId || section !== "music" || !user) return;
    let cancelled = false;
    setSongModQueue(null);
    void (async () => {
      const r = await fetch(`/api/discord-bot/guilds/${guildId}/song-requests`, { credentials: "include" });
      if (cancelled) return;
      if (r.status === 403) setSongModQueue("forbidden");
      else if (r.ok) {
        const j = (await r.json()) as { requests?: SongReqRow[] };
        setSongModQueue(j.requests ?? []);
      } else setSongModQueue("forbidden");
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId, section, user]);

  useEffect(() => {
    if (!guildId) return;
    setPanelLogs(loadStoredLogs(guildId));
  }, [guildId]);

  const loadGuilds = useCallback(async () => {
    setGuildsLoading(true);
    setGuilds(null);
    try {
      const r = await fetch("/api/discord-bot/guilds", { credentials: "include" });
      if (r.status === 401) {
        setUser(null);
        setGuilds([]);
        return;
      }
      const j = (await r.json()) as { guilds?: GuildRow[] };
      setGuilds(j.guilds ?? []);
    } catch {
      setGuilds([]);
    } finally {
      setGuildsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadGuilds();
    else setGuilds(null);
  }, [user, loadGuilds]);

  useEffect(() => {
    if (!guildId || !user) {
      setVoiceChannels([]);
      setChannelId("");
      setVoiceLoading(false);
      setVoiceError(null);
      setTextChannels([]);
      setNotifyChannelId("");
      setTextLoading(false);
      setTextError(null);
      return;
    }
    let cancelled = false;
    setVoiceLoading(true);
    setTextLoading(true);
    setVoiceError(null);
    setTextError(null);

    function voiceErrorMessage(r: Response, j: { error?: string; status?: number }): string {
      if (j.error === "forbidden") {
        return getTranslation("discordBotVoiceChannelsForbiddenDetail", language);
      }
      if (j.error === "discord_api_guilds") {
        const code = typeof j.status === "number" ? j.status : r.status;
        return code === 429
          ? getTranslation("discordBotVoiceChannelsRateLimited", language)
          : getTranslation("discordBotVoiceChannelsDiscordApiDown", language) +
              (typeof j.status === "number" ? ` (${j.status})` : "");
      }
      if (typeof j.error === "string") {
        return getTranslation("discordBotVoiceChannelsLoadError", language);
      }
      return `${getTranslation("discordBotVoiceChannelsLoadError", language)}: HTTP ${r.status}`;
    }

    function textErrorMessage(r: Response, j: { error?: string; status?: number }): string {
      if (j.error === "forbidden") {
        return getTranslation("discordBotTextChannelsForbiddenDetail", language);
      }
      if (j.error === "discord_api_guilds") {
        const code = typeof j.status === "number" ? j.status : r.status;
        return code === 429
          ? getTranslation("discordBotTextChannelsRateLimited", language)
          : getTranslation("discordBotTextChannelsDiscordApiDown", language) +
              (typeof j.status === "number" ? ` (${j.status})` : "");
      }
      if (typeof j.error === "string") {
        return getTranslation("discordBotTextChannelsLoadError", language);
      }
      return `${getTranslation("discordBotTextChannelsLoadError", language)}: HTTP ${r.status}`;
    }

    (async () => {
      const [rv, rt] = await Promise.all([
        fetch(`/api/discord-bot/guilds/${guildId}/voice-channels`, { credentials: "include" }),
        fetch(`/api/discord-bot/guilds/${guildId}/text-channels`, { credentials: "include" }),
      ]);
      if (cancelled) return;
      setVoiceLoading(false);
      setTextLoading(false);

      if (!rv.ok) {
        let msg: string;
        try {
          const j = (await rv.json()) as { error?: string; status?: number };
          msg = voiceErrorMessage(rv, j);
        } catch {
          msg = `${getTranslation("discordBotVoiceChannelsLoadError", language)}: HTTP ${rv.status}`;
        }
        setVoiceChannels([]);
        setChannelId("");
        setVoiceError(msg);
        pushLog(msg);
      } else {
        const j = (await rv.json()) as { channels?: VoiceCh[] };
        const list = j.channels ?? [];
        setVoiceChannels(list);
        setVoiceError(null);
        setChannelId((prev) => {
          const saved = loadPanelPrefs(guildId).defaultVoiceChannelId;
          if (saved && list.some((c) => c.id === saved)) return saved;
          if (prev && list.some((c) => c.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
        pushLog(`${getTranslation("discordBotVoiceChannel", language)}: ${list.length} kanal`);
      }

      if (!rt.ok) {
        let msg: string;
        try {
          const j = (await rt.json()) as { error?: string; status?: number };
          msg = textErrorMessage(rt, j);
        } catch {
          msg = `${getTranslation("discordBotTextChannelsLoadError", language)}: HTTP ${rt.status}`;
        }
        setTextChannels([]);
        setNotifyChannelId("");
        setTextError(msg);
      } else {
        const j = (await rt.json()) as { channels?: TextCh[] };
        const list = j.channels ?? [];
        setTextChannels(list);
        setTextError(null);
        setNotifyChannelId((prev) => {
          const saved = loadPanelPrefs(guildId).panelNotifyChannelId;
          if (saved && list.some((c) => c.id === saved)) return saved;
          if (prev && list.some((c) => c.id === prev)) return prev;
          return "";
        });
      }
    })().catch(() => {
      if (cancelled) return;
      setVoiceLoading(false);
      setTextLoading(false);
      const msg = getTranslation("discordBotVoiceChannelsLoadError", language);
      setVoiceError(msg);
      pushLog(msg);
      setTextError(getTranslation("discordBotTextChannelsLoadError", language));
    });
    return () => {
      cancelled = true;
    };
  }, [guildId, user, language, pushLog]);

  useEffect(() => {
    if (!guildId || !channelId || voiceChannels.length === 0) return;
    if (!voiceChannels.some((c) => c.id === channelId)) return;
    const cur = loadPanelPrefs(guildId).defaultVoiceChannelId;
    if (cur === channelId) return;
    savePanelPrefs(guildId, { defaultVoiceChannelId: channelId });
  }, [guildId, channelId, voiceChannels]);

  useEffect(() => {
    if (!guildId) return;
    const saved = loadPanelPrefs(guildId).panelNotifyChannelId ?? "";
    const next = notifyChannelId || "";
    if (next && textChannels.length > 0 && !textChannels.some((c) => c.id === next)) return;
    if (saved === next) return;
    const prev = loadPanelPrefs(guildId);
    try {
      if (!next) {
        const rest = { ...prev };
        delete rest.panelNotifyChannelId;
        localStorage.setItem(`${PANEL_PREFS_KEY}:${guildId}`, JSON.stringify(rest));
      } else {
        savePanelPrefs(guildId, { panelNotifyChannelId: next });
      }
    } catch {}
  }, [guildId, notifyChannelId, textChannels]);

  async function logout() {
    setOauthAnimOpen(true);
    const started = Date.now();
    try {
      await fetch("/api/discord-bot/oauth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    setGuilds(null);
    const elapsed = Date.now() - started;
    window.setTimeout(() => {
      setOauthAnimOpen(false);
      router.push("/discord-bot");
    }, Math.max(0, 1350 - elapsed));
  }

  async function postControl(
    path: "/api/discord-bot/play" | "/api/discord-bot/skip" | "/api/discord-bot/stop",
    body: object,
    label: string
  ) {
    setPending(true);
    setActionMsg(null);
    try {
      const r = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as Record<string, unknown>;
      if (r.ok && j.ok === true) {
        const okText =
          path === "/api/discord-bot/play" && typeof j.title === "string" ? j.title : "OK";
        setActionMsg(okText);
        pushLog(`[${label}] ${okText}`);
      } else {
        const msg =
          (typeof j.error === "string" && j.error) ||
          (typeof j.message === "string" && j.message) ||
          t("discordBotErrorGeneric");
        setActionMsg(msg);
        pushLog(`[${label}] Hata: ${msg}`);
      }
    } catch {
      const msg = t("discordBotErrorGeneric");
      setActionMsg(msg);
      pushLog(`[${label}] ${msg}`);
    } finally {
      setPending(false);
    }
  }

  async function submitSongRequest() {
    if (!guildId || !songReqQuery.trim()) return;
    setSongReqBusy(true);
    setActionMsg(null);
    try {
      const r = await fetch(`/api/discord-bot/guilds/${guildId}/song-requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: songReqQuery.trim() }),
      });
      const j = (await r.json()) as { error?: string };
      if (r.ok) {
        setSongReqQuery("");
        setActionMsg(t("discordSongRequestSent"));
        pushLog(`[İstek] ${t("discordSongRequestSent")}`);
        const lr = await fetch(`/api/discord-bot/guilds/${guildId}/song-requests`, { credentials: "include" });
        if (lr.ok) {
          const jj = (await lr.json()) as { requests?: SongReqRow[] };
          if (jj.requests) setSongModQueue(jj.requests);
        }
      } else {
        const msg = j.error || t("discordBotErrorGeneric");
        setActionMsg(msg);
        pushLog(`[İstek] Hata: ${msg}`);
      }
    } catch {
      const msg = t("discordBotErrorGeneric");
      setActionMsg(msg);
    } finally {
      setSongReqBusy(false);
    }
  }

  async function moderateRequest(id: string, action: "approve" | "reject") {
    if (!guildId) return;
    setSongReqBusy(true);
    try {
      const body =
        action === "approve"
          ? {
              action: "approve" as const,
              channelId,
              ...(notifyChannelId ? { notifyChannelId } : {}),
            }
          : { action: "reject" as const };
      const r = await fetch(`/api/discord-bot/guilds/${guildId}/song-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as { error?: string };
      if (r.ok) {
        pushLog(action === "approve" ? "[İstek] Onaylandı" : "[İstek] Reddedildi");
        const lr = await fetch(`/api/discord-bot/guilds/${guildId}/song-requests`, { credentials: "include" });
        if (lr.ok) {
          const jj = (await lr.json()) as { requests?: SongReqRow[] };
          if (jj.requests) setSongModQueue(jj.requests);
        }
      } else {
        pushLog(`[İstek] ${j.error || t("discordBotErrorGeneric")}`);
      }
    } finally {
      setSongReqBusy(false);
    }
  }

  function copyListenTogetherUrl() {
    const code = ltShareCode.trim().toUpperCase();
    if (code.length !== 6) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/home?lt=${code}`;
    void navigator.clipboard.writeText(url).then(() => {
      setLtCopied(true);
      window.setTimeout(() => setLtCopied(false), 2000);
    });
  }

  const guild = guilds?.find((g) => g.id === guildId);
  const invalidGuild = Boolean(user && guilds !== null && !guildsLoading && guildId && !guild);

  const navItems: { id: PanelSection; label: string; icon: typeof Music2 }[] = [
    { id: "overview", label: t("discordBotPanelNavOverview"), icon: LayoutDashboard },
    { id: "music", label: t("discordBotPanelNavMusic"), icon: Music2 },
    { id: "studio", label: t("discordBotPanelNavStudio"), icon: Wand2 },
    { id: "features", label: t("discordBotPanelNavFeatures"), icon: Layers },
    { id: "commands", label: t("discordBotPanelNavCommands"), icon: ListMusic },
    { id: "customize", label: t("discordBotPanelNavCustomize"), icon: SlidersHorizontal },
    { id: "logs", label: t("discordBotPanelNavLogs"), icon: ScrollText },
    { id: "settings", label: t("discordBotPanelNavSettings"), icon: Settings },
  ];

  function NavButton({ item, className }: { item: (typeof navItems)[0]; className?: string }) {
    const Icon = item.icon;
    const active = section === item.id;
    return (
      <button
        type="button"
        onClick={() => setSection(item.id)}
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${className ?? ""} ${
          active
            ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/35"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {item.label}
      </button>
    );
  }

  return (
    <div className="relative min-h-dvh">
      <DiscordAccountLinkAnimation open={oauthAnimOpen} mode="disconnect" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <DiscordBotAmbientLayer />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
        <motion.div
          className="absolute -left-1/4 top-0 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[120px]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.05, 1] }
          }
          transition={{ type: "tween", duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[100px]"
          animate={reduceMotion ? undefined : { x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ type: "tween", duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(124,58,237,0.12),transparent)]" />
      </div>

      <div className="relative z-10">
        <motion.nav
          className="premium-subnav-bar sticky top-0 z-20"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href="/discord-bot"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/10 sm:px-3 sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {t("discordBotBackToServers")}
              </Link>
              <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              <div className="flex min-w-0 items-center gap-2">
                <AciusfyLogoMark className="h-8 w-8 shrink-0 rounded-lg" alt="" imgClassName="p-px" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-white">
                    {guild?.name ?? (guildsLoading ? t("discordBotLoading") : "Discord")}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">{t("discordBotGuildPanelSubtitle")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <motion.button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-red-500/10 hover:text-red-200 sm:text-sm"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  {t("discordBotLogout")}
                </motion.button>
              ) : null}
              <Link
                href="/"
                className="block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/30 hover:bg-white/10 sm:px-4 sm:text-sm"
              >
                {t("discordBotBackToSite")}
              </Link>
            </div>
          </div>
        </motion.nav>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {user === undefined ? (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : !user ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <DiscordGlyph className="mx-auto mb-4 h-12 w-12 text-[#5865F2]" />
              <p className="text-sm text-zinc-400">{t("discordBotGoToDiscordBotHome")}</p>
              <Link
                href="/discord-bot"
                className="mt-6 inline-flex rounded-full bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white"
              >
                {t("discordBotLoginDiscord")}
              </Link>
            </div>
          ) : guilds === null || guildsLoading ? (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : invalidGuild ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-8 text-center">
              <p className="text-sm text-amber-100">{t("discordBotInvalidGuild")}</p>
              <Link
                href="/discord-bot"
                className="mt-6 inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                {t("discordBotBackToServers")}
              </Link>
            </div>
          ) : guild ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <aside className="hidden w-full shrink-0 lg:block lg:w-60 xl:w-64">
                <div className="sticky top-24 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-2 backdrop-blur-sm">
                  {navItems.map((item) => (
                    <NavButton key={item.id} item={item} />
                  ))}
                </div>
              </aside>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => (
                  <NavButton key={item.id} item={item} className="shrink-0 whitespace-nowrap" />
                ))}
              </div>

              <main className="min-w-0 flex-1">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8"
                >
                  <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-white/10 pb-6">
                    {guild.iconUrl ? (
                      <Image
                        src={guild.iconUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-2xl ring-2 ring-violet-500/25"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-sm font-semibold text-zinc-400 ring-2 ring-violet-500/25">
                        {guild.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-semibold text-white sm:text-2xl">{guild.name}</h1>
                      <p className="mt-1 text-xs text-zinc-500">{t("discordBotControlHint")}</p>
                    </div>
                  </div>

                  {section === "overview" ? (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t("discordBotOverviewTitle")}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("discordBotOverviewLead")}</p>
                      </div>
                      <ul className="list-inside list-disc space-y-2.5 text-sm text-zinc-300 marker:text-violet-400">
                        <li>{t("discordBotOverviewBullet1")}</li>
                        <li>{t("discordBotOverviewBullet2")}</li>
                        <li>{t("discordBotOverviewBullet3")}</li>
                      </ul>
                    </div>
                  ) : null}

                  {section === "studio" ? (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-zinc-950/60 p-5">
                        <h3 className="text-sm font-semibold text-violet-100">{t("discordBotStudioNotifyBannerTitle")}</h3>
                        <p className="mt-1 text-xs text-zinc-500">{t("discordBotMusicNotifyChannelProminent")}</p>
                        <div className="mt-4">
                          <DiscordBotNotifyChannelSelect
                            t={t}
                            textLoading={textLoading}
                            textChannels={textChannels}
                            value={notifyChannelId}
                            onChange={setNotifyChannelId}
                          />
                        </div>
                      </div>
                      <DiscordBotStudioPanel
                        guildId={guildId}
                        visible={section === "studio"}
                        pushLog={pushLog}
                        voiceChannelId={channelId}
                        notifyChannelId={notifyChannelId || undefined}
                      />
                    </div>
                  ) : null}

                  {section === "music" ? (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t("discordBotPanelNavMusic")}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("discordBotMusicSectionLead")}</p>
                      </div>

                      {voiceError ? (
                        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          {voiceError}
                        </p>
                      ) : null}

                      <label className="block">
                        <span className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                          <span>{t("discordBotVoiceChannel")}</span>
                          <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-200">
                            {t("discordBotFieldRequired")}
                          </span>
                        </span>
                        <StevenSelect
                          value={channelId}
                          onChange={(e) => setChannelId(e.target.value)}
                          disabled={voiceLoading || voiceChannels.length === 0}
                          required
                          aria-required
                          className="border-rose-500/25 focus:border-rose-500/40"
                        >
                          {voiceLoading ? (
                            <option value="">{t("discordBotLoading")}</option>
                          ) : voiceChannels.length === 0 ? (
                            <option value="">{t("discordBotNoVoiceChannels")}</option>
                          ) : (
                            voiceChannels.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))
                          )}
                        </StevenSelect>
                        <p className="mt-2 text-xs text-zinc-500">{t("discordBotMusicVoiceRequiredHint")}</p>
                      </label>

                      {textError ? (
                        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          {textError}
                        </p>
                      ) : (
                        <DiscordBotNotifyChannelSelect
                          t={t}
                          textLoading={textLoading}
                          textChannels={textChannels}
                          value={notifyChannelId}
                          onChange={setNotifyChannelId}
                          lead={t("discordBotMusicNotifyChannelProminent")}
                          persistHint
                        />
                      )}

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                          {t("discordBotQueryPlaceholder")}
                        </span>
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={t("discordBotQueryPlaceholder")}
                          className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={pending || !channelId || !query.trim() || voiceChannels.length === 0}
                          onClick={() =>
                            void postControl(
                              "/api/discord-bot/play",
                              {
                                guildId,
                                channelId,
                                query: query.trim(),
                                ...(notifyChannelId ? { notifyChannelId } : {}),
                              },
                              "Çal"
                            )
                          }
                          className="rounded-full bg-gradient-to-r from-violet-600 to-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("discordBotPlay")}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void postControl("/api/discord-bot/skip", { guildId }, "Atla")}
                          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                        >
                          {t("discordBotSkip")}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => void postControl("/api/discord-bot/stop", { guildId }, "Durdur")}
                          className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-40"
                        >
                          {t("discordBotStop")}
                        </button>
                      </div>

                      {actionMsg ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300"
                        >
                          {actionMsg}
                        </motion.p>
                      ) : null}

                      <div className="border-t border-white/10 pt-6">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Link2 className="h-4 w-4 text-violet-400" aria-hidden />
                          {t("discordListenTogetherShareTitle")}
                        </h3>
                        <p className="mt-2 text-xs text-zinc-500">{t("discordListenTogetherShareLead")}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input
                            value={ltShareCode}
                            onChange={(e) => setLtShareCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder={t("discordListenTogetherSharePlaceholder")}
                            maxLength={6}
                            className="min-w-[8rem] flex-1 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-center font-mono text-sm text-zinc-100 outline-none focus:border-violet-500/50"
                          />
                          <button
                            type="button"
                            disabled={ltShareCode.trim().length !== 6}
                            onClick={() => copyListenTogetherUrl()}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                          >
                            <Copy className="h-4 w-4" aria-hidden />
                            {ltCopied ? t("discordListenTogetherUrlCopied") : t("discordListenTogetherCopyUrl")}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-6">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Inbox className="h-4 w-4 text-sky-400" aria-hidden />
                          {t("discordSongRequestTitle")}
                        </h3>
                        <p className="mt-2 text-xs text-zinc-500">{t("discordSongRequestLead")}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input
                            value={songReqQuery}
                            onChange={(e) => setSongReqQuery(e.target.value.slice(0, 500))}
                            placeholder={t("discordSongRequestPlaceholder")}
                            className="min-w-[12rem] flex-1 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
                          />
                          <button
                            type="button"
                            disabled={songReqBusy || !songReqQuery.trim()}
                            onClick={() => void submitSongRequest()}
                            className="rounded-full bg-sky-600/90 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
                          >
                            {t("discordSongRequestSubmit")}
                          </button>
                        </div>
                        {Array.isArray(songModQueue) && songModQueue.length > 0 ? (
                          <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
                              {t("discordSongRequestQueueTitle")}
                            </p>
                            <ul className="mt-3 space-y-3">
                              {songModQueue.map((row) => (
                                <li
                                  key={row.id}
                                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-white">{row.query}</p>
                                    {row.requesterDiscordUsername ? (
                                      <p className="text-xs text-zinc-500">@{row.requesterDiscordUsername}</p>
                                    ) : null}
                                  </div>
                                  <div className="flex shrink-0 gap-2">
                                    <button
                                      type="button"
                                      disabled={songReqBusy || !channelId}
                                      onClick={() => void moderateRequest(row.id, "approve")}
                                      className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                    >
                                      {t("discordSongRequestApprove")}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={songReqBusy}
                                      onClick={() => void moderateRequest(row.id, "reject")}
                                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 disabled:opacity-40"
                                    >
                                      {t("discordSongRequestReject")}
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : Array.isArray(songModQueue) && songModQueue.length === 0 ? (
                          <p className="mt-4 text-xs text-zinc-500">{t("discordSongRequestNoPending")}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {section === "features" ? (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t("discordBotPanelFeaturesMatrixTitle")}</h2>
                        <p className="mt-2 text-sm text-zinc-400">{t("discordBotFeaturesIntro")}</p>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                        <table className="w-full min-w-[min(100%,360px)] border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-zinc-500">
                              <th className="min-w-[10rem] px-3 py-2.5 font-medium text-zinc-400">
                                {t("discordBotFeaturesColFeature")}
                              </th>
                              <th className="w-14 px-2 py-2.5 font-medium">{t("discordBotFeaturesColDiscord")}</th>
                              <th className="w-14 px-2 py-2.5 font-medium">{t("discordBotFeaturesColWeb")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {DISCORD_BOT_CAPABILITY_GROUPS.map((group) => (
                              <Fragment key={group.titleKey}>
                                <tr className="bg-violet-500/10">
                                  <td colSpan={3} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-200/90">
                                    {t(group.titleKey)}
                                  </td>
                                </tr>
                                {group.rows.map((row) => (
                                  <tr
                                    key={row.labelKey}
                                    className="border-b border-white/[0.05] hover:bg-white/[0.02]"
                                  >
                                    <td className="px-3 py-2.5 text-zinc-400">{t(row.labelKey)}</td>
                                    <td className="px-2 py-2.5 text-center font-mono text-zinc-300">
                                      {row.discord ? "✓" : "—"}
                                    </td>
                                    <td className="px-2 py-2.5 text-center font-mono text-zinc-300">
                                      {row.web ? "✓" : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {section === "commands" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-zinc-400">{t("discordBotPanelCommandsIntro")}</p>
                      <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1">
                        {DISCORD_BOT_SLASH_COMMANDS.map((c) => (
                          <li
                            key={c.name}
                            className="flex flex-col gap-0.5 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                          >
                            <code className="shrink-0 font-mono text-sm text-violet-300">/{c.name}</code>
                            <span className="text-sm text-zinc-400">{c.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {section === "logs" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-zinc-500">{t("discordBotPanelLogsTitle")}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPanelLogs([]);
                            if (guildId) saveStoredLogs(guildId, []);
                          }}
                          className="text-xs font-medium text-violet-400 hover:text-violet-300"
                        >
                          {t("discordBotPanelLogsClear")}
                        </button>
                      </div>
                      <div className="max-h-[min(55vh,480px)] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 font-mono text-xs">
                        {panelLogs.length === 0 ? (
                          <p className="text-zinc-500">{t("discordBotPanelLogsEmpty")}</p>
                        ) : (
                          <ul className="space-y-2">
                            {panelLogs.map((e) => (
                              <li key={e.id} className="border-b border-white/[0.04] pb-2 text-zinc-400 last:border-0">
                                <span className="text-zinc-600">
                                  {new Date(e.ts).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>{" "}
                                {e.line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {section === "customize" ? (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{t("discordBotCustomizeTitle")}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("discordBotCustomizeIntro")}</p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-5">
                        <h3 className="text-sm font-semibold text-white">{t("discordBotCustomizeGuideTitle")}</h3>
                        <ul className="mt-3 space-y-2.5 text-sm text-zinc-400">
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>
                              {t("discordBotCustomizeGuideVoice")}{" "}
                              <button
                                type="button"
                                onClick={() => setSection("music")}
                                className="font-medium text-violet-400 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300"
                              >
                                {t("discordBotCustomizeGoMusicTab")}
                              </button>
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideNotify")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideStudio")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideRoles")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuidePerms")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideSlash")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideInvite")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideYoutube")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideDave")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuideControlBridge")}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                            <span>{t("discordBotCustomizeGuidePrivacy")}</span>
                          </li>
                        </ul>
                      </div>

                      {textError ? (
                        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          {textError}
                        </p>
                      ) : null}

                      <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-5">
                        <h3 className="text-sm font-semibold text-white">{t("discordBotCustomizeNotifyTitle")}</h3>
                        <div className="mt-4">
                          <DiscordBotNotifyChannelSelect
                            t={t}
                            textLoading={textLoading}
                            textChannels={textChannels}
                            value={notifyChannelId}
                            onChange={setNotifyChannelId}
                            persistHint
                          />
                        </div>
                      </div>

                      <p className="text-sm text-zinc-500">{t("discordBotCustomizeRolesNote")}</p>

                      <details className="group rounded-xl border border-white/[0.08] bg-zinc-950/40 px-4 py-3">
                        <summary className="cursor-pointer list-none text-sm font-medium text-violet-300/90 marker:hidden [&::-webkit-details-marker]:hidden">
                          <span className="inline-flex items-center gap-2">
                            {t("discordBotCustomizeEnvDetailsSummary")}
                            <span className="text-zinc-500 group-open:hidden">▸</span>
                            <span className="hidden text-zinc-500 group-open:inline">▾</span>
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t("discordBotCustomizeBody")}</p>
                      </details>
                    </div>
                  ) : null}

                  {section === "settings" ? (
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold text-white">{t("discordBotPanelSettingsTitle")}</h2>
                      <p className="text-sm leading-relaxed text-zinc-400">{t("discordBotPanelSettingsBody")}</p>
                    </div>
                  ) : null}
                </motion.div>
              </main>
            </div>
          ) : (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
