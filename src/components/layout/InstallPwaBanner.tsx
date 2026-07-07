"use client";

import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Download, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
  } catch {}
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const STORAGE_KEY = "aciusfy_pwa_install_hint_v1";

export function InstallPwaBanner() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventLike | null>(null);
  const nativeInstallUrl = (process.env.NEXT_PUBLIC_NATIVE_APP_INSTALL_URL ?? "").trim();

  useEffect(() => {
    if (nativeInstallUrl) return;
    if (typeof window === "undefined") return;
    if (Capacitor.isNativePlatform())
      return;
    if (isStandalonePwa()) return;
    if (!isMobileDevice()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    setShow(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventLike);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [nativeInstallUrl]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  }, []);

  const onInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  if (nativeInstallUrl) return null;
  if (!show) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed left-3 right-3 z-[48] max-lg:block lg:hidden",
        "bottom-[calc(var(--player-bottom-offset)+var(--player-height)+8px)]",
        "rounded-2xl border border-white/[0.08] bg-[#09090b]/95 p-3 shadow-2xl backdrop-blur-md"
      )}
      role="region"
      aria-label={t("pwaInstallTitle")}
    >
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-white">{t("pwaInstallTitle")}</p>
          <p className="text-[11px] leading-snug text-muted">{t("pwaInstallDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {deferred && (
              <button
                type="button"
                onClick={() => void onInstall()}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
              >
                <Download className="h-3.5 w-3.5" />
                {t("pwaInstallButton")}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted hover:bg-white/5"
            >
              {t("pwaInstallLater")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-white"
          aria-label={t("pwaInstallLater")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
