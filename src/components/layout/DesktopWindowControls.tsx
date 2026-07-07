"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Minus, Maximize2, X } from "lucide-react";

export function DesktopWindowControls({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const api = mounted && typeof window !== "undefined" ? window.aciusfyDesktop : undefined;

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined" || !window.aciusfyDesktop?.onMaximizedChange) return;
    const a = window.aciusfyDesktop;
    void a.isMaximized().then(setMaximized);
    return a.onMaximizedChange(setMaximized);
  }, [mounted]);

  const onMax = useCallback(() => {
    api?.maximize();
  }, [api]);

  if (!mounted || !api) return null;

  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-stretch gap-px self-center rounded-sm max-sm:ml-0",
        className,
      )}
      role="group"
      aria-label={t("windowControls")}
    >
      <button
        type="button"
        onClick={() => api.minimize()}
        className="flex w-11 min-h-[2rem] items-center justify-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title={t("windowMinimize")}
        aria-label={t("windowMinimize")}
      >
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={onMax}
        className="flex w-11 min-h-[2rem] items-center justify-center rounded-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title={maximized ? t("windowRestore") : t("windowMaximize")}
        aria-label={maximized ? t("windowRestore") : t("windowMaximize")}
      >
        {maximized ? (
          <span className="relative inline-block h-3 w-3" aria-hidden>
            <span className="absolute left-0 top-0 block h-2 w-2.5 border border-current" />
            <span className="absolute bottom-0 right-0 block h-2 w-2.5 border border-current bg-[#121212]" />
          </span>
        ) : (
          <Maximize2 className="h-3 w-3 stroke-[2.5]" />
        )}
      </button>
      <button
        type="button"
        onClick={() => api.close()}
        className="flex w-11 min-h-[2rem] items-center justify-center rounded-sm text-white/70 transition-colors hover:bg-red-600 hover:text-white"
        title={t("windowClose")}
        aria-label={t("windowClose")}
      >
        <X className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
