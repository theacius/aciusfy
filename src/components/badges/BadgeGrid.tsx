"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { BadgeCard, type BadgeData } from "./BadgeCard";
import { useTranslation } from "@/hooks/useTranslation";
import { Award, ChevronRight, Lock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface BadgeWithExtra extends BadgeData {
  category?: string;
  threshold?: number;
  thresholdUnit?: string;
  earnedAt?: string;
  earned?: boolean;
  current?: number;
  progress?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  LISTENING: "Dinleme",
  SONGS_ADDED: "Şarkı Ekleme",
  FRIENDS: "Arkadaşlık",
  PLAYLISTS: "Playlist",
  STREAK: "Seri",
  SPECIAL: "Özel",
};

const UNIT_LABELS: Record<string, string> = {
  minutes: "dk",
  count: "",
  days: "gün",
};

function formatStat(current: number, threshold: number, unit?: string) {
  const u = UNIT_LABELS[unit || "count"] || "";
  return `${current.toLocaleString("tr-TR")}${u ? " " + u : ""} / ${threshold.toLocaleString("tr-TR")}${u ? " " + u : ""}`;
}

export function BadgeGrid({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === userId;

  const [badges, setBadges] = useState<BadgeWithExtra[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [progressBadges, setProgressBadges] = useState<BadgeWithExtra[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/badges/user?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d) => {
        setBadges(d.badges ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const openAllBadges = useCallback(async () => {
    setShowAll(true);
    if (progressBadges.length > 0) return;
    setProgressLoading(true);
    try {
      if (isOwnProfile) {
        const res = await fetch("/api/badges/progress");
        const d = await res.json();
        setProgressBadges(d.badges ?? []);
      } else {
        const res = await fetch(`/api/badges/user?userId=${encodeURIComponent(userId)}&all=true`);
        const d = await res.json();
        setProgressBadges((d.badges ?? []).map((b: BadgeWithExtra) => ({ ...b, earned: true, progress: 1 })));
      }
    } catch {}
    setProgressLoading(false);
  }, [isOwnProfile, userId, progressBadges.length]);

  if (loading) {
    return (
      <div className="mt-3">
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (badges.length === 0 && !isOwnProfile) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Award className="h-4 w-4" />
        <span>{t("noBadgesYet")}</span>
      </div>
    );
  }

  const grouped = new Map<string, BadgeWithExtra[]>();
  for (const b of progressBadges) {
    const cat = b.category || "SPECIAL";
    const list = grouped.get(cat) ?? [];
    list.push(b);
    grouped.set(cat, list);
  }

  const earnedCount = progressBadges.filter((b) => b.earned).length;
  const totalBadges = progressBadges.length;

  return (
    <>
      <div className="mt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">{t("myBadges")}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-muted">{total}</span>
          </div>
          <button
            onClick={openAllBadges}
            className="flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80"
          >
            {t("viewAll")}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {badges.length > 0 ? (
          <div className="flex flex-wrap items-start gap-3">
            {badges.map((b) => (
              <BadgeCard key={b.id} badge={b} size="md" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">{t("noBadgesYet")}</p>
        )}
      </div>

      <AnimatedModal
        isOpen={showAll}
        onClose={() => setShowAll(false)}
        title={t("allBadges")}
        className="max-w-lg"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          {!progressLoading && totalBadges > 0 && (
            <p className="text-xs text-muted">
              {earnedCount} / {totalBadges} {t("badgesEarnedCount")}
            </p>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {progressLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              {[...grouped.entries()].map(([category, catBadges]) => {
                const catEarned = catBadges.filter((b) => b.earned).length;
                return (
                  <div key={category}>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <span className="h-px flex-1 bg-white/[0.08]" />
                      {CATEGORY_LABELS[category] || category}
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium">
                        {catEarned}/{catBadges.length}
                      </span>
                      <span className="h-px flex-1 bg-white/[0.08]" />
                    </h4>
                    <div className="space-y-2">
                      {catBadges
                        .sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0))
                        .map((b) => (
                          <BadgeProgressRow key={b.id} badge={b} isOwnProfile={isOwnProfile} />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AnimatedModal>
    </>
  );
}

function BadgeProgressRow({ badge, isOwnProfile }: { badge: BadgeWithExtra; isOwnProfile: boolean }) {
  const earned = badge.earned;
  const progress = badge.progress ?? 0;
  const pct = Math.round(progress * 100);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
        earned ? "bg-white/[0.03]" : "bg-white/[0.01] opacity-75"
      }`}
    >
      <div className={`relative flex-shrink-0 ${!earned ? "grayscale-[0.6]" : ""}`}>
        <BadgeCard badge={badge} size="sm" showName={false} />
        {earned && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        {!earned && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 ring-2 ring-card">
            <Lock className="h-2.5 w-2.5 text-muted" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${earned ? "text-foreground" : "text-muted"}`}>
            {badge.name}
          </p>
          {earned && badge.earnedAt && (
            <span className="text-[10px] text-emerald-400">
              {new Date(badge.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        {badge.description && (
          <p className="mt-0.5 text-[11px] text-muted line-clamp-1">{badge.description}</p>
        )}

        {isOwnProfile && !earned && badge.threshold && badge.threshold > 0 && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted">
                {formatStat(badge.current ?? 0, badge.threshold, badge.thresholdUnit)}
              </span>
              <span className="font-medium text-accent">{pct}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${badge.borderColor}80, ${badge.borderColor})`,
                }}
              />
            </div>
          </div>
        )}

        {isOwnProfile && earned && (
          <div className="mt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-emerald-500/60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
