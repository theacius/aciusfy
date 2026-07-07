"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import {
  Settings,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Play,
  Music2,
  Pencil,
  X,
  Trash2,
  Loader2,
  MessageCircle,
  Ban,
  Sparkles,
  Link2,
  BarChart3,
  Crown,
} from "lucide-react";
import { FollowingListModal } from "@/components/modals/FollowingListModal";
import { FollowersListModal } from "@/components/modals/FollowersListModal";
import { usePlayerStore } from "@/store/playerStore";
import { useQueueStore } from "@/store/queueStore";
import { formatDuration } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { showErrorToast } from "@/store/toastStore";
import { BadgeGrid } from "@/components/badges/BadgeGrid";
import { AvatarFrame, getAvatarFrameReservedBox, type DecorationData } from "@/components/profile/AvatarFrame";
import { DecorationPicker } from "@/components/profile/DecorationPicker";
import { ProfileTitleChip } from "@/components/profile/ProfileTitleChip";
import { StevenActionMenu } from "@/components/navigation/StevenActionMenu";
import { TitlePicker } from "@/components/profile/TitlePicker";
import type { ProfileTitlePublic } from "@/lib/profile-title-public";
import type { SongType } from "@/types";

interface TopArtist {
  id: string;
  name: string;
  profileImage: string | null;
}

interface TopTrack {
  id: string;
  title: string;
  duration: number;
  coverImage: string | null;
  audioUrl: string;
  artist: { id: string; name: string } | null;
}

export interface ProfileData {
  id: string;
  name: string | null;
  email?: string;
  avatar: string | null;
  bio?: string | null;
  followerCount: number | null;
  followingCount: number | null;
  isPrivate?: boolean;
  profilePlaylistsVisible?: boolean;
  canSeePrivate?: boolean;
  isOnline?: boolean;
  decoration?: DecorationData | null;
  title?: ProfileTitlePublic | null;
}

interface ProfileContentProps {
  userId: string;
  initialProfile: ProfileData;
}

