"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { DiscordVcIntroAdminSection } from "@/components/admin/DiscordVcIntroAdminSection";
import { DiscordBotListeningPresenceSection } from "@/components/admin/DiscordBotListeningPresenceSection";
import { StevenSelect } from "@/components/ui/StevenSelect";

type AdminGuildRow = {
  id: string;
  name: string;
  iconUrl: string | null;
  approximateMemberCount: number | null;
  approximatePresenceCount: number | null;
};

type StatsPayload = {
  ok?: boolean;
  listenMsApprox?: number;
  leaderboard?: {
    userId: string;
    username: string;
    panelActions: number;
    slashCommands: number;
    score: number;
  }[];
};

type StatePayload = {
  ok?: boolean;
  active?: boolean;
  current?: { title?: string; author?: string } | null;
  upcoming?: { title?: string; author?: string }[];
  voiceChannel?: { id: string; name: string } | null;
};

type HistoryPayload = {
  ok?: boolean;
  tracks?: { title: string; requestedBy: { id: string; username: string | null } | null }[];
};

type ServerMetaPayload = {
  guildName: string;
  ownerId: string;
  ownerUsername: string | null;
  ownerGlobalName: string | null;
  approximateMemberCount: number | null;
  approximatePresenceCount: number | null;
  roles: { id: string; name: string; color: number; position: number }[];
  rolesError: number | null;
  textChannels: { id: string; name: string }[];
};

type MemberRow = {
  userId: string;
  username: string;
  displayName: string;
  roleNames: string[];
};

type Tab = "stats" | "playback" | "history" | "server" | "message";

function parseEmbedHexColor(hex: string): number | undefined {
  const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return undefined;
  return Number.parseInt(m[1], 16);
}

