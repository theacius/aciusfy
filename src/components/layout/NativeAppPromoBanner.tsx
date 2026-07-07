"use client";

import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Smartphone, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

function installUrl(): string {
  return (process.env.NEXT_PUBLIC_NATIVE_APP_INSTALL_URL ?? "").trim();
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

const STORAGE_KEY = "aciusfy_native_app_promo_dismiss_v1";

export function NativeAppPromoBanner() {
  const { t } = useTranslation();
  const url = installUrl();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!url) return;
    if (typeof window === "undefined") return;
    if (Capacitor.isNativePlatform()) return;
    if (!isMobileDevice()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    setShow(true);
  }, [url]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  }, []);

  if (!url || !show) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed left-3 right-3 z-[49] max-lg:block lg:hidden",
        "bottom-[calc(var(--player-bottom-offset)+var(--player-height)+8px)]",
        "rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/95 to-[#121212]/95 p-3 shadow-2xl backdrop-blur-md"
      )}
      role="region"
      aria-label={t("nativeAppPromoTitle")}
    >
      <div className="flex gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/30">
          <Smartphone className="h-5 w-5 text-violet-200" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-white">{t("nativeAppPromoTitle")}</p>
          <p className="text-[11px] leading-snug text-muted">{t("nativeAppPromoDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
            >
              {t("nativeAppPromoCta")}
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted hover:bg-white/5"
            >
              {t("nativeAppPromoDismiss")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-white"
          aria-label={t("nativeAppPromoDismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
