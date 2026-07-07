"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { MemberVcIntroSection } from "@/components/member/MemberVcIntroSection";
import { showErrorToast, showSuccessToast } from "@/store/toastStore";

export default function MemberPanelPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { status } = useSession();
  const [discordLinked, setDiscordLinked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/member");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as { discordLinked?: boolean };
        if (!cancelled && typeof data.discordLinked === "boolean") {
          setDiscordLinked(data.discordLinked);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const onToast = (msg: string, type: "success" | "error") => {
    if (type === "success") showSuccessToast(msg);
    else showErrorToast(msg);
  };

  if (status === "loading" || profileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("memberPanelLoading")}
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-10">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-green-400">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase tracking-wider">{t("memberPanelEyebrow")}</span>
        </div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">{t("memberPanelTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("memberPanelLead")}</p>
      </div>

      <div className="space-y-6">
        <MemberVcIntroSection discordLinked={discordLinked} onToast={onToast} />
      </div>
    </div>
  );
}
