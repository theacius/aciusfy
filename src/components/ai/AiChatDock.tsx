"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bot,
  ListMusic,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AI_QUOTA_USER_MESSAGE } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { AiSongCard, type AiSuggestedSong } from "./AiSongCard";

type ChatMsg = { role: "user" | "assistant"; content: string };

function prevUserContent(messages: ChatMsg[], assistantIndex: number): string {
  for (let j = assistantIndex - 1; j >= 0; j--) {
    if (messages[j].role === "user") return messages[j].content;
  }
  return "";
}

function AssistantFeedbackButtons({
  userMessage,
  assistantMessage,
}: {
  userMessage: string;
  assistantMessage: string;
}) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState<1 | -1 | null>(null);
  const [choice, setChoice] = useState<1 | -1 | null>(null);

  const submit = async (rating: 1 | -1) => {
    if (pending !== null || sent) return;
    setPending(rating);
    try {
      const res = await fetch("/api/chat/ollama/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          assistantMessage,
          rating,
        }),
      });
      if (res.ok) {
        setSent(true);
        setChoice(rating);
      }
    } finally {
      setPending(null);
    }
  };

  if (sent) {
    return (
      <div className="mt-2 flex max-w-[90%] flex-wrap items-center gap-2">
        <p className="text-[11px] leading-snug text-zinc-500">{t("aiFeedbackSent")}</p>
        {choice === 1 ? (
          <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} aria-hidden />
        ) : choice === -1 ? (
          <ThumbsDown className="h-3.5 w-3.5 shrink-0 text-rose-400/90" strokeWidth={2.5} aria-hidden />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="mt-2 flex max-w-[90%] items-center gap-1"
      role="group"
      aria-label={t("aiFeedbackGroupLabel")}
    >
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => void submit(1)}
        title={t("aiFeedbackGood")}
        aria-label={t("aiFeedbackGood")}
        className={cn(
          "rounded-full p-2 text-zinc-400 transition-colors",
          "hover:bg-emerald-500/15 hover:text-emerald-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
          "disabled:opacity-40"
        )}
      >
        {pending === 1 ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ThumbsUp className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        )}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => void submit(-1)}
        title={t("aiFeedbackBad")}
        aria-label={t("aiFeedbackBad")}
        className={cn(
          "rounded-full p-2 text-zinc-400 transition-colors",
          "hover:bg-rose-500/15 hover:text-rose-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40",
          "disabled:opacity-40"
        )}
      >
        {pending === -1 ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ThumbsDown className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function AiChatDock() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistBanner, setPlaylistBanner] = useState<{
    href: string;
    title: string;
    added: number;
    coverImage: string | null;
    userDisplayName: string;
  } | null>(null);
  const [songSuggestions, setSongSuggestions] = useState<Record<number, AiSuggestedSong[]>>({});
  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || status !== "authenticated") return;
    void fetch("/api/chat/assistant", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { provider?: string; model?: string } | null) => {
        if (data?.provider) {
          setAiProviderLabel(data.model ? `${data.provider} · ${data.model}` : data.provider);
        }
      })
      .catch(() => setAiProviderLabel(null));
  }, [open, status]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || status !== "authenticated") return;

    setInput("");
    setError(null);
    setPlaylistBanner(null);
    const nextMsgs: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setLoading(true);

    const chatClientTimeoutMs = 630_000;

    try {
      const res = await fetch("/api/chat/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: nextMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: AbortSignal.timeout(chatClientTimeoutMs),
      });
      const raw = await res.text();
      let data = {} as {
        reply?: string;
        error?: string;
        detail?: string;
        playlist?: {
          id: string;
          title: string;
          href: string;
          added: number;
          coverImage?: string | null;
          userDisplayName?: string;
        };
        playlistError?: string;
        suggestedSongs?: AiSuggestedSong[];
      };
      try {
        if (raw) data = JSON.parse(raw) as typeof data;
      } catch {
        data = {};
      }

      if (!res.ok) {
        const isQuota = data.error?.trim() === AI_QUOTA_USER_MESSAGE;
        const message = isQuota
          ? AI_QUOTA_USER_MESSAGE
          : data.error?.trim() || data.detail?.trim() || t("aiChatError");
        const combined = `${message} ${data.detail?.trim() ?? ""}`;
        const hint =
          !isQuota && (/not found/i.test(combined) || /model/i.test(combined))
            ? `\n\n${t("aiChatModelPullHint")}`
            : "";
        setError(message);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${message}${hint}`,
          },
        ]);
        return;
      }

      const reply = data.reply?.trim() || "…";
      setMessages((prev) => {
        const newMsgs = [...prev, { role: "assistant" as const, content: reply }];
        if (data.suggestedSongs && data.suggestedSongs.length > 0) {
          const assistantIdx = newMsgs.length - 1;
          setSongSuggestions((prev) => ({ ...prev, [assistantIdx]: data.suggestedSongs! }));
        }
        return newMsgs;
      });
      if (data.playlist?.href && data.playlist.title) {
        setPlaylistBanner({
          href: data.playlist.href,
          title: data.playlist.title,
          added: data.playlist.added,
          coverImage: data.playlist.coverImage ?? null,
          userDisplayName:
            data.playlist.userDisplayName?.trim() ||
            session?.user?.name?.trim() ||
            session?.user?.email?.split("@")[0] ||
            "…",
        });
      }
    } catch (e) {
      const aborted =
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "TimeoutError");
      const fallback = aborted ? t("aiChatTimeout") : t("aiChatError");
      setError(fallback);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, session?.user?.email, session?.user?.name, status, t]);

  return (
    <>
      {!open ? (
        <button
          type="button"
          aria-label={t("aiChatOpen")}
          title={t("aiAssistant")}
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full",
            "border border-white/[0.12] bg-[#09090b] text-white",
            "shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.08]",
            "transition hover:scale-[1.03] hover:border-white/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            "active:scale-[0.98] lg:right-6"
          )}
          style={{
            bottom: "calc(var(--player-bottom-offset) + var(--player-height) + 0.75rem)",
          }}
        >
          <Bot className="h-7 w-7 drop-shadow-sm" aria-hidden />
        </button>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-end p-3 sm:p-4 lg:items-end lg:justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-chat-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label={t("aiChatClose")}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "relative flex max-h-[min(78dvh,580px)] w-full max-w-md flex-col overflow-hidden",
              "rounded-[1.75rem] border border-white/[0.08]",
              "bg-[#09090b]/98 backdrop-blur-xl",
              "shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]"
              aria-hidden
            />

            <div className="relative flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
                  <Sparkles className="h-5 w-5 text-white/70" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 id="ai-chat-title" className="truncate text-sm font-semibold tracking-tight text-white">
                    {t("aiAssistant")}
                  </h2>
                  <p className="truncate text-[11px] leading-tight text-zinc-500">
                    {aiProviderLabel ?? t("aiChatSubtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t("aiChatClose")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === "loading" ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-white/40" />
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <p className="text-sm text-zinc-400">{t("aiChatLoginHint")}</p>
                <Link
                  href="/login"
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#09090b] transition hover:opacity-90"
                >
                  {t("aiChatSignIn")}
                </Link>
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="min-h-[220px] flex-1 space-y-4 overflow-y-auto px-4 py-4"
                >
                  {messages.length === 0 && !loading && (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
                      <MessageCircle className="mx-auto mb-2 h-8 w-8 text-white/20" aria-hidden />
                      <p className="text-sm leading-relaxed text-zinc-500">{t("aiChatEmpty")}</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "flex w-full",
                          m.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[min(92%,20rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                            m.role === "user"
                              ? "bg-white text-[#09090b] shadow-lg shadow-black/20"
                              : "border border-white/[0.07] bg-zinc-900/80 text-zinc-100 shadow-inner backdrop-blur-sm"
                          )}
                        >
                          {m.role === "assistant" ? (
                            <span className="whitespace-pre-wrap break-words">{m.content}</span>
                          ) : (
                            m.content
                          )}
                        </div>
                      </div>
                      {m.role === "assistant" && songSuggestions[i] && songSuggestions[i].length > 0 && (
                        <div className="mt-2 w-full max-w-full overflow-x-auto pb-1">
                          <div className="flex gap-2">
                            {songSuggestions[i].map((song) => (
                              <AiSongCard key={song.id} song={song} />
                            ))}
                          </div>
                        </div>
                      )}
                      {m.role === "assistant" && prevUserContent(messages, i) ? (
                        <AssistantFeedbackButtons
                          userMessage={prevUserContent(messages, i)}
                          assistantMessage={m.content}
                        />
                      ) : null}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400"
                        )}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-40" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white/60" />
                        </span>
                        <span className="text-xs text-zinc-500">{t("aiChatThinking")}</span>
                      </div>
                    </div>
                  )}
                  {error && <p className="text-xs text-amber-400/90">{error}</p>}
                </div>

                {playlistBanner ? (
                  <div className="border-t border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                    <Link
                      href={playlistBanner.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] p-2.5",
                        "transition-colors hover:border-white/20 hover:bg-white/[0.06]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      )}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800/90 ring-1 ring-white/10">
                        {playlistBanner.coverImage ? (
                          (<img
                            src={proxiedImageUrl(playlistBanner.coverImage) || playlistBanner.coverImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />)
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ListMusic className="h-6 w-6 text-white/40" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                          {t("aiPlaylistCreatedBanner")}
                        </p>
                        <p className="truncate text-sm font-semibold text-white">{playlistBanner.title}</p>
                        <p className="truncate text-[12px] text-zinc-400">
                          {t("preparedFor").replace("{name}", playlistBanner.userDisplayName)}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {t("aiPlaylistTrackCount").replace("{n}", String(playlistBanner.added))}
                        </p>
                      </div>
                    </Link>
                  </div>
                ) : null}

                <div className="border-t border-white/[0.08] bg-black/20 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={t("aiChatPlaceholder")}
                      disabled={loading}
                      className={cn(
                        "min-w-0 flex-1 rounded-2xl border border-white/[0.1] bg-black/35 px-4 py-3 text-sm text-white",
                        "placeholder:text-zinc-600",
                        "focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/15"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={loading || !input.trim()}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        "bg-white text-[#09090b] shadow-md shadow-black/30",
                        "transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                      )}
                      aria-label={t("aiChatSend")}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
