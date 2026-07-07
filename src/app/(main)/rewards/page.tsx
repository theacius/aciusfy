"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarCheck, Coins, Headphones, Music2, RefreshCw, Sparkles, Store } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { showSuccessToast } from "@/store/toastStore";

type QuestRow = {
  id: string;
  group: "listen" | "songs";
  reward: number;
  claimed: boolean;
  progress: number;
  target: number;
};

type StatusPayload = {
  dateKey: string;
  coinsBalance: number;
  listenSecondsToday: number;
  distinctSongsToday: number;
  listenSecondsWeek?: number;
  distinctSongsWeek?: number;
  dailyLogin: { reward: number; claimed: boolean };
  dailyRandomQuest: QuestRow;
  quests: QuestRow[];
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RewardsPage() {
  const { t } = useTranslation();
  const { status } = useSession();
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/rewards/status");
      if (r.ok) setData(await r.json());
      else setData(null);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/rewards/sync", { method: "POST" });
      const j = await r.json();
      if (r.ok && typeof j?.total === "number" && j.total > 0) {
        showSuccessToast(t("rewardsSyncEarned").replace("{{n}}", String(j.total)));
      }
      await load();
    } finally {
      setSyncing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">{t("rewardsLoginHint")}</p>
        <Link href="/login" className="mt-4 inline-block text-accent underline">
          {t("aiChatSignIn")}
        </Link>
      </div>
    );
  }

  const q = data?.dailyRandomQuest ?? data?.quests?.[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-7 w-7 text-amber-400" aria-hidden />
        <h1 className="text-2xl font-bold text-foreground">{t("dailyQuestsTitle")}</h1>
      </div>
      <p className="text-sm text-muted">{t("dailyQuestsSubtitle")}</p>
      <p className="mt-1 text-xs text-muted/80">
        {t("dailyQuestsUtcNote")} ({data?.dateKey ?? "—"})
      </p>
      <p className="mt-1 text-xs text-muted/80">{t("dailyQuestsRandomModeNote")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 ring-1 ring-amber-500/25">
          <Coins className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-amber-400">{(data?.coinsBalance ?? 0).toLocaleString()}</span>
          <span className="text-xs text-amber-400/70">{t("shopCoinsLabel")}</span>
        </div>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {t("dailyQuestsSyncButton")}
        </button>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <Store className="h-4 w-4" />
          {t("shop")}
        </Link>
      </div>

      {data != null && typeof data.listenSecondsWeek === "number" && (
        <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-sm font-medium text-foreground">{t("rewardsWeekStatsTitle")}</p>
          <p className="mt-1 text-xs text-muted">{t("rewardsWeekStatsDesc")}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-white/90">
              <Music2 className="mr-1 inline h-4 w-4 text-violet-400" />
              {formatDuration(data.listenSecondsWeek)}
            </span>
            <span className="text-muted">
              {t("rewardsWeekDistinctSongs").replace("{{n}}", String(data?.distinctSongsWeek ?? 0))}
            </span>
          </div>
        </div>
      )}

      <ul className="mt-8 space-y-4">
        <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{t("dailyQuestLoginTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("dailyQuestLoginDesc")}</p>
              <p className="mt-2 text-sm text-amber-400/90">+{data?.dailyLogin.reward ?? 15} coin</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                data?.dailyLogin.claimed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted"
              )}
            >
              {data?.dailyLogin.claimed ? t("dailyQuestDone") : t("dailyQuestPending")}
            </span>
          </div>
        </li>

        {q != null && (
          <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-start gap-3">
              {q.group === "listen" ? (
                <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
              ) : (
                <Music2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              )}
              <div>
                <p className="font-medium text-foreground">{t("dailyQuestsTodaysRandomTitle")}</p>
                <p className="mt-1 text-sm text-muted">
                  {q.group === "listen" ? t("dailyQuestsGroupListenDesc") : t("dailyQuestsGroupSongsDesc")}
                </p>
                <p className="mt-1 text-xs text-muted/80">
                  {q.group === "listen"
                    ? `${t("dailyQuestsProgressListenSummary")}: ${formatDuration(data?.listenSecondsToday ?? 0)}`
                    : `${t("dailyQuestsProgressSongsSummary")}: ${data?.distinctSongsToday ?? 0}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  {q.group === "listen" ? (
                    <>
                      {formatDuration(q.target)} {t("dailyQuestsTierTargetLabel")}
                      <span className="text-amber-400/90"> · +{q.reward} coin</span>
                    </>
                  ) : (
                    <>
                      ≥ {q.target} {t("dailyQuestSongsUnit")}{" "}
                      <span className="text-amber-400/90">· +{q.reward} coin</span>
                    </>
                  )}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      q.group === "listen" ? "bg-violet-500/90" : "bg-sky-500/90"
                    )}
                    style={{ width: `${Math.min(100, (q.progress / Math.max(1, q.target)) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {q.group === "listen"
                    ? `${formatDuration(q.progress)} / ${formatDuration(q.target)}`
                    : `${q.progress} / ${q.target}`}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  q.claimed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted"
                )}
              >
                {q.claimed ? t("dailyQuestDone") : t("dailyQuestPending")}
              </span>
            </div>
          </li>
        )}
      </ul>

      <p className="mt-8 text-center text-xs text-muted">{t("dailyQuestsAutoHint")}</p>
    </div>
  );
}
