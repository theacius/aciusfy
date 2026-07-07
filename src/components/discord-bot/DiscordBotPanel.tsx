"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import {
  DiscordBotFeaturesBlock,
  DiscordBotHeroBlock,
  DiscordBotHowBlock,
} from "@/components/discord-bot/DiscordBotLandingSections";
import { DiscordAccountLinkAnimation } from "@/components/discord-bot/DiscordAccountLinkAnimation";
import { DiscordGlyph } from "@/components/discord-bot/DiscordGlyph";
import { DiscordBotAmbientLayer } from "@/components/discord-bot/DiscordBotMotionDecor";
import { getDiscordBotInviteHref } from "@/lib/discord-bot-invite";
type SessionUser = { id: string; username: string; avatarUrl: string | null };
type GuildRow = { id: string; name: string; iconUrl: string | null };
type GuildsPanelMeta = {
  memberGuildCount: number;
  manageableGuildCount: number;
  bridgeGuildCount?: number;
  listedGuildCount: number;
};
const PANEL_ANCHOR_ID = "discord-bot-panel";

export function DiscordBotPanel() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const profile = useUserProfile();
  const isSiteAdmin =
    profile?.role === "ADMIN" ||
    (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const inviteHref = getDiscordBotInviteHref();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const oauthSuccessPendingRef = useRef(false);
  const [oauthAnimOpen, setOauthAnimOpen] = useState(false);
  const [oauthAnimMode, setOauthAnimMode] = useState<"redirect" | "success" | "disconnect">("redirect");

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [guilds, setGuilds] = useState<GuildRow[] | null>(null);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [guildsPanelMeta, setGuildsPanelMeta] = useState<GuildsPanelMeta | null>(null);
  const [guildsListFetchFailed, setGuildsListFetchFailed] = useState<"rate_limited" | "api_error" | null>(
    null
  );

  const scrollToPanel = useCallback(() => {
    document.getElementById(PANEL_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const refreshSession = useCallback(async () => {
    const r = await fetch("/api/discord-bot/session", { credentials: "include" });
    const j = (await r.json()) as { user: SessionUser | null };
    setUser(j.user ?? null);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      oauthSuccessPendingRef.current = true;
      setOauthAnimMode("success");
      setOauthAnimOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!oauthAnimOpen || oauthAnimMode !== "success") return;
    const id = window.setTimeout(() => {
      router.replace("/discord-bot");
      setOauthAnimOpen(false);
    }, 3100);
    return () => window.clearTimeout(id);
  }, [oauthAnimOpen, oauthAnimMode, router]);

  const onOAuthOverlayExit = useCallback(() => {
    if (oauthSuccessPendingRef.current) {
      oauthSuccessPendingRef.current = false;
      void refreshSession();
    }
  }, [refreshSession]);

  const startDiscordOAuth = useCallback(() => {
    setOauthAnimMode("redirect");
    setOauthAnimOpen(true);
    window.setTimeout(() => {
      window.location.assign("/api/discord-bot/oauth/authorize");
    }, 900);
  }, []);

  const loadGuilds = useCallback(async () => {
    setGuildsLoading(true);
    setGuilds(null);
    setGuildsPanelMeta(null);
    setGuildsListFetchFailed(null);
    try {
      const r = await fetch("/api/discord-bot/guilds", { credentials: "include" });
      if (r.status === 401) {
        setUser(null);
        setGuilds([]);
        return;
      }
      if (!r.ok) {
        try {
          const j = (await r.json()) as { error?: string; status?: number };
          if (j.error === "discord_api_guilds") {
            const st = j.status ?? r.status;
            setGuildsListFetchFailed(st === 429 ? "rate_limited" : "api_error");
          }
        } catch {}
        setGuilds([]);
        return;
      }
      const j = (await r.json()) as { guilds?: GuildRow[]; panelMeta?: GuildsPanelMeta };
      setGuilds(j.guilds ?? []);
      setGuildsPanelMeta(j.panelMeta ?? null);
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

  async function logout() {
    setOauthAnimMode("disconnect");
    setOauthAnimOpen(true);
    const started = Date.now();
    try {
      await fetch("/api/discord-bot/oauth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    setGuilds(null);
    const elapsed = Date.now() - started;
    window.setTimeout(() => setOauthAnimOpen(false), Math.max(0, 1350 - elapsed));
  }

  const errorBanner =
    err === "oauth_config"
      ? t("discordBotOAuthMissing")
      : err === "state"
        ? t("discordBotStateError")
        : err === "token"
          ? t("discordBotTokenError")
          : err === "callback_failed"
            ? t("discordBotCallbackFailed")
            : err === "seal"
              ? t("discordBotSealError")
              : null;

  return (
    <div className="relative min-h-dvh">
      <DiscordAccountLinkAnimation
        open={oauthAnimOpen}
        mode={oauthAnimMode}
        onExitComplete={onOAuthOverlayExit}
      />
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
        <motion.div
          className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-sky-500/15 blur-[90px]"
          animate={
            reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.4, 0.65, 0.4], rotate: [0, 8, 0] }
          }
          transition={{ type: "tween", duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(124,58,237,0.12),transparent)]" />
      </div>

      <div className="relative z-10">
        <DiscordBotHeroBlock
          onScrollToPanel={scrollToPanel}
          showLogout={!!user}
          onLogout={() => void logout()}
          inviteHref={inviteHref}
          showSiteAdminLink={isSiteAdmin}
        />

        <DiscordBotHowBlock />
        <DiscordBotFeaturesBlock />

        <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <motion.div
            id={PANEL_ANCHOR_ID}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 border-t border-white/10 pt-10 sm:scroll-mt-24"
          >
            <motion.h2
              className="text-center text-2xl font-semibold text-white sm:text-3xl"
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.4, type: "spring", stiffness: 200 }}
            >
              {t("discordBotPanelAnchorTitle")}
            </motion.h2>
            <motion.p
              className="mx-auto mt-2 max-w-2xl text-center text-sm text-zinc-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.45 }}
            >
              {t("discordBotPageSubtitle")}
            </motion.p>
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22, duration: 0.45 }}
            >
              <motion.a
                href={inviteHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("discordBotAddToServerAria")}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="inline-flex items-center justify-center rounded-full bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/35"
              >
                {t("discordBotAddToServer")}
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          {errorBanner ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              {errorBanner}
            </motion.div>
          ) : null}

          <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={
              reduceMotion
                ? undefined
                : { boxShadow: "0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(167,139,250,0.12)" }
            }
            className="rounded-3xl border border-white/[0.11] bg-gradient-to-b from-zinc-900/55 via-zinc-950/80 to-[#08080f] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04] backdrop-blur-xl sm:p-8"
          >
            {user === undefined ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : !user ? (
              <div className="flex flex-col items-center gap-8 py-12 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
                  <p className="max-w-md text-sm leading-relaxed text-zinc-400">{t("discordBotManageHint")}</p>
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                  <motion.a
                    href={inviteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("discordBotAddToServerAria")}
                    className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/50 bg-[#5865F2]/15 px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#5865F2]/25"
                    whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    {t("discordBotAddToServer")}
                  </motion.a>
                  <motion.button
                    type="button"
                    disabled={oauthAnimOpen}
                    onClick={startDiscordOAuth}
                    className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-900/40 disabled:pointer-events-none disabled:opacity-80"
                    whileHover={reduceMotion ? undefined : { scale: 1.05, boxShadow: "0 16px 48px rgba(88,101,242,0.45)" }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                    transition={{ y: { type: "tween", duration: 2.6, repeat: Infinity, ease: "easeInOut" } }}
                  >
                    <DiscordGlyph className="h-5 w-5" />
                    {t("discordBotLoginDiscord")}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] shrink-0 rounded-full ring-2 ring-violet-500/30"
                      />
                    ) : (
                      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-violet-600/40 text-xl font-medium text-white ring-2 ring-violet-500/30">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{user.username}</p>
                      <p className="text-xs text-zinc-500">Discord</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500 sm:max-w-sm sm:text-right">{t("discordBotControlHint")}</p>
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300/90">
                    {t("discordBotPickServer")}
                  </h3>
                  <p className="mb-4 text-xs text-zinc-500">{t("discordBotPickServerLead")}</p>
                  {guildsLoading ? (
                    <p className="text-sm text-zinc-400">{t("discordBotLoading")}</p>
                  ) : guilds && guilds.length === 0 ? (
                    <div className="space-y-3 text-sm text-zinc-400">
                      {guildsListFetchFailed === "rate_limited" ? (
                        <p>{t("discordBotNoServersRateLimited")}</p>
                      ) : guildsListFetchFailed === "api_error" ? (
                        <p>{t("discordBotNoServersDiscordDown")}</p>
                      ) : (
                        <>
                          <p className="font-medium text-zinc-300">{t("discordBotNoServers")}</p>
                          {guildsPanelMeta && guildsPanelMeta.memberGuildCount === 0 ? (
                            <p>{t("discordBotNoServersNoMembership")}</p>
                          ) : guildsPanelMeta && guildsPanelMeta.manageableGuildCount === 0 ? (
                            <p>
                              {t("discordBotNoServersNoManage").replace(
                                "{{count}}",
                                String(guildsPanelMeta.memberGuildCount)
                              )}
                            </p>
                          ) : guildsPanelMeta && guildsPanelMeta.manageableGuildCount > 0 ? (
                            <p>
                              {t("discordBotNoServersBotMissing").replace(
                                "{{count}}",
                                String(guildsPanelMeta.manageableGuildCount)
                              )}
                            </p>
                          ) : (
                            <p>{t("discordBotManageHint")}</p>
                          )}
                          {guildsPanelMeta ? (
                            <p className="text-xs text-zinc-600">
                              {t("discordBotNoServersMetaLine")
                                .replace("{{member}}", String(guildsPanelMeta.memberGuildCount))
                                .replace("{{manage}}", String(guildsPanelMeta.manageableGuildCount))
                                .replace("{{listed}}", String(guildsPanelMeta.listedGuildCount))}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(guilds ?? []).map((g) => (
                        <Link
                          key={g.id}
                          href={`/discord-bot/${g.id}`}
                          aria-label={`${g.name} — ${t("discordBotOpenGuildPanelAria")}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3.5 text-left transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:ring-1 hover:ring-violet-500/15"
                        >
                          {g.iconUrl ? (
                            <Image
                              src={g.iconUrl}
                              alt=""
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-xl"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 text-xs font-medium text-zinc-400">
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate text-sm font-medium text-zinc-100">{g.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
