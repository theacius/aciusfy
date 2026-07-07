"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, ExternalLink, Loader2, Trash2, Upload, User, Volume2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import type { VcIntroUserEntry } from "@/lib/discord-vc-intro-config";
import { introSourceType, isUploadedIntroPath } from "@/lib/discord-vc-intro-config";
import { cn } from "@/lib/utils";

type Props = {
  discordLinked: boolean;
  onToast?: (msg: string, type: "success" | "error") => void;
  className?: string;
};

type Payload = {
  disabled?: boolean;
  entry?: VcIntroUserEntry | null;
};

export function MemberVcIntroSection({ discordLinked, onToast, className }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [songTitle, setSongTitle] = useState<string | undefined>();
  const [profile, setProfile] = useState<Pick<
    VcIntroUserEntry,
    "discordUsername" | "discordDisplayName" | "discordAvatarUrl"
  > | null>(null);
  const [sourceMode, setSourceMode] = useState<"youtube" | "file">("youtube");

  const load = useCallback(async () => {
    if (!discordLinked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/me/vc-intro", { credentials: "include" });
      if (!r.ok) {
        onToast?.(t("memberVcIntroLoadError"), "error");
        return;
      }
      const data = (await r.json()) as Payload;
      setDisabled(data.disabled === true);
      const entry = data.entry ?? null;
      if (entry) {
        setUrl(entry.url ?? "");
        setLabel(entry.label ?? "");
        setEnabled(entry.enabled !== false);
        setSongTitle(entry.songTitle);
        setSourceMode(entry.url && introSourceType(entry.url) === "file" ? "file" : "youtube");
        setProfile({
          discordUsername: entry.discordUsername,
          discordDisplayName: entry.discordDisplayName,
          discordAvatarUrl: entry.discordAvatarUrl,
        });
      } else {
        setUrl("");
        setLabel("");
        setEnabled(true);
        setSongTitle(undefined);
        setSourceMode("youtube");
        setProfile(null);
      }
    } catch {
      onToast?.(t("memberVcIntroLoadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [discordLinked, onToast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/me/vc-intro/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast?.(typeof data?.error === "string" ? data.error : t("discordVcIntroUploadError"), "error");
        return;
      }
      setUrl(String(data.url ?? ""));
      setSongTitle(data.songTitle ? String(data.songTitle) : undefined);
      setSourceMode("file");
      onToast?.(t("discordVcIntroUploadSuccess"), "success");
    } catch {
      onToast?.(t("discordVcIntroUploadError"), "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const trimmedUrl = url.trim();
    if (enabled && !trimmedUrl) {
      onToast?.(t("memberVcIntroUrlRequired"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me/vc-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: trimmedUrl || undefined,
          label: label.trim() || undefined,
          enabled,
          songTitle: songTitle?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast?.(typeof data?.error === "string" ? data.error : t("memberVcIntroSaveError"), "error");
        return;
      }
      const entry = data.entry as VcIntroUserEntry | null | undefined;
      if (entry) {
        setProfile({
          discordUsername: entry.discordUsername,
          discordDisplayName: entry.discordDisplayName,
          discordAvatarUrl: entry.discordAvatarUrl,
        });
      }
      onToast?.(t("memberVcIntroSaveSuccess"), "success");
    } catch {
      onToast?.(t("memberVcIntroSaveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      const res = await fetch("/api/me/vc-intro", { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        onToast?.(t("memberVcIntroRemoveError"), "error");
        return;
      }
      setUrl("");
      setLabel("");
      setEnabled(true);
      setSongTitle(undefined);
      onToast?.(t("memberVcIntroRemoveSuccess"), "success");
    } catch {
      onToast?.(t("memberVcIntroRemoveError"), "error");
    } finally {
      setRemoving(false);
    }
  };

  if (!discordLinked) {
    return (
      <div className={cn("rounded-xl border border-white/8 bg-white/[0.03] p-6", className)}>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
          <Volume2 className="h-5 w-5 text-green-400" />
          {t("memberVcIntroTitle")}
        </h2>
        <p className="mb-4 text-sm text-muted">{t("memberVcIntroLinkRequired")}</p>
        <Link
          href="/api/discord-bot/oauth/authorize?link=1"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4]"
        >
          {t("settingsDiscordLinkButton")}
          <ExternalLink className="h-4 w-4 opacity-90" />
        </Link>
        <p className="mt-3 text-xs text-muted">
          {t("memberVcIntroLinkHint")}{" "}
          <Link href="/settings" className="text-green-400 hover:underline">
            {t("settings")}
          </Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border border-white/8 p-6 text-sm text-muted", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("memberVcIntroLoading")}
      </div>
    );
  }

  const displayName = profile?.discordDisplayName || profile?.discordUsername;
  const fileLabel = songTitle || (isUploadedIntroPath(url) ? url.split("/").pop() : "");

  return (
    <div className={cn("rounded-xl border border-white/8 bg-white/[0.03] p-6", className)}>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
        <Volume2 className="h-5 w-5 text-green-400" />
        {t("memberVcIntroTitle")}
      </h2>
      <p className="mb-4 text-sm text-muted">{t("memberVcIntroLead")}</p>

      {disabled ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t("memberVcIntroDisabled")}
        </p>
      ) : null}

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-white/8 bg-black/20 p-4">
        {profile?.discordAvatarUrl ? (
          <Image
            src={profile.discordAvatarUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border border-white/10 object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/15 bg-white/5 text-zinc-500">
            <User className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          {displayName ? (
            <>
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              {profile?.discordUsername && profile.discordUsername !== displayName ? (
                <p className="truncate text-xs text-zinc-500">@{profile.discordUsername}</p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-zinc-500">{t("memberVcIntroProfilePending")}</p>
          )}
          <p className="mt-1 text-xs text-emerald-300/90">{t("settingsDiscordLinked")}</p>
        </div>
      </div>

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
        />
        {t("discordVcIntroUserEnabled")}
      </label>

      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setSourceMode("youtube");
            if (isUploadedIntroPath(url)) {
              setUrl("");
              setSongTitle(undefined);
            }
          }}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition",
            sourceMode === "youtube"
              ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/40"
              : "bg-white/5 text-zinc-400 hover:bg-white/10"
          )}
        >
          {t("discordVcIntroSourceYoutube")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setSourceMode("file");
            if (url && !isUploadedIntroPath(url)) {
              setUrl("");
              setSongTitle(undefined);
            }
          }}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition",
            sourceMode === "file"
              ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/40"
              : "bg-white/5 text-zinc-400 hover:bg-white/10"
          )}
        >
          {t("discordVcIntroSourceFile")}
        </button>
      </div>

      {sourceMode === "youtube" ? (
        <input
          type="url"
          value={isUploadedIntroPath(url) ? "" : url}
          disabled={disabled}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted/40 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      ) : (
        <div className="mb-3 space-y-2">
          {fileLabel ? (
            <p className="text-xs text-zinc-400">
              {t("memberVcIntroCurrentFile")}: <span className="text-white">{fileLabel}</span>
            </p>
          ) : null}
          <label
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-sm text-zinc-300 transition hover:border-green-500/40 hover:bg-green-500/5",
              (disabled || uploading) && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? t("discordVcIntroUploading") : t("discordVcIntroUploadFile")}
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      <label className="mb-1 block text-xs text-muted">{t("discordVcIntroUserLabel")}</label>
      <input
        type="text"
        value={label}
        disabled={disabled}
        maxLength={120}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t("discordVcIntroUserLabelPlaceholder")}
        className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted/40 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => void save()}
          className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? t("memberVcIntroSaving") : t("memberVcIntroSave")}
        </button>
        {url ? (
          <button
            type="button"
            disabled={disabled || removing}
            onClick={() => void remove()}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t("memberVcIntroRemove")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
