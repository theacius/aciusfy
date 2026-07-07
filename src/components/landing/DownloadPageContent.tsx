"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MarketingPageWithNav } from "@/components/premium/MarketingPageShell";
import { LandingEntranceCurtain } from "@/components/landing/LandingEntranceCurtain";
import { ShineButton } from "@/components/ui/shine-button";
import { useTranslation } from "@/hooks/useTranslation";
import { getDesktopInstallerUrl } from "@/lib/desktop-download";
import { isSemverNewer } from "@/lib/compare-semver";
import { downloadDesktopInstaller } from "@/lib/desktop-installer-client";
import { Download, Loader2, Sparkles, X } from "lucide-react";

type ReleasePayload = {
  version: string;
  releaseNotes: string[];
  downloadUrl: string | null;
};

function pickInstallerHref(api: ReleasePayload) {
  if (api.downloadUrl?.trim()) return api.downloadUrl.trim();
  return getDesktopInstallerUrl();
}

export function DownloadPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const desktopUpdate = searchParams.get("desktopUpdate") === "1";
  const currentV = searchParams.get("v")?.trim() || "";

  const [busy, setBusy] = useState(false);
  const [installErr, setInstallErr] = useState(false);
  const [release, setRelease] = useState<ReleasePayload | null>(null);
  const [releaseErr, setReleaseErr] = useState(false);
  const installerUrl = getDesktopInstallerUrl();

  const loadRelease = useCallback(async () => {
    try {
      const r = await fetch("/api/desktop-release", { cache: "no-store" });
      if (!r.ok) {
        setReleaseErr(true);
        return;
      }
      const j = (await r.json()) as ReleasePayload;
      if (j?.version) setRelease(j);
      else setReleaseErr(true);
    } catch {
      setReleaseErr(true);
    }
  }, []);

  useEffect(() => {
    if (desktopUpdate) {
      void loadRelease();
    }
  }, [desktopUpdate, loadRelease]);

  const handleStart = async () => {
    setInstallErr(false);
    const href = release ? pickInstallerHref(release) : installerUrl;
    setBusy(true);
    try {
      const r = await downloadDesktopInstaller(href, window.location.origin);
      if (r === "not_available" || r === "error") {
        setInstallErr(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCloseUpdate = () => {
    if (typeof window !== "undefined" && window.aciusfyDesktop?.closeUpdateWindow) {
      window.aciusfyDesktop.closeUpdateWindow();
    } else {
      window.close();
    }
  };

  if (desktopUpdate) {
    const newer =
      !releaseErr &&
      release != null &&
      (!currentV || isSemverNewer(release.version, currentV));
    const isUpToDate =
      !releaseErr && release != null && currentV && !isSemverNewer(release.version, currentV);

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050508] p-4">
        {release == null && !releaseErr ? (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
            <p className="text-sm">…</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl ring-1 ring-white/5"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">{t("desktopUpdateTitle")}</h1>
                  <p className="text-xs text-white/40">{t("desktopUpdateLead")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseUpdate}
                className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white/70"
                aria-label={t("desktopUpdateClose")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {currentV && (
              <div className="mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2 text-white/50">
                  <span>{t("desktopUpdateCurrentLabel")}</span>
                  <span className="font-mono text-white/80">v{currentV}</span>
                </div>
                {release && (
                  <div className="flex justify-between gap-2 text-white/50">
                    <span>{t("desktopUpdateLatestLabel")}</span>
                    <span className="font-mono text-emerald-300/90">v{release.version}</span>
                  </div>
                )}
              </div>
            )}

            {newer && release && release.releaseNotes.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">
                  {t("desktopUpdateWhatsNew")}
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-white/70">
                  {release.releaseNotes.map((line, i) => (
                    <li key={`${i}-${line.slice(0, 48)}`}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {isUpToDate && (
              <p className="mb-4 text-sm text-white/50">{t("desktopUpdateUpToDate")}</p>
            )}

            {releaseErr && (
              <p className="mb-4 text-sm text-amber-200/60">{t("desktopUpdateLoadError")}</p>
            )}

            {installErr && (
              <p className="mb-4 text-sm text-amber-200/80">{t("downloadUrlNotConfigured")}</p>
            )}

            <div className="flex flex-col gap-2">
              {newer && (
                <ShineButton
                  type="button"
                  variant="primary"
                  size="lg"
                  tone="blue"
                  disabled={busy}
                  className="w-full justify-center py-3 text-base font-semibold"
                  onClick={() => void handleStart()}
                >
                  <span className="flex items-center justify-center gap-2">
                    {busy ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    {busy ? t("desktopUpdateDownloading") : t("desktopUpdateDownloadCta")}
                  </span>
                </ShineButton>
              )}
              {newer && busy && (
                <p className="text-center text-xs text-white/40">{t("downloadPageDownloadingHint")}</p>
              )}
              <button
                type="button"
                onClick={handleCloseUpdate}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10"
              >
                {t("desktopUpdateClose")}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <>
      <LandingEntranceCurtain />
      <MarketingPageWithNav>
        <main className="flex min-h-[calc(100dvh-var(--premium-nav-height))] flex-col px-4 pb-16 sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="bg-gradient-to-r from-violet-200 via-white to-emerald-200 bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent sm:text-4xl md:text-5xl">
                {t("downloadPageSlogan")}
              </h1>
              <p className="mt-4 text-sm text-white/50 sm:text-base">{t("downloadPageLead")}</p>
              <p className="mt-2 text-xs text-white/35 sm:text-sm">{t("downloadPageSetupNote")}</p>
            </motion.div>

            <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <ShineButton
                  type="button"
                  variant="primary"
                  size="lg"
                  tone="blue"
                  disabled={busy}
                  className="w-full justify-center py-4 text-base font-semibold sm:py-5 sm:text-lg"
                  onClick={() => void handleStart()}
                >
                  <span className="flex items-center justify-center gap-2.5">
                    {busy ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-5 w-5 shrink-0" aria-hidden />
                    )}
                    {busy ? t("downloadPageDownloading") : t("downloadPageCta")}
                  </span>
                </ShineButton>
              </motion.div>
              {busy && (
                <p className="text-sm leading-relaxed text-white/40">{t("downloadPageDownloadingHint")}</p>
              )}
              {installErr && !busy && (
                <p className="text-sm leading-relaxed text-amber-200/85">{t("downloadUrlNotConfigured")}</p>
              )}
            </div>
          </div>
        </main>
      </MarketingPageWithNav>
    </>
  );
}