function downloadMembersCsv(guildId: string, rows: MemberRow[]) {
  const header = "userId,username,displayName,roles\n";
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = rows.map((m) =>
    [m.userId, m.username, m.displayName, m.roleNames.join("; ")].map(esc).join(",")
  );
  const blob = new Blob(["\ufeff" + header + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `discord-members-${guildId}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type DiscordBotSiteAdminSectionProps = {
  variant?: "embed" | "page"
};

export function DiscordBotSiteAdminSection({ variant = "embed" }: DiscordBotSiteAdminSectionProps) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isSiteAdmin = role === "ADMIN";
  const isPage = variant === "page";

  const [guilds, setGuilds] = useState<AdminGuildRow[] | null>(null);
  const [guildsError, setGuildsError] = useState(false);
  const [guildsErrorCode, setGuildsErrorCode] = useState<string | null>(null);
  const [partialEnrich, setPartialEnrich] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [state, setState] = useState<StatePayload | null>(null);
  const [history, setHistory] = useState<HistoryPayload | null>(null);

  const [intel, setIntel] = useState<{ guildId: string; meta: ServerMetaPayload } | null>(null);
  const [serverBusy, setServerBusy] = useState(false);
  const [serverFetchError, setServerFetchError] = useState(false);
  const [memberRows, setMemberRows] = useState<MemberRow[]>([]);
  const [membersNextAfter, setMembersNextAfter] = useState<string | null>(null);
  const [membersHasMore, setMembersHasMore] = useState(false);
  const [membersForbidden, setMembersForbidden] = useState(false);
  const [membersLoadingMore, setMembersLoadingMore] = useState(false);
  const [messageMetaLoading, setMessageMetaLoading] = useState(false);
  const [msgChannelId, setMsgChannelId] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<"ok" | "err" | null>(null);
  const [memberFilter, setMemberFilter] = useState("");
  const [msgMode, setMsgMode] = useState<"channel" | "dm">("channel");
  const [msgDmUserId, setMsgDmUserId] = useState("");
  const [msgDmLabel, setMsgDmLabel] = useState("");
  const [msgUseEmbed, setMsgUseEmbed] = useState(false);
  const [msgEmbedTitle, setMsgEmbedTitle] = useState("");
  const [msgEmbedDescription, setMsgEmbedDescription] = useState("");
  const [msgEmbedColor, setMsgEmbedColor] = useState("#5865F2");
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestFeedback, setDigestFeedback] = useState<"ok" | "err" | null>(null);
  const [webhookText, setWebhookText] = useState("");
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<"ok" | "err" | null>(null);

  const filteredMemberRows = useMemo(() => {
    const q = memberFilter.trim().toLowerCase();
    if (!q) return memberRows;
    return memberRows.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.userId.includes(q) ||
        m.roleNames.some((r) => r.toLowerCase().includes(q))
    );
  }, [memberRows, memberFilter]);

  const intelRef = useRef(intel);
  intelRef.current = intel;

  useEffect(() => {
    if (!expandedId) {
      setIntel(null);
      return;
    }
    setIntel((prev) => (prev && prev.guildId !== expandedId ? null : prev));
  }, [expandedId]);

  useEffect(() => {
    if (!isSiteAdmin || status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/admin/discord-bot/guilds", { credentials: "include" });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) {
            setGuildsError(true);
            setGuildsErrorCode(typeof j?.error === "string" ? j.error : null);
            setGuilds([]);
          }
          return;
        }
        const j = (await r.json()) as {
          guilds?: AdminGuildRow[];
          partialEnrichment?: boolean;
        };
        if (cancelled) return;
        setGuilds(j.guilds ?? []);
        setPartialEnrich(!!j.partialEnrichment);
        setGuildsError(false);
        setGuildsErrorCode(null);
      } catch {
        if (!cancelled) {
          setGuildsError(true);
          setGuildsErrorCode(null);
          setGuilds([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSiteAdmin, status]);

  const loadDetail = useCallback(async (guildId: string) => {
    setDetailLoading(true);
    setDetailError(false);
    setStats(null);
    setState(null);
    setHistory(null);
    try {
      const base = { credentials: "include" as const, headers: { "Content-Type": "application/json" } };
      const [sr, st, hr] = await Promise.all([
        fetch("/api/admin/discord-bot/proxy", {
          ...base,
          method: "POST",
          body: JSON.stringify({ action: "stats", guildId }),
        }),
        fetch("/api/admin/discord-bot/proxy", {
          ...base,
          method: "POST",
          body: JSON.stringify({ action: "state", guildId }),
        }),
        fetch("/api/admin/discord-bot/proxy", {
          ...base,
          method: "POST",
          body: JSON.stringify({ action: "history", guildId }),
        }),
      ]);
      if (!sr.ok || !st.ok) {
        setDetailError(true);
        return;
      }
      setStats((await sr.json()) as StatsPayload);
      setState((await st.json()) as StatePayload);
      if (hr.ok) {
        setHistory((await hr.json()) as HistoryPayload);
      } else {
        setHistory({ ok: true, tracks: [] });
      }
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "server" || !expandedId) return;
    let cancelled = false;
    setServerBusy(true);
    setServerFetchError(false);
    setMembersForbidden(false);
    setMemberRows([]);
    setMembersNextAfter(null);
    setMembersHasMore(false);
    void (async () => {
      try {
        const mr = await fetch(`/api/admin/discord-bot/guilds/${expandedId}/meta`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (!mr.ok) {
          setServerFetchError(true);
          return;
        }
        const meta = (await mr.json()) as ServerMetaPayload;
        setIntel({ guildId: expandedId, meta });
        const lr = await fetch(`/api/admin/discord-bot/guilds/${expandedId}/members?limit=100`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (lr.status === 403) {
          setMembersForbidden(true);
          return;
        }
        if (!lr.ok) return;
        const mj = (await lr.json()) as {
          members: MemberRow[];
          nextAfter: string | null;
          hasMore: boolean;
        };
        setMemberRows(mj.members ?? []);
        setMembersNextAfter(mj.nextAfter ?? null);
        setMembersHasMore(!!mj.hasMore);
      } finally {
        if (!cancelled) setServerBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, expandedId]);

  useEffect(() => {
    if (tab !== "message" || !expandedId) return;
    if (intelRef.current?.guildId === expandedId) {
      setMessageMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMessageMetaLoading(true);
    void (async () => {
      try {
        const mr = await fetch(`/api/admin/discord-bot/guilds/${expandedId}/meta`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (mr.ok) {
          const meta = (await mr.json()) as ServerMetaPayload;
          setIntel({ guildId: expandedId, meta });
        }
      } finally {
        if (!cancelled) setMessageMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, expandedId]);

  const loadMoreMembers = useCallback(async () => {
    if (!expandedId || !membersNextAfter || membersLoadingMore) return;
    setMembersLoadingMore(true);
    try {
      const r = await fetch(
        `/api/admin/discord-bot/guilds/${expandedId}/members?limit=100&after=${encodeURIComponent(membersNextAfter)}`,
        { credentials: "include" }
      );
      if (!r.ok) return;
      const j = (await r.json()) as {
        members: MemberRow[];
        nextAfter: string | null;
        hasMore: boolean;
      };
      setMemberRows((prev) => [...prev, ...(j.members ?? [])]);
      setMembersNextAfter(j.nextAfter ?? null);
      setMembersHasMore(!!j.hasMore);
    } finally {
      setMembersLoadingMore(false);
    }
  }, [expandedId, membersNextAfter, membersLoadingMore]);

  const openMemberMessageAction = useCallback(
    (m: MemberRow, kind: "ad" | "announce" | "dm") => {
      setTab("message");
      setMsgFeedback(null);
      const mention = `<@${m.userId}>`;
      if (kind === "dm") {
        setMsgMode("dm");
        setMsgDmUserId(m.userId);
        setMsgDmLabel(`${m.displayName} (@${m.username})`);
        setMsgChannelId("");
        setMsgUseEmbed(false);
        setMsgEmbedTitle("");
        setMsgEmbedDescription("");
        setMsgEmbedColor("#5865F2");
        setMsgContent(
          t("discordBotSiteAdminDmPrefill")
            .replace("{{name}}", m.displayName)
            .replace("{{username}}", m.username)
        );
        return;
      }
      setMsgMode("channel");
      setMsgDmUserId("");
      setMsgDmLabel("");
      if (kind === "ad") {
        setMsgUseEmbed(true);
        setMsgEmbedTitle(t("discordBotSiteAdminAdEmbedTitle"));
        setMsgEmbedDescription(
          t("discordBotSiteAdminAdEmbedBody")
            .replace("{{mention}}", mention)
            .replace("{{name}}", m.displayName)
        );
        setMsgContent("");
        setMsgEmbedColor("#f59e0b");
      } else {
        setMsgUseEmbed(false);
        setMsgEmbedTitle("");
        setMsgEmbedDescription("");
        setMsgEmbedColor("#5865F2");
        setMsgContent(t("discordBotSiteAdminAnnouncePrefill").replace("{{mention}}", mention));
      }
    },
    [t]
  );

  const sendDiscordMessage = useCallback(async () => {
    if (!expandedId || msgSending) return;
    const contentTrim = msgContent.trim().slice(0, 2000);
    const embedParts: { title?: string; description?: string; color?: number } = {};
    if (msgUseEmbed) {
      const et = msgEmbedTitle.trim();
      const ed = msgEmbedDescription.trim();
      if (et) embedParts.title = et.slice(0, 256);
      if (ed) embedParts.description = ed.slice(0, 4096);
      const c = parseEmbedHexColor(msgEmbedColor);
      if (c != null) embedParts.color = c;
    }
    const hasEmbedBody = !!(embedParts.title || embedParts.description);
    const embeds = hasEmbedBody ? [embedParts] : undefined;
    const hasPayload = contentTrim.length > 0 || !!embeds?.length;
    if (!hasPayload) return;
    if (msgMode === "dm") {
      if (!msgDmUserId.trim()) return;
    } else if (!msgChannelId.trim()) {
      return;
    }
    setMsgSending(true);
    setMsgFeedback(null);
    try {
      const url =
        msgMode === "dm"
          ? `/api/admin/discord-bot/guilds/${expandedId}/dm`
          : `/api/admin/discord-bot/guilds/${expandedId}/message`;
      const body: Record<string, unknown> =
        msgMode === "dm"
          ? { userId: msgDmUserId.trim() }
          : { channelId: msgChannelId.trim() };
      if (contentTrim) body.content = contentTrim;
      if (embeds?.length) body.embeds = embeds;
      const r = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMsgFeedback(r.ok ? "ok" : "err");
      if (r.ok) {
        setMsgContent("");
        if (msgUseEmbed && hasEmbedBody) {
          setMsgEmbedTitle("");
          setMsgEmbedDescription("");
        }
      }
    } catch {
      setMsgFeedback("err");
    } finally {
      setMsgSending(false);
    }
  }, [
    expandedId,
    msgChannelId,
    msgContent,
    msgDmUserId,
    msgEmbedColor,
    msgEmbedDescription,
    msgEmbedTitle,
    msgMode,
    msgSending,
    msgUseEmbed,
  ]);

  const sendWeekDigest = useCallback(
    async (guildId: string) => {
      const ch = msgChannelId.trim();
      if (!ch) return;
      setDigestBusy(true);
      setDigestFeedback(null);
      try {
        const r = await fetch(`/api/admin/discord-bot/guilds/${guildId}/week-digest`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: ch }),
        });
        setDigestFeedback(r.ok ? "ok" : "err");
      } catch {
        setDigestFeedback("err");
      } finally {
        setDigestBusy(false);
      }
    },
    [msgChannelId]
  );

  const sendMaintenanceWebhooks = useCallback(async () => {
    const c = webhookText.trim();
    if (!c) return;
    setWebhookBusy(true);
    setWebhookFeedback(null);
    try {
      const r = await fetch("/api/admin/discord-maintenance-webhook", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: c }),
      });
      setWebhookFeedback(r.ok ? "ok" : "err");
      if (r.ok) setWebhookText("");
    } catch {
      setWebhookFeedback("err");
    } finally {
      setWebhookBusy(false);
    }
  }, [webhookText]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setTab("stats");
    setIntel(null);
    setMemberRows([]);
    setMembersNextAfter(null);
    setMembersHasMore(false);
    setMembersForbidden(false);
    setServerFetchError(false);
    setMsgChannelId("");
    setMsgContent("");
    setMsgFeedback(null);
    setMemberFilter("");
    setMsgMode("channel");
    setMsgDmUserId("");
    setMsgDmLabel("");
    setMsgUseEmbed(false);
    setMsgEmbedTitle("");
    setMsgEmbedDescription("");
    setMsgEmbedColor("#5865F2");
    void loadDetail(id);
  };

  if (variant === "embed") {
    if (status === "loading" || !isSiteAdmin) return null;
  } else {
    if (status === "loading") {
      return (
        <div className="mx-auto flex max-w-6xl justify-center px-4 py-16 sm:px-6">
          <p className="text-sm text-zinc-500">{t("discordBotSiteAdminLoadingGuilds")}</p>
        </div>
      );
    }
    if (status === "unauthenticated") {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-zinc-300">{t("discordBotSiteAdminUnauthorized")}</p>
          <Link
            href="/login?callbackUrl=/discord-bot/admin"
            className="mt-5 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            {t("discordBotSiteAdminLoginCta")}
          </Link>
          <p className="mt-6">
            <Link href="/discord-bot" className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
              {t("discordBotAdminPageBack")}
            </Link>
          </p>
        </div>
      );
    }
    if (!isSiteAdmin) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-zinc-300">{t("discordBotSiteAdminForbidden")}</p>
          <p className="mt-6">
            <Link href="/discord-bot" className="text-sm text-violet-300 underline-offset-4 hover:underline">
              {t("discordBotAdminPageBack")}
            </Link>
          </p>
        </div>
      );
    }
  }

  return (
    <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", isPage ? "pb-16 pt-4" : "pb-6 pt-4")}>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-zinc-900/40 to-zinc-950/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06] backdrop-blur-xl sm:p-6"
      >
        <div className="flex flex-wrap items-start gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-white sm:text-xl">{t("discordBotSiteAdminTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{t("discordBotSiteAdminLead")}</p>
            <p className="mt-2 text-xs text-zinc-600">{t("discordBotSiteAdminRoadmapNote")}</p>
          </div>
        </div>

        {isPage ? (
          <div className="mt-5 space-y-5 border-b border-white/10 pb-5">
            <DiscordBotListeningPresenceSection className="border-amber-500/20 bg-black/20" />
            <DiscordVcIntroAdminSection className="border-amber-500/20 bg-black/20" />
          </div>
        ) : null}

        {guilds === null ? (
          <p className="mt-5 text-sm text-zinc-500">{t("discordBotSiteAdminLoadingGuilds")}</p>
        ) : guildsError ? (
          <p className="mt-5 text-sm text-red-300/90">
            {guildsErrorCode === "bot_unreachable"
              ? t("discordBotSiteAdminLoadErrorBot")
              : guildsErrorCode === "bot_token_missing"
                ? t("discordBotSiteAdminLoadErrorToken")
                : guildsErrorCode === "discord_api_bot_guilds"
                  ? t("discordBotSiteAdminLoadErrorDiscord")
                  : t("discordBotSiteAdminLoadError")}
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm font-medium text-zinc-300">
              {t("discordBotSiteAdminGuildCount").replace("{{count}}", String(guilds.length))}
            </p>
            {partialEnrich ? (
              <p className="mt-2 text-xs text-amber-200/80">{t("discordBotSiteAdminPartialEnrich")}</p>
            ) : null}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-zinc-200">{t("discordBotSiteAdminWebhookTitle")}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{t("discordBotSiteAdminWebhookHint")}</p>
              <textarea
                value={webhookText}
                onChange={(e) => {
                  setWebhookText(e.target.value.slice(0, 2000));
                  setWebhookFeedback(null);
                }}
                rows={3}
                placeholder={t("discordBotSiteAdminWebhookPlaceholder")}
                className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              />
              <button
                type="button"
                disabled={webhookBusy || !webhookText.trim()}
                onClick={() => void sendMaintenanceWebhooks()}
                className="mt-2 rounded-lg bg-zinc-700 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-600 disabled:opacity-50"
              >
                {webhookBusy ? "…" : t("discordBotSiteAdminWebhookSend")}
              </button>
              {webhookFeedback === "ok" ? (
                <p className="mt-2 text-xs text-emerald-400">{t("discordBotSiteAdminWebhookDone")}</p>
              ) : null}
              {webhookFeedback === "err" ? (
                <p className="mt-2 text-xs text-red-300/90">{t("discordBotSiteAdminMessageError")}</p>
              ) : null}
            </div>
            <ul className="mt-4 space-y-2">
              {guilds.map((g) => {
                const open = expandedId === g.id;
                return (
                  <li
                    key={g.id}
                    className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/25 ring-1 ring-white/[0.04]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(g.id)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[0.04] sm:px-4"
                    >
                      {g.iconUrl ? (
                        <Image src={g.iconUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-medium text-zinc-400">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-100">{g.name}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-zinc-500">
                          {g.approximateMemberCount != null ? (
                            <span>
                              {t("discordBotSiteAdminMembersApprox").replace(
                                "{{count}}",
                                String(g.approximateMemberCount)
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                          {g.approximatePresenceCount != null ? (
                            <span>
                              {t("discordBotSiteAdminOnlineApprox").replace(
                                "{{count}}",
                                String(g.approximatePresenceCount)
                              )}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-violet-300/90">
                        {open ? t("discordBotSiteAdminCloseDetail") : t("discordBotSiteAdminOpenDetail")}
                        {open ? (
                          <ChevronUp className="h-4 w-4" aria-hidden />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                    </button>
                    {open ? (
                      <div className="border-t border-white/[0.06] bg-black/20 px-3 py-4 sm:px-4">
                        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                          {(
                            [
                              ["stats", t("discordBotSiteAdminTabStats")],
                              ["playback", t("discordBotSiteAdminTabPlayback")],
                              ["history", t("discordBotSiteAdminTabHistory")],
                              ["server", t("discordBotSiteAdminTabServer")],
                              ["message", t("discordBotSiteAdminTabMessage")],
                            ] as const
                          ).map(([k, label]) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setTab(k)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                tab === k
                                  ? "bg-violet-600 text-white"
                                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {tab === "server" ? (
                          serverBusy ? (
                            <p className="pt-4 text-sm text-zinc-500">{t("discordBotSiteAdminLoadingServer")}</p>
                          ) : serverFetchError || !intel || intel.guildId !== g.id ? (
                            <p className="pt-4 text-sm text-red-300/90">{t("discordBotSiteAdminServerLoadError")}</p>
                          ) : (
                            <div className="pt-4 text-sm text-zinc-300">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
                                  {t("discordBotSiteAdminOwner")}
                                </p>
                                <p className="mt-1 text-zinc-100">
                                  {intel.meta.ownerGlobalName || intel.meta.ownerUsername || "—"}{" "}
                                  <span className="text-zinc-500">(@{intel.meta.ownerUsername ?? intel.meta.ownerId})</span>
                                </p>
                                <p className="mt-0.5 font-mono text-[11px] text-zinc-600">ID: {intel.meta.ownerId}</p>
                              </div>
                              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-300/90">
                                {t("discordBotSiteAdminRoles")} ({intel.meta.roles.length})
                              </h3>
                              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-zinc-400">
                                {intel.meta.roles.map((r) => (
                                  <li key={r.id} className="truncate rounded bg-white/[0.04] px-2 py-1">
                                    {r.name}
                                  </li>
                                ))}
                              </ul>
                              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-300/90">
                                {t("discordBotSiteAdminMembersList")}
                              </h3>
                              {membersForbidden ? (
                                <p className="mt-2 text-xs text-amber-200/90">{t("discordBotSiteAdminMembersIntentHint")}</p>
                              ) : (
                                <>
                                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                    <input
                                      type="search"
                                      value={memberFilter}
                                      onChange={(e) => setMemberFilter(e.target.value)}
                                      placeholder={t("discordBotSiteAdminMemberFilter")}
                                      className="w-full min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-zinc-600 sm:max-w-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => expandedId && downloadMembersCsv(expandedId, memberRows)}
                                      disabled={memberRows.length === 0}
                                      className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                                    >
                                      {t("discordBotSiteAdminExportCsv")}
                                    </button>
                                  </div>
                                  {membersHasMore ? (
                                    <p className="mt-1 text-[10px] text-zinc-500">{t("discordBotSiteAdminExportCsvHint")}</p>
                                  ) : null}
                                  {memberFilter.trim() && filteredMemberRows.length === 0 ? (
                                    <p className="mt-2 text-xs text-zinc-500">{t("discordBotSiteAdminMemberFilterEmpty")}</p>
                                  ) : null}
                                  <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-white/[0.06]">
                                    <table className="w-full min-w-[320px] text-left text-[11px]">
                                      <thead className="sticky top-0 bg-zinc-950/95 text-zinc-500">
                                        <tr>
                                          <th className="px-2 py-1.5 font-medium">{t("discordBotSiteAdminMemberUser")}</th>
                                          <th className="px-2 py-1.5 font-medium">{t("discordBotSiteAdminMemberRoles")}</th>
                                          <th className="w-[1%] whitespace-nowrap px-1 py-1.5 text-right font-medium">
                                            {t("discordBotSiteAdminMemberActions")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {filteredMemberRows.map((m) => (
                                          <tr key={m.userId} className="border-t border-white/[0.05]">
                                            <td className="px-2 py-1.5 align-top text-zinc-200">
                                              <span className="block font-medium">{m.displayName}</span>
                                              <span className="font-mono text-[10px] text-zinc-600">{m.userId}</span>
                                              <span className="block text-zinc-600">@{m.username}</span>
                                            </td>
                                            <td className="px-2 py-1.5 align-top text-zinc-500">
                                              {m.roleNames.length ? m.roleNames.join(", ") : "—"}
                                            </td>
                                            <td className="px-1 py-1.5 align-top text-right">
                                              <div className="flex flex-col items-end gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => openMemberMessageAction(m, "ad")}
                                                  className="w-full min-w-[5.5rem] rounded-md bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-100 ring-1 ring-amber-500/30 hover:bg-amber-500/30 sm:w-auto"
                                                >
                                                  {t("discordBotSiteAdminMemberAd")}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => openMemberMessageAction(m, "announce")}
                                                  className="w-full min-w-[5.5rem] rounded-md bg-violet-500/20 px-2 py-1 text-[10px] font-medium text-violet-100 ring-1 ring-violet-500/30 hover:bg-violet-500/30 sm:w-auto"
                                                >
                                                  {t("discordBotSiteAdminMemberAnnounce")}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => openMemberMessageAction(m, "dm")}
                                                  className="w-full min-w-[5.5rem] rounded-md bg-sky-500/20 px-2 py-1 text-[10px] font-medium text-sky-100 ring-1 ring-sky-500/30 hover:bg-sky-500/30 sm:w-auto"
                                                >
                                                  {t("discordBotSiteAdminMemberDm")}
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  {membersHasMore && membersNextAfter ? (
                                    <button
                                      type="button"
                                      onClick={() => void loadMoreMembers()}
                                      disabled={membersLoadingMore}
                                      className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                                    >
                                      {membersLoadingMore ? "…" : t("discordBotSiteAdminLoadMoreMembers")}
                                    </button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          )
                        ) : tab === "message" ? (
                          messageMetaLoading ? (
                            <p className="pt-4 text-sm text-zinc-500">{t("discordBotSiteAdminLoadingServer")}</p>
                          ) : !intel || intel.guildId !== g.id ? (
                            <p className="pt-4 text-sm text-red-300/90">{t("discordBotSiteAdminServerLoadError")}</p>
                          ) : intel.meta.textChannels.length === 0 ? (
                            <p className="pt-4 text-sm text-zinc-500">{t("discordBotSiteAdminNoTextChannels")}</p>
                          ) : (
                            <div className="pt-4 space-y-3 text-sm text-zinc-300">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMsgMode("channel");
                                    setMsgFeedback(null);
                                  }}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                    msgMode === "channel"
                                      ? "bg-violet-600 text-white"
                                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                  )}
                                >
                                  {t("discordBotSiteAdminMsgModeChannel")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMsgMode("dm");
                                    setMsgFeedback(null);
                                  }}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                    msgMode === "dm"
                                      ? "bg-violet-600 text-white"
                                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                  )}
                                >
                                  {t("discordBotSiteAdminMsgModeDm")}
                                </button>
                              </div>
                              {msgMode === "dm" ? (
                                msgDmUserId ? (
                                  <p className="text-xs text-zinc-400">
                                    <span className="text-zinc-500">{t("discordBotSiteAdminDmRecipient")}: </span>
                                    {msgDmLabel || msgDmUserId}
                                  </p>
                                ) : (
                                  <p className="text-xs text-amber-200/90">{t("discordBotSiteAdminDmPickHint")}</p>
                                )
                              ) : (
                                <label className="block text-xs text-zinc-500">
                                  {t("discordBotSiteAdminMessageChannel")}
                                  <StevenSelect
                                    value={msgChannelId}
                                    onChange={(e) => {
                                      setMsgChannelId(e.target.value);
                                      setMsgFeedback(null);
                                    }}
                                    className="mt-1"
                                  >
                                    <option value="">—</option>
                                    {intel.meta.textChannels.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        #{c.name}
                                      </option>
                                    ))}
                                  </StevenSelect>
                                </label>
                              )}
                              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                                <input
                                  type="checkbox"
                                  checked={msgUseEmbed}
                                  onChange={(e) => {
                                    setMsgUseEmbed(e.target.checked);
                                    setMsgFeedback(null);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                                />
                                {t("discordBotSiteAdminUseEmbed")}
                              </label>
                              {msgUseEmbed ? (
                                <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                  <label className="block text-xs text-zinc-500">
                                    {t("discordBotSiteAdminEmbedTitle")}
                                    <input
                                      type="text"
                                      value={msgEmbedTitle}
                                      onChange={(e) => {
                                        setMsgEmbedTitle(e.target.value.slice(0, 256));
                                        setMsgFeedback(null);
                                      }}
                                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                                    />
                                  </label>
                                  <label className="block text-xs text-zinc-500">
                                    {t("discordBotSiteAdminEmbedDescription")}
                                    <textarea
                                      value={msgEmbedDescription}
                                      onChange={(e) => {
                                        setMsgEmbedDescription(e.target.value.slice(0, 4096));
                                        setMsgFeedback(null);
                                      }}
                                      rows={4}
                                      className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                                    />
                                  </label>
                                  <label className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                    {t("discordBotSiteAdminEmbedColor")}
                                    <input
                                      type="color"
                                      value={msgEmbedColor.match(/^#?[0-9a-fA-F]{6}$/) ? (msgEmbedColor.startsWith("#") ? msgEmbedColor : `#${msgEmbedColor}`) : "#5865F2"}
                                      onChange={(e) => {
                                        setMsgEmbedColor(e.target.value);
                                        setMsgFeedback(null);
                                      }}
                                      className="h-8 w-14 cursor-pointer rounded border border-white/15 bg-transparent"
                                    />
                                  </label>
                                </div>
                              ) : null}
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                                  {t("discordBotSiteAdminPreview")}
                                </p>
                                <div
                                  className="mt-1 rounded-r-lg border-l-4 border-[#5865F2] bg-[#2b2d31] p-3 text-xs shadow-inner"
                                  style={{
                                    borderLeftColor:
                                      parseEmbedHexColor(msgEmbedColor) != null
                                        ? (msgEmbedColor.startsWith("#") ? msgEmbedColor : `#${msgEmbedColor}`)
                                        : "#5865F2",
                                  }}
                                >
                                  {msgUseEmbed && (msgEmbedTitle.trim() || msgEmbedDescription.trim()) ? (
                                    <>
                                      {msgEmbedTitle.trim() ? (
                                        <p className="font-semibold text-white">{msgEmbedTitle.trim()}</p>
                                      ) : null}
                                      {msgEmbedDescription.trim() ? (
                                        <p className="mt-1 whitespace-pre-wrap text-zinc-300">{msgEmbedDescription.trim()}</p>
                                      ) : null}
                                    </>
                                  ) : (
                                    <p className="text-zinc-600">{t("discordBotSiteAdminPreviewEmpty")}</p>
                                  )}
                                </div>
                                {msgContent.trim() ? (
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{msgContent.trim()}</p>
                                ) : null}
                              </div>
                              <label className="block text-xs text-zinc-500">
                                {t("discordBotSiteAdminMessageBody")}
                                <textarea
                                  value={msgContent}
                                  onChange={(e) => {
                                    setMsgContent(e.target.value.slice(0, 2000));
                                    setMsgFeedback(null);
                                  }}
                                  rows={5}
                                  placeholder={t("discordBotSiteAdminMessagePlaceholder")}
                                  className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => void sendDiscordMessage()}
                                disabled={
                                  msgSending ||
                                  !(msgContent.trim() ||
                                    (msgUseEmbed &&
                                      (msgEmbedTitle.trim() || msgEmbedDescription.trim()))) ||
                                  (msgMode === "dm" ? !msgDmUserId.trim() : !msgChannelId.trim())
                                }
                                className="rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752c4] disabled:opacity-50"
                              >
                                {msgSending ? t("discordBotSiteAdminMessageSending") : t("discordBotSiteAdminMessageSend")}
                              </button>
                              {msgFeedback === "ok" ? (
                                <p className="text-xs text-emerald-400">{t("discordBotSiteAdminMessageSent")}</p>
                              ) : null}
                              {msgFeedback === "err" ? (
                                <p className="text-xs text-red-300/90">
                                  {msgMode === "dm"
                                    ? t("discordBotSiteAdminDmError")
                                    : t("discordBotSiteAdminMessageError")}
                                </p>
                              ) : null}
                            </div>
                          )
                        ) : detailLoading ? (
                          <p className="pt-4 text-sm text-zinc-500">{t("discordBotSiteAdminLoadingGuilds")}</p>
                        ) : detailError ? (
                          <p className="pt-4 text-sm text-red-300/90">{t("discordBotSiteAdminDetailLoadError")}</p>
                        ) : tab === "stats" ? (
                          <div className="pt-4 text-sm text-zinc-300">
                            <p className="text-xs text-zinc-500">
                              {t("discordBotSiteAdminListenApprox")}:{" "}
                              <span className="text-zinc-200">
                                {Math.round((stats?.listenMsApprox ?? 0) / 60000)} dk
                              </span>
                            </p>
                            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-300/90">
                              {t("discordBotSiteAdminLeaderboard")}
                            </h3>
                            {!stats?.leaderboard?.length ? (
                              <p className="mt-2 text-zinc-500">{t("discordBotSiteAdminNoStats")}</p>
                            ) : (
                              <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs">
                                {stats.leaderboard.map((row, i) => (
                                  <li
                                    key={row.userId}
                                    className="flex justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5"
                                  >
                                    <span className="truncate text-zinc-200">
                                      {i + 1}. {row.username}
                                    </span>
                                    <span className="shrink-0 text-zinc-500">
                                      P{row.panelActions} / S{row.slashCommands}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                              <p className="text-xs font-semibold text-violet-200/90">{t("discordBotSiteAdminWeekDigest")}</p>
                              <p className="text-[11px] text-zinc-500">{t("discordBotSiteAdminWeekDigestHint")}</p>
                              <button
                                type="button"
                                disabled={digestBusy || !msgChannelId.trim()}
                                onClick={() => void sendWeekDigest(g.id)}
                                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                              >
                                {digestBusy ? "…" : t("discordBotSiteAdminWeekDigestSend")}
                              </button>
                              {digestFeedback === "ok" ? (
                                <p className="text-xs text-emerald-400">{t("discordBotSiteAdminWeekDigestDone")}</p>
                              ) : null}
                              {digestFeedback === "err" ? (
                                <p className="text-xs text-red-300/90">{t("discordBotSiteAdminDetailLoadError")}</p>
                              ) : null}
                            </div>
                          </div>
                        ) : tab === "playback" ? (
                          <div className="pt-4 text-sm text-zinc-300">
                            {state?.voiceChannel ? (
                              <p className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100/90">
                                {t("discordBotSiteAdminVoiceChannel").replace("{{name}}", state.voiceChannel.name)}
                              </p>
                            ) : null}
                            {!state?.active || !state.current ? (
                              <p className="text-zinc-500">{t("discordBotSiteAdminInactive")}</p>
                            ) : (
                              <div>
                                <p className="font-medium text-white">{state.current.title}</p>
                                {state.current.author ? (
                                  <p className="text-xs text-zinc-500">{state.current.author}</p>
                                ) : null}
                              </div>
                            )}
                            {state?.upcoming && state.upcoming.length > 0 ? (
                              <div className="mt-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">
                                  {t("discordBotSiteAdminUpcoming")}
                                </h3>
                                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-zinc-400">
                                  {state.upcoming.slice(0, 8).map((tr, i) => (
                                    <li key={i}>
                                      {tr.title}
                                      {tr.author ? ` — ${tr.author}` : ""}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="pt-4 text-sm text-zinc-300">
                            {!history?.tracks?.length ? (
                              <p className="text-zinc-500">{t("discordBotSiteAdminHistoryEmpty")}</p>
                            ) : (
                              <ul className="max-h-52 space-y-2 overflow-y-auto text-xs">
                                {history.tracks.map((tr, i) => (
                                  <li key={i} className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                                    <p className="text-zinc-200">{tr.title}</p>
                                    {tr.requestedBy ? (
                                      <p className="mt-0.5 text-zinc-500">
                                        {t("discordBotSiteAdminRequestedBy")}:{" "}
                                        <span className="text-zinc-400">
                                          {tr.requestedBy.username || tr.requestedBy.id}
                                        </span>
                                      </p>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </motion.section>
    </div>
  );
}
