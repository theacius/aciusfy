"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { useSettingsStore } from "@/store/settingsStore";
import { getResolvedTheme } from "@/lib/theme-resolve";

export function CapacitorNativeShell() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void SplashScreen.hide().catch(() => {});
    void Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});

    let remove: (() => void) | undefined;
    void App.addListener("backButton", () => {
      if (window.history.length > 1) window.history.back();
    }).then((h) => {
      remove = () => h.remove();
    });

    return () => {
      remove?.();
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const applyBar = () => {
      const resolved = getResolvedTheme(theme);
      const isLight = resolved === "light";
      void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      void StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark }).catch(() => {});
      void StatusBar.setBackgroundColor({
        color: isLight ? "#fafafa" : "#0a0a0a",
      }).catch(() => {});
    };

    applyBar();

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyBar();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
