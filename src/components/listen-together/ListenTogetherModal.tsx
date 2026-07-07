"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useListenTogetherStore } from "@/store/listenTogetherStore";
import { Copy, Check, Users, Crown, LogOut } from "lucide-react";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface ListenTogetherModalProps {
  open: boolean;
  onClose: () => void;
}

export function ListenTogetherModal({ open, onClose }: ListenTogetherModalProps) {
  const { t } = useTranslation();
  const isActive = useListenTogetherStore((s) => s.isActive);
  const isHost = useListenTogetherStore((s) => s.isHost);
  const sessionCode = useListenTogetherStore((s) => s.sessionCode);
  const participants = useListenTogetherStore((s) => s.participants);
  const createSession = useListenTogetherStore((s) => s.createSession);
  const joinSession = useListenTogetherStore((s) => s.joinSession);
  const leaveSession = useListenTogetherStore((s) => s.leaveSession);

  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      await createSession();
    } catch {
      setError("Failed to create session");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (joinCode.length !== 6) {
      setError(t("invalidCode"));
      return;
    }
    setLoading(true);
    setError("");
    const success = await joinSession(joinCode);
    if (!success) setError(t("sessionNotFound"));
    setLoading(false);
  };

  const handleCopyCode = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    leaveSession();
    onClose();
  };

  return (
    <AnimatedModal
      isOpen={open}
      onClose={onClose}
      title={t("listenTogether")}
      className="max-w-md"
    >
      <div className="p-6">
        {!isActive ? (
          <div className="space-y-4">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
            >
              <Users className="h-5 w-5" />
              {t("createSession")}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs text-muted">{t("joinSession")}</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder={t("enterCode")}
                maxLength={6}
                className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-white placeholder-white/20 transition focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                className="rounded-full border border-white/[0.08] bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/[0.1] disabled:opacity-40"
              >
                {t("joinSession")}
              </button>
            </div>

            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
              <p className="mb-1 text-xs text-muted">{t("inviteCode")}</p>
              <p className="font-mono text-3xl font-bold tracking-[0.4em] text-purple-400">
                {sessionCode}
              </p>
              <button
                onClick={handleCopyCode}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    {t("codeCopied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {t("copyCode")}
                  </>
                )}
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-white/50">
                {t("participants")} ({participants.length})
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/30 text-sm font-bold text-purple-300">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name || ""}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (p.name || "?")[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm text-white/80">
                      {p.name || "User"}
                    </span>
                    {p.id === useListenTogetherStore.getState().hostUserId && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {!isHost && (
              <div className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-purple-600/10 px-3 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                <span className="text-xs text-purple-300">{t("syncStatus")}</span>
              </div>
            )}

            <button
              onClick={handleLeave}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-red-500/10 px-4 py-3 font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              {isHost ? t("endSession") : t("leaveSession")}
            </button>
          </div>
        )}
      </div>
    </AnimatedModal>
  );
}
