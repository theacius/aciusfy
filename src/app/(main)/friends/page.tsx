"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Music2, MessageCircle, Link2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { showSuccessToast } from "@/store/toastStore";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { UserAvatarWithDecoration } from "@/components/profile/UserAvatarWithDecoration";
import type { DecorationData } from "@/components/profile/AvatarFrame";
import { ProfileTitleChip } from "@/components/profile/ProfileTitleChip";
import type { ProfileTitlePublic } from "@/lib/profile-title-public";

type FriendRow = {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    username: string | null;
    isOnline?: boolean;
    decoration?: DecorationData | null;
    title?: ProfileTitlePublic | null;
  };
  listening: {
    song: { id: string; title: string; coverImage: string | null; duration: number };
    artist: { id: string; name: string } | null;
    updatedAt: string;
  } | null;
};

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfilePath, setMyProfilePath] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object") {
          const u = (d as { username?: string | null; id?: string }).username
            || (d as { id?: string }).id;
          if (u && typeof window !== "undefined") {
            setMyProfilePath(`${window.location.origin}/profile/${encodeURIComponent(String(u))}`);
          }
        }
      })
      .catch(() => {});
  }, [status]);

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const r = await fetch("/api/friends/listening", { credentials: "include" });
      const data = await r.json().catch(() => ({}));
      setRows(Array.isArray(data?.friends) ? data.friends : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Arkadaşları görmek için giriş yapın.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("friends")}</h1>
          <p className="mt-1 text-sm text-muted">{t("friendsPageSubtitle")}</p>
        </div>
        {myProfilePath && (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(myProfilePath).then(() => {
                showSuccessToast(t("friendsProfileLinkCopied"));
              });
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10"
          >
            <Link2 className="h-3.5 w-3.5" />
            {t("friendsCopyProfileLink")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-muted">{t("friendsEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ user, listening }) => (
            <li
              key={user.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.07]"
            >
              <Link
                href={`/profile/${user.username || user.id}`}
                className="flex flex-shrink-0 items-center justify-center"
              >
                <UserAvatarWithDecoration
                  src={user.avatar}
                  name={user.name}
                  size={56}
                  decoration={user.decoration ?? null}
                  isOnline={user.isOnline}
                  onlineTitle={t("onlinePresenceBadge")}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link href={`/profile/${user.username || user.id}`} className="truncate font-semibold text-white hover:underline">
                    {user.name ?? "Kullanıcı"}
                  </Link>
                  <ProfileTitleChip title={user.title ?? null} />
                </div>
                {listening ? (
                  <div className="mt-1 flex items-start gap-2">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/10">
                      {proxiedImageUrl(listening.song.coverImage) ? (
                        <Image
                          src={proxiedImageUrl(listening.song.coverImage)!}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music2 className="h-4 w-4 text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-green-400/90">{t("friendsListeningNow")}</p>
                      <p className="truncate text-sm text-white">{listening.song.title}</p>
                      {listening.artist && <p className="truncate text-xs text-muted">{listening.artist.name}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted">—</p>
                )}
              </div>
              <Link
                href={`/messages?userId=${encodeURIComponent(user.id)}`}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-muted transition-colors hover:bg-white/20 hover:text-white"
                title="Mesaj"
                aria-label="Mesaj gönder"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
