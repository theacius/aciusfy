import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/components/providers/UserProfileProvider";
import { showErrorToast } from "@/store/toastStore";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { Plus, Search, Loader2, X, Link2, Check, Users, Trash2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnimatedModal } from "@/components/ui/animated-modal";

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  isFriend?: boolean;
}

interface BlendItem {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  matchPercentage: number | null;
  creator: { id: string; name: string | null; avatar: string | null };
  invited: { id: string; name: string | null; avatar: string | null };
  playlist?: { id: string; title: string } | null;
}

export default function BlendInvitePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();

  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [blends, setBlends] = useState<BlendItem[]>([]);
  const [blendsLoading, setBlendsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const profile = useUserProfile();
  const userAvatar = profile?.avatar || session?.user?.image || null;
  const userName = profile?.name || session?.user?.name || "User";

  const fetchBlends = useCallback(() => {
    fetch("/api/blend")
      .then((r) => r.json())
      .then((d) => setBlends(d.blends ?? []))
      .catch(() => {})
      .finally(() => setBlendsLoading(false));
  }, []);

  useEffect(() => {
    fetchBlends();
    const interval = setInterval(fetchBlends, 5000);
    return () => clearInterval(interval);
  }, [fetchBlends]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    setTokenLoading(true);
    fetch("/api/blend/invite-token", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status !== 401) {
            devWarn("[blend] invite-token HTTP", r.status);
          }
          return;
        }
        const d = (await r.json()) as { token?: string | null };
        if (!cancelled) setInviteToken(d.token ?? null);
      })
      .catch((e) => {
        devError("[blend] invite-token", e);
        showErrorToast(t("blendLoadError"));
      })
      .finally(() => {
        if (!cancelled) setTokenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, t]);

  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/blend/search-users?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => {
          const list: SearchUser[] = d.users ?? [];
          const friends: SearchUser[] = (d.friends ?? []).map((f: SearchUser) => ({ ...f, isFriend: true }));
          const friendIds = new Set(friends.map((f) => f.id));
          const nonFriends = list.filter((u) => !friendIds.has(u.id));
          setUsers([...friends, ...nonFriends]);
        })
        .catch(() => setUsers([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, showSearch]);

  const sendInvite = useCallback(async (invitedId: string) => {
    setSending(true);
    try {
      const res = await fetch("/api/blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/blend/${data.id}`);
      } else if (res.status === 409 && data.blendId) {
        router.push(`/blend/${data.blendId}`);
      }
    } catch { showErrorToast(t("actionFailed")); }
    setSending(false);
  }, [router, t]);

  const deleteBlend = useCallback(async (blendId: string) => {
    if (!confirm("Bu blend'i silmek istediğine emin misin?")) return;
    setDeletingId(blendId);
    try {
      const res = await fetch(`/api/blend/${blendId}`, { method: "DELETE" });
      if (res.ok) {
        setBlends((prev) => prev.filter((b) => b.id !== blendId));
      }
    } catch { showErrorToast(t("deleteFailed")); }
    setDeletingId(null);
  }, [t]);

  const copyBlendLink = useCallback(() => {
    if (!inviteToken) return;
    const url = `${window.location.origin}/blend/invite/${inviteToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => showErrorToast(t("copyFailed")));
  }, [inviteToken, t]);

  const userId = session?.user?.id;

  return (
    <div className="-mx-3 -my-3 flex min-h-[calc(100dvh-var(--navbar-height)-var(--main-content-bottom-padding))] flex-col bg-[#09090b] sm:-mx-6 sm:-my-4">

      
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
        
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/[0.04] blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -30, 20, 0], y: [0, 30, -30, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-white/[0.03] blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, 20, -10, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/[0.02] blur-[80px]"
          />
        </div>

        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mb-10 flex items-center"
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-full bg-white/10 opacity-50 blur-sm transition-opacity group-hover:opacity-75" />
            <div className="relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-[#09090b] md:h-40 md:w-40">
              {userAvatar ? (
                <Image
                  src={proxiedImageUrl(userAvatar) || "/images/placeholder-song.svg"}
                  alt={userName}
                  fill
                  sizes="160px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl font-black text-white">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInviteOptions(true)}
            className="relative -ml-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/5 ring-4 ring-[#09090b] backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 md:-ml-8 md:h-40 md:w-40"
          >
            <Plus className="h-10 w-10 text-white/60 md:h-12 md:w-12" />
          </motion.button>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Blend
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {t("blendInviteFriendsTitle")}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/40 md:text-base">
            {t("blendInviteFriendsDesc")}
          </p>
        </motion.div>

        
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInviteOptions(true)}
          className="relative z-10 group flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#09090b] transition-opacity hover:opacity-90"
        >
          {t("blendInviteBtn")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      </div>

      
      {!blendsLoading && blends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full px-4 pb-12"
        >
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Blend&apos;lerin
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-2">
              {blends.map((b, i) => {
                const other = b.creator.id === userId ? b.invited : b.creator;
                return (
                  <Link key={b.id} href={`/blend/${b.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
                      className="group flex items-center gap-4 rounded-2xl bg-white/[0.02] px-4 py-3.5 ring-1 ring-white/5 transition-all hover:ring-white/10"
                    >
                      
                      <div className="flex -space-x-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#1a1a1a]">
                          {userAvatar ? (
                            <Image src={proxiedImageUrl(userAvatar)!} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-bold text-white">
                              {userName[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#1a1a1a]">
                          {other.avatar ? (
                            <Image src={proxiedImageUrl(other.avatar)!} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/[0.08] text-xs font-bold text-white">
                              {(other.name || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {userName} + {other.name || "User"}
                        </p>
                        <p className="text-xs text-white/35">
                          {b.status === "PENDING" && (
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                              {t("blendPending")}
                            </span>
                          )}
                          {b.status === "ACCEPTED" && (b.matchPercentage != null ? `%${b.matchPercentage} uyum` : t("blendAccepted"))}
                          {b.status === "DECLINED" && t("blendDeclined")}
                        </p>
                      </div>

                      
                      {b.status === "ACCEPTED" && b.matchPercentage != null && (
                        <div className="rounded-full bg-white/[0.06] px-3 py-1 ring-1 ring-white/10">
                          <span className="text-xs font-bold text-white/80">%{b.matchPercentage}</span>
                        </div>
                      )}

                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteBlend(b.id);
                        }}
                        disabled={deletingId === b.id}
                        className="rounded-full p-2 text-white/15 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                        title="Blend'i sil"
                      >
                        {deletingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>

                      
                      <ArrowRight className="h-4 w-4 text-white/15 transition-all group-hover:text-white/40 group-hover:translate-x-0.5" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      
      {!blendsLoading && blends.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-12 text-center"
        >
          <p className="text-xs text-white/20">Henüz bir blend oluşturmadın</p>
        </motion.div>
      )}

      
      <AnimatedModal
        isOpen={showInviteOptions}
        onClose={() => setShowInviteOptions(false)}
        title={t("blendInviteOptions")}
        className="max-w-md"
      >
        <div className="space-y-1 px-3 pb-5 pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyBlendLink}
            disabled={tokenLoading || !inviteToken}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
              {tokenLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              ) : copied ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="h-5 w-5 text-white/80" />
                </motion.div>
              ) : (
                <Link2 className="h-5 w-5 text-white/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {copied ? t("blendCopied") : t("blendCopyLink")}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-white/35">
                {inviteToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/blend/invite/${inviteToken}` : "..."}
              </p>
            </div>
          </motion.button>

          <div className="mx-4 h-px bg-white/[0.06]" />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowInviteOptions(false);
              setShowSearch(true);
            }}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]">
              <Users className="h-5 w-5 text-white/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{t("blendInviteFriend")}</p>
              <p className="mt-0.5 text-[11px] text-white/35">{t("blendSearchUsers")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/25" />
          </motion.button>
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearch("");
        }}
        title={t("blendSelectUser")}
        className="max-w-md"
      >
        <div className="flex flex-col">
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("blendSearchUsers")}
                autoFocus
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-white/16"
              />
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto px-3 pb-4">
            {searching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="mb-3 h-10 w-10 text-white/10" />
                <p className="text-sm text-white/35">{t("blendNoUsers")}</p>
              </div>
            ) : (
              <>
                {users.some((u) => u.isFriend) && (
                  <p className="mb-1 px-3 pt-2 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    {t("friends")}
                  </p>
                )}
                {users.filter((u) => u.isFriend).map((u) => (
                  <UserRow key={u.id} user={u} sending={sending} onInvite={sendInvite} t={t} />
                ))}
                {users.some((u) => u.isFriend) && users.some((u) => !u.isFriend) && (
                  <div className="my-2 ml-3 mr-3 h-px bg-white/[0.06]" />
                )}
                {users.some((u) => !u.isFriend) && (
                  <p className="mb-1 px-3 pt-2 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    Tüm kullanıcılar
                  </p>
                )}
                {users.filter((u) => !u.isFriend).map((u) => (
                  <UserRow key={u.id} user={u} sending={sending} onInvite={sendInvite} t={t} />
                ))}
              </>
            )}
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}

function UserRow({ user: u, sending, onInvite, t }: {
  user: SearchUser;
  sending: boolean;
  onInvite: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
      whileTap={{ scale: 0.98 }}
      disabled={sending}
      onClick={() => onInvite(u.id)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors disabled:opacity-50"
    >
      <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
        {u.avatar ? (
          <Image src={u.avatar} alt={u.name || ""} fill sizes="44px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm font-bold text-white">
            {(u.name || "?")[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{u.name || u.username || "User"}</p>
          {u.isFriend && (
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white/70 ring-1 ring-white/10">
              {t("friends")}
            </span>
          )}
        </div>
        {u.username && <p className="truncate text-[11px] text-white/30">@{u.username}</p>}
      </div>
      <motion.span
        whileHover={{ scale: 1.05 }}
        className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/10 hover:ring-white/25"
      >
        {t("blendInviteBtn")}
      </motion.span>
    </motion.button>
  );
}