export function ProfileContent({ userId, initialProfile }: ProfileContentProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isMobileLayout = useIsMobile();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [profilePlaylists, setProfilePlaylists] = useState<{ id: string; title: string; coverImage: string | null; songCount: number }[]>([]);
  const [decorationPickerOpen, setDecorationPickerOpen] = useState(false);
  const [titlePickerOpen, setTitlePickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownMenuOpen, setOwnMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const isOwnProfile = session?.user?.id === userId;
  const isFriend = following && (profile.canSeePrivate ?? false);
  const setActiveSong = usePlayerStore((s) => s.setActiveSong);

  // Sync only when viewing a different profile. Re-running on every `initialProfile` rerender resets
  // decoration/title to stale SSR data while equip updates live on the client.
  useEffect(() => {
    setProfile(initialProfile);
    setEditName(initialProfile.name ?? "");
    setEditBio(initialProfile.bio ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid RSC churn wiping equip state
  }, [userId]);

  useEffect(() => {
    if (!session?.user?.id || !userId || isOwnProfile) return;

    fetch(`/api/follow-user?userId=${encodeURIComponent(userId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setFollowing(data.following === true))
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [session?.user?.id, userId, isOwnProfile]);

  useEffect(() => {
    if (!session?.user?.id || !userId || isOwnProfile) return;
    fetch(`/api/block/check?userId=${encodeURIComponent(userId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsBlocked(data.blocked === true))
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [session?.user?.id, userId, isOwnProfile]);

  const refetchTopStats = useCallback(() => {
    if (!isOwnProfile) return;
    fetch("/api/profile/top-stats")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          setTopArtists(data.topArtists ?? []);
          setTopTracks(data.topTracks ?? []);
        }
      })
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [isOwnProfile]);

  const refetchProfilePlaylists = useCallback(() => {
    if (!(profile.profilePlaylistsVisible ?? true)) return;
    if (profile.isPrivate && !(profile.canSeePrivate ?? isOwnProfile)) return;
    fetch(`/api/profile/${userId}/playlists`, { credentials: "include" })
      .then((r) => r.ok && r.json())
      .then((data) => setProfilePlaylists(Array.isArray(data) ? data : []))
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [userId, profile.profilePlaylistsVisible, profile.isPrivate, profile.canSeePrivate, isOwnProfile]);

  useEffect(() => {
    if (!(profile.profilePlaylistsVisible ?? true)) {
      setProfilePlaylists([]);
      return;
    }
    if (profile.isPrivate && !(profile.canSeePrivate ?? isOwnProfile)) {
      setProfilePlaylists([]);
      return;
    }
    fetch(`/api/profile/${userId}/playlists`, { credentials: "include" })
      .then((r) => r.ok && r.json())
      .then((data) => setProfilePlaylists(Array.isArray(data) ? data : []))
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [userId, profile.profilePlaylistsVisible, profile.isPrivate, profile.canSeePrivate, isOwnProfile]);

  useEffect(() => {
    refetchTopStats();
  }, [refetchTopStats]);

  const refetchProfile = useCallback(() => {
    if (!isOwnProfile) return;
    fetch("/api/profile", { credentials: "include", cache: "no-store" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          setProfile((p) =>
            p
              ? {
                  ...p,
                  name: data.name,
                  email: data.email,
                  avatar: data.avatar,
                  bio: data.bio,
                  followerCount: data.followerCount ?? 0,
                  followingCount: data.followingCount ?? 0,
                  isPrivate: data.isPrivate,
                  profilePlaylistsVisible: data.profilePlaylistsVisible,
                  isOnline: typeof data.isOnline === "boolean" ? data.isOnline : p.isOnline,
                  decoration: "decoration" in data ? (data as { decoration?: ProfileData["decoration"] }).decoration ?? null : p.decoration,
                  title: "title" in data ? (data as { title?: ProfileData["title"] }).title ?? null : p.title,
                }
              : p
          );
          setEditName(data.name ?? "");
          setEditBio(data.bio ?? "");
        }
      })
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [isOwnProfile]);

  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  useEffect(() => {
    if (!isOwnProfile) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refetchProfile();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isOwnProfile, refetchProfile]);

  const refetchViewedProfile = useCallback(() => {
    if (isOwnProfile) return;
    fetch(`/api/profile/${userId}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data)
          setProfile((p) =>
            p
              ? {
                  ...p,
                  name: data.name ?? p.name,
                  avatar: data.avatar ?? p.avatar,
                  bio: data.bio ?? p.bio,
                  followerCount: data.followerCount ?? p.followerCount,
                  followingCount: data.followingCount ?? p.followingCount,
                  canSeePrivate: data.canSeePrivate ?? p.canSeePrivate,
                  profilePlaylistsVisible: data.profilePlaylistsVisible ?? p.profilePlaylistsVisible,
                  isPrivate: data.isPrivate ?? p.isPrivate,
                  isOnline: typeof data.isOnline === "boolean" ? data.isOnline : p.isOnline,
                }
              : p
          );
      })
      .catch(() => showErrorToast(t("profileLoadError")));
  }, [userId, isOwnProfile]);

  useRefreshInterval(refetchProfile, 5000, isOwnProfile);
  useRefreshInterval(refetchTopStats, 5000, isOwnProfile);
  useRefreshInterval(refetchProfilePlaylists, 5000, !!(profile.profilePlaylistsVisible ?? true) && !(profile.isPrivate && !(profile.canSeePrivate ?? isOwnProfile)));
  useRefreshInterval(refetchViewedProfile, 5000, !isOwnProfile && !!userId);

  const handleFollowToggle = async () => {
    if (!session?.user?.id || isOwnProfile || followLoading) return;

    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        if (!profile.isPrivate) {
          setProfile((p) => ({
            ...p,
            followerCount: Math.max(0, (p.followerCount ?? 0) + (data.following ? 1 : -1)),
          }));
        }
        refetchViewedProfile();
      }
    } catch {
      showErrorToast(t("followFailed"));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName.trim() || null, bio: editBio.trim() || null }),
      });
      const data = await res.json();
      if (res.ok && data) {
        setProfile((p) => (p ? { ...p, name: data.name ?? p.name, avatar: data.avatar ?? p.avatar, bio: data.bio ?? p.bio } : p));
        setEditMode(false);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("user-profile-updated"));
      }
    } catch {
      showErrorToast(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (!dataUrl.startsWith("data:image/")) return;
      setSaving(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatar: dataUrl }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; avatar?: string | null };
        if (res.ok && data.avatar != null) {
          setProfile((p) => (p ? { ...p, avatar: data.avatar as string | null } : p));
          if (typeof window !== "undefined") window.dispatchEvent(new Event("user-profile-updated"));
        } else {
          showErrorToast(data?.error || t("saveFailed"));
        }
      } catch {
        showErrorToast(t("saveFailed"));
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBlockToggle = async () => {
    if (!session?.user?.id || isOwnProfile || blockLoading) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        const res = await fetch(`/api/block?userId=${encodeURIComponent(userId)}`, { method: "DELETE", credentials: "include" });
        const data = await res.json();
        if (res.ok && data.blocked === false) setIsBlocked(false);
      } else {
        const res = await fetch("/api/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok && data.blocked) setIsBlocked(true);
      }
      setMenuOpen(false);
    } catch {
      showErrorToast(t("blockFailed"));
    } finally {
      setBlockLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!isOwnProfile || deletingPlaylistId) return;
    if (!confirm("Bu çalma listesini silmek istediğinize emin misiniz?")) return;
    setDeletingPlaylistId(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setProfilePlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      }
    } catch {
      showErrorToast(t("deleteFailed"));
    } finally {
      setDeletingPlaylistId(null);
    }
  };

  const playTrack = (track: TopTrack) => {
    const song: SongType = {
      id: track.id,
      title: track.title,
      duration: track.duration,
      coverImage: track.coverImage,
      previewVideoUrl: null,
      artistId: track.artist?.id ?? "",
      albumId: null,
      genreId: null,
      audioUrl: track.audioUrl,
      playCount: 0,
      isPublished: true,
      createdAt: new Date(),
      artist: track.artist
        ? {
            id: track.artist.id,
            name: track.artist.name,
            userId: "",
            bio: null,
            profileImage: null,
            bannerImage: null,
            verified: false,
            monthlyListeners: 0,
            createdAt: new Date(),
          }
        : undefined,
      album: undefined,
    };
    useQueueStore.getState().clearPlaylistPlayback();
    setActiveSong(song);
  };

  if (!profile) return null;

  const avatarSize = isMobileLayout ? 96 : 128;
  const avatarReserve = getAvatarFrameReservedBox(avatarSize);

  return (
    <div className="space-y-8 pb-12 sm:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div
            className={`relative flex flex-shrink-0 items-center justify-center ${editMode ? "cursor-pointer" : ""}`}
            style={{
              width: avatarReserve.w,
              height: avatarReserve.h,
              minWidth: avatarReserve.w,
              minHeight: avatarReserve.h,
            }}
          >
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <AvatarFrame
              src={profile.avatar}
              alt={profile.name ?? "Profil"}
              fallbackInitial={profile.name?.[0]?.toUpperCase() ?? session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              size={avatarSize}
              decoration={profile.decoration}
              onClick={editMode ? () => avatarInputRef.current?.click() : undefined}
            >
              {editMode && (
                <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <Pencil className="h-8 w-8 text-white" />
                </div>
              )}
              {profile.isOnline && (
                <span
                  className="pointer-events-none absolute -right-0.5 -top-0.5 z-30 h-4 w-4 rounded-full border-2 border-[#0a0a0a] bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.65)]"
                  title={t("onlinePresenceBadge")}
                  aria-label={t("onlinePresenceBadge")}
                />
              )}
            </AvatarFrame>
          </div>
          <div className="w-full min-w-0 flex-1 text-center sm:text-left">
            {editMode ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wider text-white/30">Profil</p>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="İsim"
                  className="mt-2 w-full rounded-xl border-0 bg-white/[0.04] px-4 py-2.5 text-xl font-bold text-white ring-1 ring-white/[0.08] placeholder:text-white/20 focus:outline-none focus:ring-purple-500/50 sm:text-2xl"
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Kendinizi tanıtın..."
                  rows={3}
                  maxLength={500}
                  className="mt-2 w-full resize-none rounded-xl border-0 bg-white/[0.04] px-4 py-2.5 text-sm text-white ring-1 ring-white/[0.08] placeholder:text-white/20 focus:outline-none focus:ring-purple-500/50"
                />
                <p className="mt-1 text-xs text-white/20">{editBio.length}/500</p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wider text-white/30">Profil</p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="max-w-full break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                    {profile.name ?? session?.user?.name ?? "Kullanıcı"}
                  </h1>
                  <ProfileTitleChip title={profile.title ?? null} className="mt-0.5 sm:mt-1" />
                </div>
                {profile.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-white/40 sm:text-left">{profile.bio}</p>
                )}
            {!(profile.isPrivate && !(profile.canSeePrivate ?? isOwnProfile)) && (
              <div className="mt-3 flex flex-col gap-1">
                {profile.isPrivate && isOwnProfile && (
                      <span className="text-xs text-white/25">Hesabınız Gizli</span>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/40 sm:justify-start">
                      <button
                        type="button"
                        onClick={() => setFollowersModalOpen(true)}
                        className="text-left transition-colors hover:text-white"
                      >
                        <span className="font-bold text-white">{profile.followerCount ?? 0}</span> takipçi
                      </button>
                      <button
                        type="button"
                        onClick={() => setFollowingModalOpen(true)}
                        className="text-left transition-colors hover:text-white"
                      >
                        <span className="font-bold text-white">{profile.followingCount ?? 0}</span> takip edilen
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mt-3 flex justify-center sm:justify-start">
              <BadgeGrid userId={userId} />
            </div>
            {!editMode && isOwnProfile ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/70 ring-1 ring-white/[0.08] transition-all hover:bg-white/[0.08] hover:text-white sm:px-5 sm:py-2.5"
                >
                  <Pencil className="h-4 w-4" />
                  Profilini düzenle
                </button>
                <button
                  type="button"
                  onClick={() => setDecorationPickerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 ring-1 ring-purple-500/20 transition-all hover:bg-purple-500/20 hover:text-purple-300 sm:px-5 sm:py-2.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Çerçeve
                </button>
                <button
                  type="button"
                  onClick={() => setTitlePickerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20 transition-all hover:bg-amber-500/20 hover:text-amber-300 sm:px-5 sm:py-2.5"
                >
                  <Crown className="h-4 w-4" />
                  Ünvan
                </button>
              </div>
            ) : editMode && isOwnProfile ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setEditName(profile.name ?? "");
                    setEditBio(profile.bio ?? "");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                  İptal
                </button>
              </div>
            ) : session?.user?.id ? (
              <>
                {following && (profile.canSeePrivate ?? false) ? (
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-5 py-2 text-sm font-medium text-green-400 transition-colors hover:border-green-400/60 hover:bg-green-500/20 disabled:opacity-60"
                  >
                    Arkadaş
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                      following
                        ? "border border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/10"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {following ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Takibi bırak
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Takip et
                      </>
                    )}
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 self-end sm:self-start">
          {editMode && isOwnProfile && (
            <span className="rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-400">
              Düzenleme Modu
            </span>
          )}
          {isOwnProfile && !editMode && (
            <>
              <Link
                href="/settings"
                className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Ayarlar"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setOwnMenuOpen(true)}
                className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Daha fazla"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </>
          )}
          {!isOwnProfile && session?.user?.id && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Seçenekler"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <>
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Bu ayın en çok dinlenen sanatçıları
                </h2>
                <p className="mt-1 text-sm text-muted">Yalnızca sana görünür</p>
              </div>
              {topArtists.length > 0 && (
                <Link
                  href="/stats"
                  className="text-sm font-medium text-muted transition-colors hover:text-white"
                >
                  Tümünü göster
                </Link>
              )}
            </div>
            {topArtists.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {topArtists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.id}`}
                    className="group flex w-40 flex-shrink-0 flex-col items-center"
                  >
                    <div className="relative h-40 w-40 overflow-hidden rounded-full bg-white/10">
                      {artist.profileImage ? (
                        <Image
                          src={proxiedImageUrl(artist.profileImage) || "/images/placeholder-song.svg"}
                          alt={artist.name}
                          fill
                          sizes="160px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music2 className="h-16 w-16 text-white/40" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 truncate w-full text-center font-medium text-white">
                      {artist.name}
                    </p>
                    <p className="text-sm text-muted">Sanatçı</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
                <p className="text-muted">Bu ay henüz dinleme geçmişin yok</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Bu ayın en çok dinlenen parçaları
                </h2>
                <p className="mt-1 text-sm text-muted">Yalnızca sana görünür</p>
              </div>
              {topTracks.length > 0 && (
                <Link
                  href="/stats"
                  className="text-sm font-medium text-muted transition-colors hover:text-white"
                >
                  Tümünü göster
                </Link>
              )}
            </div>
            {topTracks.length > 0 ? (
              <div className="space-y-1">
                {topTracks.map((track, index) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className="group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="w-6 text-center text-sm text-muted group-hover:hidden">
                      {index + 1}
                    </span>
                    <Play className="hidden h-4 w-4 w-6 text-white group-hover:block" />
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-white/10">
                      {proxiedImageUrl(track.coverImage) ? (
                        <Image
                          src={proxiedImageUrl(track.coverImage)!}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music2 className="h-6 w-6 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{track.title}</p>
                      <p className="truncate text-sm text-muted">
                        {track.artist?.name ?? "Bilinmeyen"}
                      </p>
                    </div>
                    <span className="text-sm text-muted">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
                <p className="text-muted">Bu ay henüz dinleme geçmişin yok</p>
              </div>
            )}
          </section>

        </>
      )}

      {profile.isPrivate && !(profile.canSeePrivate ?? isOwnProfile) ? (
        <section>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-24 text-center">
            <p className="text-lg font-medium text-muted">Bu Hesap Gizli</p>
            <p className="mt-1 text-sm text-muted">
              Bu kullanıcının çalma listelerini görmek için birbirinizi takip edin (arkadaş olun).
            </p>
          </div>
        </section>
      ) : (profile.profilePlaylistsVisible ?? true) ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white">
              {isOwnProfile ? "Profilindeki çalma listeleri" : "Çalma listeleri"}
            </h2>
          </div>
          {profilePlaylists.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {profilePlaylists.map((pl) => (
                <div key={pl.id} className="group relative flex flex-col">
                  <Link
                    href={editMode ? "#" : `/playlist/${pl.id}`}
                    onClick={editMode ? (e) => e.preventDefault() : undefined}
                    className="flex flex-col"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/10">
                      {proxiedImageUrl(pl.coverImage) ? (
                        <Image
                          src={proxiedImageUrl(pl.coverImage)!}
                          alt={pl.title}
                          fill
                          sizes="(max-width:640px) 50vw, 20vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music2 className="h-16 w-16 text-white/40" />
                        </div>
                      )}
                      {editMode && isOwnProfile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeletePlaylist(pl.id);
                          }}
                          disabled={deletingPlaylistId === pl.id}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                          title="Çalma listesini sil"
                        >
                          {deletingPlaylistId === pl.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="mt-2 truncate font-medium text-white">{pl.title}</p>
                    <p className="text-sm text-muted">{pl.songCount} parça</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-muted">
                {isOwnProfile ? "Profilinde görünecek çalma listesi yok" : "Henüz çalma listesi yok"}
              </p>
            </div>
          )}
        </section>
      ) : null}

      <FollowingListModal
        isOpen={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        userId={userId}
        onUnfollow={() => {
          if (isOwnProfile) {
            setProfile((p) => (p ? { ...p, followingCount: Math.max(0, (p.followingCount ?? 0) - 1) } : p));
          }
        }}
      />
      <FollowersListModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        userId={userId}
        onUnfollow={() => {
          if (isOwnProfile) {
            setProfile((p) => (p ? { ...p, followingCount: Math.max(0, (p.followingCount ?? 0) - 1) } : p));
          }
        }}
      />
      {isOwnProfile && (
        <>
          <DecorationPicker
            open={decorationPickerOpen}
            onClose={() => setDecorationPickerOpen(false)}
            userAvatar={profile.avatar}
            userName={profile.name}
            activeDecorationId={profile.decoration?.id ?? null}
            onEquip={(dec) => {
              setProfile((p) => ({ ...p, decoration: dec }));
              if (typeof window !== "undefined") window.dispatchEvent(new Event("user-profile-updated"));
            }}
          />
          <TitlePicker
            open={titlePickerOpen}
            onClose={() => setTitlePickerOpen(false)}
            activeTitleId={profile.title?.id ?? null}
            onEquip={(t) => {
              setProfile((p) => ({ ...p, title: t }));
              if (typeof window !== "undefined") window.dispatchEvent(new Event("user-profile-updated"));
            }}
          />
        </>
      )}

      <StevenActionMenu
        open={ownMenuOpen}
        onClose={() => setOwnMenuOpen(false)}
        title="Profilim"
        subtitle={profile.name ?? undefined}
        closeLabel="Kapat"
        items={[
          {
            id: "stats",
            label: "İstatistikler",
            icon: BarChart3,
            href: "/stats",
            onNavigate: () => setOwnMenuOpen(false),
          },
          {
            id: "copy",
            label: "Profil linkini kopyala",
            icon: Link2,
            onClick: () => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${userId}`;
              void navigator.clipboard?.writeText(url);
              setOwnMenuOpen(false);
            },
          },
        ]}
      />

      <StevenActionMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Profil"
        subtitle={profile.name ?? undefined}
        closeLabel="Kapat"
        items={[
          {
            id: "message",
            label: "Mesaj gönder",
            icon: MessageCircle,
            href: `/messages?userId=${userId}`,
            onNavigate: () => setMenuOpen(false),
          },
          {
            id: "block",
            label: isBlocked ? "Engeli kaldır" : "Engelle",
            icon: Ban,
            destructive: !isBlocked,
            onClick: () => void handleBlockToggle(),
          },
        ]}
      />
    </div>
  );
}
