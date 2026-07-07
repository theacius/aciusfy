"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquareText, Youtube } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function YoutubeOneriPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [sysMsg, setSysMsg] = useState("");
  const [sysLoading, setSysLoading] = useState(false);
  const [sysFeedback, setSysFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const submitYoutube = async () => {
    const u = url.trim();
    if (!u || !session?.user?.id) return;
    setLoading(true);
    setFeedback(null);
    const youtubeClientTimeoutMs = 660_000;

    try {
      const res = await fetch("/api/youtube-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: u }),
        signal: AbortSignal.timeout(youtubeClientTimeoutMs),
      });
      const raw = await res.text();
      let data = {} as Record<string, unknown>;
      try {
        if (raw) data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        data = {};
      }
      if (!res.ok) {
        const apiErr = typeof data.error === "string" ? data.error : "";
        const base = apiErr || t("youtubeSuggestError");
        const httpHint = apiErr
          ? ""
          : ` ${t("youtubeSuggestHttpHint").replace("{status}", String(res.status))}`;
        const missing = Array.isArray(data.missingEnv)
          ? (data.missingEnv as unknown[]).filter((x): x is string => typeof x === "string")
          : [];
        const envHint = missing.length > 0 ? ` ${t("youtubeSuggestMissingEnv")}` : "";
        setFeedback({
          type: "err",
          text: `${base}${httpHint}${envHint}`,
        });
        return;
      }
      if (data.mode === "playlist") {
        const msg = t("youtubeSuggestPlaylistSuccess")
          .replace("{added}", String(data.added ?? 0))
          .replace("{skipped}", String(data.skipped ?? 0))
          .replace("{failed}", String(data.failed ?? 0))
          .replace("{total}", String(data.totalListed ?? 0))
          .replace("{max}", String(data.maxItems ?? ""));
        setFeedback({
          type: "ok",
          text: data.truncated ? `${msg} ${t("youtubeSuggestPlaylistTruncated")}` : msg,
        });
        setUrl("");
        return;
      }
      if (data.skipped === true) {
        setFeedback({
          type: "ok",
          text: (typeof data.reason === "string" ? data.reason : null) || t("youtubeSuggestDuplicate"),
        });
        return;
      }
      setFeedback({
        type: "ok",
        text: t("youtubeSuggestSuccess")
          .replace("{title}", String(data.songTitle ?? ""))
          .replace("{artist}", String(data.artistName ?? "")),
      });
      setUrl("");
    } catch (e) {
      const aborted =
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "TimeoutError");
      setFeedback({
        type: "err",
        text: aborted ? t("youtubeSuggestTimeout") : t("youtubeSuggestError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const submitSystemFeedback = async () => {
    const m = sysMsg.trim();
    if (!m || m.length < 10 || !session?.user?.id) return;
    setSysLoading(true);
    setSysFeedback(null);
    try {
      const res = await fetch("/api/feedback/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: m }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        ok?: boolean;
        discordOk?: boolean;
        webhookConfigured?: boolean;
      };
      if (res.status === 401) {
        setSysFeedback({ type: "err", text: t("youtubeSuggestLogin") });
        return;
      }
      if (!res.ok) {
        const hint =
          typeof data?.details === "string" && data.details
            ? ` (${data.details})`
            : typeof data?.error === "string"
              ? ` (${data.error})`
              : "";
        setSysFeedback({
          type: "err",
          text: `${t("systemFeedbackError")}${hint}`,
        });
        return;
      }
      if (data.webhookConfigured === false) {
        setSysFeedback({ type: "ok", text: t("systemFeedbackNotConfigured") });
      } else if (data.discordOk === false) {
        setSysFeedback({ type: "ok", text: t("systemFeedbackSuccessNoDiscord") });
      } else {
        setSysFeedback({ type: "ok", text: t("systemFeedbackSuccess") });
      }
      setSysMsg("");
    } catch {
      setSysFeedback({ type: "err", text: t("systemFeedbackError") });
    } finally {
      setSysLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-lg space-y-10">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Youtube className="h-7 w-7 text-[#FF0033]" strokeWidth={2.1} aria-hidden />
            {t("youtubeSuggestModalTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("youtubeSuggestModalDesc")}</p>
        </div>

        {status === "loading" ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted" />
          </div>
        ) : !session?.user?.id ? (
          <section className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/70">{t("youtubeSuggestLogin")}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              {t("aiChatSignIn")}
            </Link>
          </section>
        ) : (
          <>
            <section className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-6">
              <div>
                <label htmlFor="youtube-oneri-url" className="mb-2 block text-xs font-medium text-white/80">
                  {t("youtubeSuggestUrlLabel")}
                </label>
                <input
                  id="youtube-oneri-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t("youtubeSuggestPlaceholder")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/15"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
              {feedback && (
                <p className={`text-sm ${feedback.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                  {feedback.text}
                </p>
              )}
              <button
                type="button"
                onClick={() => void submitYoutube()}
                disabled={loading || !url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("youtubeSuggestLoading")}
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 shrink-0 text-[#FF0000]" strokeWidth={2.35} aria-hidden />
                    {t("youtubeSuggestSubmit")}
                  </>
                )}
              </button>
            </section>

            <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25">
                  <MessageSquareText className="h-5 w-5 text-violet-200" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{t("systemFeedbackTitle")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("systemFeedbackDesc")}</p>
                </div>
              </div>
              <div>
                <label htmlFor="system-feedback-msg" className="mb-2 block text-xs font-medium text-white/80">
                  {t("systemFeedbackLabel")}
                </label>
                <textarea
                  id="system-feedback-msg"
                  value={sysMsg}
                  onChange={(e) => setSysMsg(e.target.value)}
                  placeholder={t("systemFeedbackPlaceholder")}
                  rows={5}
                  disabled={sysLoading}
                  className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/15"
                />
                {sysMsg.trim().length > 0 && sysMsg.trim().length < 10 && (
                  <p className="mt-1 text-xs text-amber-400/90">{t("systemFeedbackTooShort")}</p>
                )}
              </div>
              {sysFeedback && (
                <p className={`text-sm ${sysFeedback.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                  {sysFeedback.text}
                </p>
              )}
              <button
                type="button"
                onClick={() => void submitSystemFeedback()}
                disabled={sysLoading || sysMsg.trim().length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sysLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("systemFeedbackSending")}
                  </>
                ) : (
                  <>
                    <MessageSquareText className="h-4 w-4" />
                    {t("systemFeedbackSubmit")}
                  </>
                )}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
