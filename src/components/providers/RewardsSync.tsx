"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { showSuccessToast } from "@/store/toastStore";

export function RewardsSync() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (lastSyncedUserId.current === session.user.id) return;
    lastSyncedUserId.current = session.user.id;

    fetch("/api/rewards/sync", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { total?: number } | null) => {
        const total = typeof data?.total === "number" ? data.total : 0;
        if (total > 0) {
          showSuccessToast(t("rewardsSyncEarned").replace("{{n}}", String(total)));
        }
      })
      .catch(() => {});
  }, [status, session?.user?.id, t]);

  useEffect(() => {
    if (status === "unauthenticated") lastSyncedUserId.current = null;
  }, [status]);

  return null;
}
