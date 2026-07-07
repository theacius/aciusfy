"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

const LANG_MAP: Record<string, string> = {
  tr: "tr",
  en: "en",
  de: "de",
  ar: "ar",
  zh: "zh",
  es: "es",
  fr: "fr",
  ru: "ru",
  pt: "pt",
  it: "it",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  pl: "pl",
  ku: "ku",
};

export function LanguageSync() {
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    const lang = LANG_MAP[language] ?? "tr";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [language]);

  return null;
}
