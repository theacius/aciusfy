import { devLog, devWarn, devError } from "@/lib/dev-log";
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Send,
  MessageCircle,
  ChevronLeft,
  ImagePlus,
  Search,
  Circle,
  MoreHorizontal,
  BellOff,
  Pin,
  X,
  Download,
  Music2,
  ListMusic,
  Image as ImageIcon,
} from "lucide-react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotificationStore } from "@/store/notificationStore";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import { MessageShareComposer } from "@/components/messages/MessageShareComposer";
import { MessageShareCard } from "@/components/messages/MessageShareCard";
import { chatComposerMotionProps } from "@/components/messages/chatComposerMotion";
import type { MessageSharePayload } from "@/types/messageShare";
import { UserAvatarWithDecoration } from "@/components/profile/UserAvatarWithDecoration";
import type { DecorationData } from "@/components/profile/AvatarFrame";
import { InlineBadgeStrip } from "@/components/profile/InlineBadgeStrip";
import { ProfileTitleChip } from "@/components/profile/ProfileTitleChip";
import type { ProfileTitlePublic } from "@/lib/profile-title-public";
import { MessagesStevenMenus } from "@/components/messages/MessagesStevenMenus";
import { StevenAutocompletePanel } from "@/components/ui/StevenAutocompletePanel";

interface MessageUser {
  id: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
  decoration?: DecorationData | null;
  title?: ProfileTitlePublic | null;
}

interface Message {
  id: string;
  content: string;
  imageUrl?: string | null;
  sharePayload?: MessageSharePayload | null;
  senderId: string;
  receiverId: string;
  readAt: string | null;
  createdAt: string;
  sender: MessageUser;
  receiver: MessageUser;
}

interface Conversation {
  user: MessageUser;
  isOnline?: boolean
  lastMessage: string;
  lastWasImage?: boolean
  lastWasShare?: boolean;
  lastShareKind?: "playlist" | "song" | "song_now" | null;
  lastAt: string;
  unreadCount: number;
  blockedByMe?: boolean;
  blockedMe?: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Şimdi";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk`;
  if (diff < 86400000) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function getDateSeparatorLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((todayStart.getTime() - msgStart.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays === 2) return "2 gün önce";
  if (diffDays === 3) return "3 gün önce";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

function isSameDay(a: string, b: string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const CUSTOM_MUTE_UNITS = [
  { value: "dakika" as const, label: "Dakika", max: 60 },
  { value: "saat" as const, label: "Saat", max: 24 },
  { value: "gün" as const, label: "Gün", max: null },
  { value: "hafta" as const, label: "Hafta", max: null },
  { value: "ay" as const, label: "Ay", max: null },
  { value: "yıl" as const, label: "Yıl", max: null },
] as const;

const PINNED_CONVOS_STORAGE_KEY = "aciusfy-pinned-convos";

function loadPinnedOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_CONVOS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function savePinnedOrder(ids: string[]) {
  try {
    localStorage.setItem(PINNED_CONVOS_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

function getCustomMuteUntil(value: number, unit: (typeof CUSTOM_MUTE_UNITS)[number]["value"]): string {
  const now = Date.now();
  const d = new Date(now);
  switch (unit) {
    case "dakika":
      return new Date(now + value * 60 * 1000).toISOString();
    case "saat":
      return new Date(now + value * 60 * 60 * 1000).toISOString();
    case "gün":
      return new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
    case "hafta":
      return new Date(now + value * 7 * 24 * 60 * 60 * 1000).toISOString();
    case "ay":
      d.setMonth(d.getMonth() + value);
      return d.toISOString();
    case "yıl":
      d.setFullYear(d.getFullYear() + value);
      return d.toISOString();
  }
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendsWithNoConvo, setFriendsWithNoConvo] = useState<(MessageUser & { isOnline?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MessageUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messageImageInputRef = useRef<HTMLInputElement>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<MessageUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const debouncedUserSearch = useDebounce(userSearchQuery, 300);
  const setMuted = useNotificationStore((s) => s.setMuted);
  const isMuted = useNotificationStore((s) => s.isMuted);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [openChatHeaderMenu, setOpenChatHeaderMenu] = useState(false);
  const [showMuteSubmenuChat, setShowMuteSubmenuChat] = useState(false);
  const [customMuteUserId, setCustomMuteUserId] = useState<string | null>(null);
  const [customMuteValue, setCustomMuteValue] = useState(30);
  const [customMuteUnit, setCustomMuteUnit] = useState<"dakika" | "saat" | "gün" | "hafta" | "ay" | "yıl">("dakika");
  const [blockLoading, setBlockLoading] = useState(false);
  const [selectedUserBlockedByMe, setSelectedUserBlockedByMe] = useState(false);
  const [selectedUserBlockedMe, setSelectedUserBlockedMe] = useState(false);
  const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);
  const [listActionLoading, setListActionLoading] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [peerListening, setPeerListening] = useState<{ title: string; artistName: string | null } | null>(null);

  useEffect(() => {
    setPinnedOrder(loadPinnedOrder());
  }, []);

  useEffect(() => {
    if (!lightboxImageUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImageUrl(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxImageUrl]);

  const fetchPeerListening = useCallback(async () => {
    if (!selectedUser?.id || selectedUserBlockedMe) {
      setPeerListening(null);
      return;
    }
    try {
      const r = await fetch(`/api/users/${encodeURIComponent(selectedUser.id)}/listening`, {
        credentials: "include",
      });
      const d = await r.json().catch(() => ({}));
      if (d?.listening?.song) {
        setPeerListening({
          title: d.listening.song.title as string,
          artistName: d.listening.artist?.name ?? null,
        });
      } else {
        setPeerListening(null);
      }
    } catch {
      setPeerListening(null);
    }
  }, [selectedUser?.id, selectedUserBlockedMe]);

  useEffect(() => {
    void fetchPeerListening();
  }, [fetchPeerListening]);

  useRefreshInterval(fetchPeerListening, 12000, !!selectedUser?.id && !selectedUserBlockedMe);

  const fetchConversations = useCallback(
    (silent = false) => {
      if (!session?.user?.id) return;
      if (!silent) setLoading(true);
      fetch("/api/messages", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          setConversations(data.conversations ?? []);
          setFriendsWithNoConvo(data.friendsWithNoConvo ?? []);
        })
        .catch(() => {
          setConversations([]);
          setFriendsWithNoConvo([]);
        })
        .finally(() => !silent && setLoading(false));
    },
    [session?.user?.id]
  );

  const fetchMessages = useCallback(
    (silent = false) => {
      if (!selectedUser?.id || !session?.user?.id) return;
      if (!silent) setLoadingMessages(true);
      fetch(`/api/messages?userId=${encodeURIComponent(selectedUser.id)}`, {
        credentials: "include",
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          return { ok: r.ok, status: r.status, data };
        })
        .then(({ ok, status, data }) => {
          if (ok) setMessages(Array.isArray(data) ? data : []);
          else if (status === 500) devError("[messages 500]", data);
        })
        .catch((err) => {
          setMessages([]);
          devError("[messages fetch]", err);
        })
        .finally(() => !silent && setLoadingMessages(false));
    },
    [selectedUser?.id, session?.user?.id]
  );

  useEffect(() => {
    if (session?.user?.id) fetchConversations();
  }, [session?.user?.id, fetchConversations]);

  useEffect(() => {
    if (!session?.user?.id || !debouncedUserSearch || debouncedUserSearch.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setUserSearchLoading(true);
    fetch(`/api/users/search?q=${encodeURIComponent(debouncedUserSearch)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUserSearchResults(Array.isArray(data?.users) ? data.users : []))
      .catch(() => setUserSearchResults([]))
      .finally(() => setUserSearchLoading(false));
  }, [debouncedUserSearch, session?.user?.id]);

  useEffect(() => {
    if (!userIdParam) return;
    const fromConvo = conversations.find((c) => c.user.id === userIdParam);
    const fromFriend = friendsWithNoConvo.find((f) => f.id === userIdParam);
    const user = fromConvo?.user ?? fromFriend ?? null;
    if (user) {
      setSelectedUser(user);
      return;
    }
    fetch(`/api/profile/${userIdParam}`, { credentials: "include" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          setSelectedUser({
            id: userIdParam,
            name: data.name ?? null,
            avatar: data.avatar ?? null,
            username: data.username ?? data.id ?? null,
            decoration: data.decoration ?? null,
            title: data.title ?? null,
          });
        } else {
          setSelectedUser({
            id: userIdParam,
            name: null,
            avatar: null,
            username: null,
            decoration: null,
            title: null,
          });
        }
      })
      .catch(() => {
        setSelectedUser({
          id: userIdParam,
          name: null,
          avatar: null,
          username: null,
          decoration: null,
          title: null,
        });
      });
  }, [userIdParam, conversations, friendsWithNoConvo]);

  useEffect(() => {
    if (selectedUser) fetchMessages();
    else setMessages([]);
  }, [selectedUser?.id, fetchMessages]);

  useEffect(() => {
    if (!selectedUser?.id || !session?.user?.id) {
      setSelectedUserBlockedByMe(false);
      setSelectedUserBlockedMe(false);
      return;
    }
    const fromConvo = conversations.find((c) => c.user.id === selectedUser.id);
    if (fromConvo) {
      setSelectedUserBlockedByMe(fromConvo.blockedByMe ?? false);
      setSelectedUserBlockedMe(fromConvo.blockedMe ?? false);
      return;
    }
    fetch(`/api/block/check?userId=${encodeURIComponent(selectedUser.id)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSelectedUserBlockedByMe(data.blocked === true);
        setSelectedUserBlockedMe(data.blockedMe === true);
      })
      .catch(() => {
        setSelectedUserBlockedByMe(false);
        setSelectedUserBlockedMe(false);
      });
  }, [selectedUser?.id, session?.user?.id, conversations]);

  useRefreshInterval(
    () => {
      fetchConversations(true);
      if (selectedUser) fetchMessages(true);
    },
    5000,
    true
  );

  const handleBlock = async (targetUserId: string) => {
    if (!session?.user?.id || blockLoading) return;
    if (!confirm("Bu kullanıcıyı engellemek istediğinize emin misiniz?")) return;
    setBlockLoading(true);
    try {
      const res = await fetch("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        setOpenMenuUserId(null);
        setOpenChatHeaderMenu(false);
        fetchConversations(true);
        if (selectedUser?.id === targetUserId) setSelectedUserBlockedByMe(true);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const togglePinConversation = useCallback((userId: string) => {
    setPinnedOrder((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [userId, ...prev.filter((id) => id !== userId)];
      savePinnedOrder(next);
      return next;
    });
    setOpenMenuUserId(null);
    setShowMuteSubmenu(false);
  }, []);

  const handleMarkUnread = async (targetUserId: string) => {
    if (!session?.user?.id || listActionLoading) return;
    setListActionLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "markUnread", userId: targetUserId }),
      });
      if (res.ok) {
        setOpenMenuUserId(null);
        setShowMuteSubmenu(false);
        fetchConversations(true);
      }
    } finally {
      setListActionLoading(false);
    }
  };

  const handleDeleteConversation = async (targetUserId: string) => {
    if (!session?.user?.id || listActionLoading) return;
    if (!confirm("Bu sohbeti silmek istediğinize emin misiniz? Tüm mesajlar kalıcı olarak silinir.")) return;
    setListActionLoading(true);
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(targetUserId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setOpenMenuUserId(null);
        setShowMuteSubmenu(false);
        setPinnedOrder((prev) => {
          const next = prev.filter((id) => id !== targetUserId);
          savePinnedOrder(next);
          return next;
        });
        fetchConversations(true);
        if (selectedUser?.id === targetUserId) {
          setSelectedUser(null);
          setMessages([]);
          router.replace("/messages");
        }
      }
    } finally {
      setListActionLoading(false);
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    if (!session?.user?.id || blockLoading) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/block?userId=${encodeURIComponent(targetUserId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setOpenMenuUserId(null);
        setOpenChatHeaderMenu(false);
        fetchConversations(true);
        if (selectedUser?.id === targetUserId) setSelectedUserBlockedByMe(false);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending || uploadingImage) return;
    const receiverId = selectedUser?.id ?? userIdParam;
    if (!receiverId) {
      setSendError("Alıcı yükleniyor, lütfen bekleyin...");
      return;
    }
    setSendError(null);
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
        fetchConversations(true);
      } else {
        setSendError(data?.error ?? "Mesaj gönderilemedi");
      }
    } catch (err) {
      setSendError("Bağlantı hatası");
    } finally {
      setSending(false);
    }
  };

  const handlePickMessageImage = () => {
    if (selectedUserBlockedByMe || selectedUserBlockedMe || uploadingImage || sending) return;
    messageImageInputRef.current?.click();
  };

  const handleMessageImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const receiverId = selectedUser?.id ?? userIdParam;
    if (!receiverId) {
      setSendError("Alıcı yükleniyor, lütfen bekleyin...");
      return;
    }
    setSendError(null);
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload/message-image", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData?.url) {
        setSendError(upData?.error ?? "Görsel yüklenemedi");
        return;
      }
      const caption = newMessage.trim();
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId,
          content: caption,
          imageUrl: upData.url as string,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
        fetchConversations(true);
      } else {
        setSendError(data?.error ?? "Mesaj gönderilemedi");
      }
    } catch {
      setSendError("Bağlantı hatası");
    } finally {
      setUploadingImage(false);
    }
  };

  const allChatUsers = useMemo(
    () =>
      [
        ...conversations.map((c) => ({
          ...c.user,
          isOnline: c.isOnline,
          lastMessage: c.lastMessage,
          lastWasImage: c.lastWasImage,
          lastWasShare: c.lastWasShare,
          lastShareKind: c.lastShareKind,
          lastAt: c.lastAt,
          unreadCount: c.unreadCount,
          blockedByMe: c.blockedByMe,
          blockedMe: c.blockedMe,
        })),
        ...friendsWithNoConvo.map((u) => ({
          ...u,
          isOnline: u.isOnline,
          lastMessage: "",
          lastWasImage: false,
          lastWasShare: false,
          lastShareKind: null,
          lastAt: "",
          unreadCount: 0,
        })),
      ] as (MessageUser & {
        isOnline?: boolean;
        lastMessage?: string;
        lastWasImage?: boolean;
        lastWasShare?: boolean;
        lastShareKind?: "playlist" | "song" | "song_now" | null;
        lastAt?: string;
        unreadCount?: number;
        blockedByMe?: boolean;
        blockedMe?: boolean;
      })[],
    [conversations, friendsWithNoConvo]
  );

  const sortedChatUsers = useMemo(() => {
    const users = allChatUsers;
    const pinnedIds = pinnedOrder.filter((id) => users.some((u) => u.id === id));
    const pinnedSet = new Set(pinnedIds);
    const rest = users.filter((u) => !pinnedSet.has(u.id));
    rest.sort((a, b) => {
      const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return tb - ta;
    });
    const pinnedUsers = pinnedIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is (typeof users)[number] => u != null);
    return [...pinnedUsers, ...rest];
  }, [allChatUsers, pinnedOrder]);

  const listMenuUser = useMemo(
    () => (openMenuUserId ? sortedChatUsers.find((u) => u.id === openMenuUserId) ?? null : null),
    [openMenuUserId, sortedChatUsers],
  );

  const selectedPresence = useMemo(
    () => sortedChatUsers.find((u) => u.id === selectedUser?.id),
    [sortedChatUsers, selectedUser?.id]
  );
  const headerIsOnline = selectedPresence?.isOnline === true;

  const photoComposerDisabled =
    !(selectedUser || userIdParam) ||
    selectedUserBlockedByMe ||
    selectedUserBlockedMe ||
    uploadingImage ||
    sending;
  const sendComposerDisabled =
    !(selectedUser || userIdParam) ||
    !newMessage.trim() ||
    sending ||
    uploadingImage ||
    selectedUserBlockedByMe ||
    selectedUserBlockedMe;

  const photoBtnMotion = useMemo(
    () => chatComposerMotionProps(photoComposerDisabled, "ghost"),
    [photoComposerDisabled]
  );
  const sendBtnMotion = useMemo(
    () => chatComposerMotionProps(sendComposerDisabled, "primary"),
    [sendComposerDisabled]
  );

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted">Mesajlaşmak için giriş yapın</p>
      </div>
    );
  }

  const showChatView = selectedUser || userIdParam;

  return (
    <div className="-mx-6 -my-4 flex min-h-0 flex-1 flex-col overflow-hidden bg-[#09090b] w-[calc(100%+3rem)] max-w-none">
      {showChatView ? (
        <>
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={() => { window.location.href = "/messages"; }}
              className="flex-shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Geri"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {selectedUser ? (
              <>
                {selectedUserBlockedMe ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                      <span className="text-base font-bold text-white">?</span>
                    </div>
                    <span className="truncate text-lg font-semibold text-muted">Aciusfy kullanıcısı</span>
                  </div>
                ) : (
                  <Link
                    href={`/profile/${selectedUser.username || selectedUser.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <UserAvatarWithDecoration
                      src={selectedUser.avatar}
                      name={selectedUser.name}
                      size={44}
                      decoration={selectedUser.decoration ?? null}
                      isOnline={headerIsOnline}
                      onlineTitle={t("onlinePresenceBadge")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1.5">
                        <span className="truncate pt-0.5 text-lg font-semibold text-white">
                          {selectedUser.name ?? "Kullanıcı"}
                        </span>
                        <div className="pt-0.5">
                          <ProfileTitleChip title={selectedUser.title ?? null} />
                        </div>
                        <InlineBadgeStrip userId={selectedUser.id} className="max-w-full" />
                      </div>
                      {peerListening ? (
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-green-400/90">
                          <Music2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                          <span className="truncate">
                            {peerListening.title}
                            {peerListening.artistName ? ` · ${peerListening.artistName}` : ""}
                          </span>
                        </span>
                      ) : headerIsOnline ? (
                        <span className="mt-0.5 block text-xs font-medium text-emerald-400/95">{t("onlinePresenceBadge")}</span>
                      ) : null}
                    </div>
                  </Link>
                )}
                {!selectedUserBlockedMe && (
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenChatHeaderMenu(true);
                      setShowMuteSubmenuChat(false);
                    }}
                    className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Sohbet seçenekleri"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                )}
              </>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-full bg-white/10" />
                <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-6 py-4">
            {!selectedUser ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-muted">
                Henüz mesaj yok. İlk mesajı sen gönder!
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.senderId === session.user?.id;
                const prevMsg = messages[idx - 1];
                const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, m.createdAt);
                const hasImage = !!m.imageUrl;
                const hasShare = !!m.sharePayload && !hasImage;
                const caption = m.content?.trim() ?? "";
                return (
                  <div key={m.id} className="space-y-1">
                    {showDateSeparator && (
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="flex-shrink-0 text-xs text-muted">
                          {getDateSeparatorLabel(m.createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex max-w-[min(85%,420px)] flex-col overflow-hidden rounded-2xl ${
                          hasImage ? "p-0" : hasShare ? "p-0" : "px-4 py-2"
                        } ${
                          hasImage
                            ? "bg-white/[0.04] text-white ring-1 ring-white/[0.06]"
                            : hasShare
                              ? "bg-transparent text-white"
                              : isMe
                                ? "bg-white text-[#09090b]"
                                : "bg-white/[0.06] text-white ring-1 ring-white/[0.06]"
                        }`}
                      >
                        {hasImage && (
                          <button
                            type="button"
                            className="relative w-full max-h-[min(50vh,360px)] min-h-[120px] cursor-zoom-in bg-black/20 text-left outline-none ring-offset-2 ring-offset-[#121212] focus-visible:ring-2 focus-visible:ring-green-500"
                            onClick={() => setLightboxImageUrl(m.imageUrl!)}
                            aria-label="Görseli büyüt"
                          >
                            <Image
                              src={m.imageUrl!}
                              alt=""
                              width={420}
                              height={360}
                              className="pointer-events-none h-auto max-h-[min(50vh,360px)] w-full object-contain"
                              unoptimized={
                                m.imageUrl!.startsWith("/uploads/") || m.imageUrl!.startsWith("data:")
                              }
                            />
                            
                            <div
                              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
                              aria-hidden
                            />
                            <span
                              className="pointer-events-none absolute bottom-2 right-2 z-10 text-[10px] text-white/95"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatMessageTime(m.createdAt)}
                            </span>
                          </button>
                        )}
                        {hasImage && caption ? (
                          <div className="border-t border-white/10 px-3 py-2">
                            <p className="min-w-0 whitespace-pre-wrap break-words text-sm text-white/95">
                              {m.content}
                            </p>
                          </div>
                        ) : null}
                        {hasShare && m.sharePayload ? (
                          <div className={caption ? "px-2 pt-2" : "p-2"}>
                            <MessageShareCard
                              payload={m.sharePayload}
                              isMe={isMe}
                              createdAt={m.createdAt}
                              hideFooterTime={!!caption}
                            />
                            {caption ? (
                              <>
                                <div className="mt-1 border-t border-white/10 px-2 pb-1 pt-2">
                                  <p className="min-w-0 whitespace-pre-wrap break-words text-sm text-white/95">
                                    {m.content}
                                  </p>
                                </div>
                                <div className="flex justify-end px-2 pb-2">
                                  <span
                                    className="text-[10px] text-white/50"
                                    style={{ fontVariantNumeric: "tabular-nums" }}
                                  >
                                    {formatMessageTime(m.createdAt)}
                                  </span>
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        {!hasImage && !hasShare ? (
                          <div className="flex items-end justify-end gap-2">
                            {caption ? (
                              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">
                                {m.content}
                              </p>
                            ) : (
                              <span className="min-w-0 flex-1" aria-hidden />
                            )}
                            <span
                              className={`flex-shrink-0 self-end text-[10px] ${
                                isMe ? "text-green-100/80" : "text-white/60"
                              }`}
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatMessageTime(m.createdAt)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div aria-hidden />
          </div>

          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            {sendError && (
              <p className="mb-2 text-center text-xs text-red-400">{sendError}</p>
            )}
            {selectedUserBlockedByMe && (
              <p className="mb-2 text-center text-xs text-muted">Bu kullanıcıyı engellediniz. Mesaj gönderemezsiniz.</p>
            )}
            {selectedUserBlockedMe && (
              <p className="mb-2 text-center text-xs text-muted">Bu kullanıcı sizi engelledi. Mesaj gönderemezsiniz.</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={messageImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleMessageImageSelected}
              />
              <motion.button
                type="button"
                title="Fotoğraf gönder"
                disabled={photoComposerDisabled}
                onClick={handlePickMessageImage}
                whileHover={photoBtnMotion.whileHover}
                whileTap={photoBtnMotion.whileTap}
                transition={photoBtnMotion.transition}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </motion.button>
              <MessageShareComposer
                receiverId={selectedUser?.id ?? userIdParam ?? null}
                disabled={
                  !(selectedUser || userIdParam) ||
                  selectedUserBlockedByMe ||
                  selectedUserBlockedMe ||
                  uploadingImage ||
                  sending
                }
                caption={newMessage}
                onSent={(created) => {
                  if (created && typeof created === "object" && created !== null && "id" in created) {
                    setMessages((prev) => [...prev, created as Message]);
                  } else {
                    fetchMessages(true);
                  }
                  setNewMessage("");
                  fetchConversations(true);
                }}
                onError={(msg) => setSendError(msg)}
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (sendError) setSendError(null);
                }}
                placeholder={
                  selectedUserBlockedByMe
                    ? "Engeli açarak mesaj gönderebilirsiniz"
                    : selectedUserBlockedMe
                      ? "Mesaj gönderemezsiniz"
                      : "Mesaj veya fotoğraf için altyazı…"
                }
                maxLength={2000}
                disabled={selectedUserBlockedByMe || selectedUserBlockedMe || uploadingImage}
                className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-base text-white placeholder:text-muted focus:border-green-600 focus:outline-none disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={sendComposerDisabled}
                whileHover={sendBtnMotion.whileHover}
                whileTap={sendBtnMotion.whileTap}
                transition={sendBtnMotion.transition}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#09090b] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </motion.button>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="shrink-0 border-b border-white/10 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Mesajlar</h1>
            <div className="relative mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Kullanıcı Ara"
                  className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/16 focus:outline-none"
                />
              </div>
            </div>
            {userSearchQuery.length >= 2 && (
              <div className="relative -mx-2 mt-2">
                <StevenAutocompletePanel
                  open
                  isEmpty={!userSearchLoading && userSearchResults.length === 0}
                  empty={<p className="px-4 py-3 text-sm text-white/45">Kullanıcı bulunamadı</p>}
                >
                  {userSearchLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                    </div>
                  ) : (
                    userSearchResults.map((u) => (
                      <Link
                        key={u.id}
                        href={`/messages?userId=${u.id}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                        onClick={() => {
                          setUserSearchQuery("");
                          setUserSearchResults([]);
                        }}
                      >
                        <UserAvatarWithDecoration
                          src={u.avatar}
                          name={u.name}
                          size={40}
                          decoration={u.decoration ?? null}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">{u.name ?? "Kullanıcı"}</p>
                          {u.username && <p className="truncate text-xs text-white/45">@{u.username}</p>}
                        </div>
                      </Link>
                    ))
                  )}
                </StevenAutocompletePanel>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
              </div>
            ) : sortedChatUsers.length === 0 ? (
              <div className="py-12 text-center text-muted">
                <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>Henüz mesajlaşma yok</p>
                <p className="mt-1 text-xs">Yukarıdan kullanıcı ara ve mesajlaşmaya başla</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {sortedChatUsers.map((u) => (
                  <div
                    key={u.id}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04]"
                    onContextMenuCapture={(e) => {
                      e.preventDefault();
                      setOpenMenuUserId(u.id);
                      setShowMuteSubmenu(false);
                    }}
                  >
                    <Link
                      href={`/messages?userId=${u.id}`}
                      className="flex min-w-0 flex-1 items-center gap-4"
                    >
                      <UserAvatarWithDecoration
                        src={u.avatar}
                        name={u.name}
                        size={48}
                        decoration={u.decoration ?? null}
                        isOnline={u.isOnline}
                        onlineTitle={t("onlinePresenceBadge")}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-white">
                          {pinnedOrder.includes(u.id) && (
                            <Pin className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" aria-label="Üste sabitlendi" />
                          )}
                          <span className={`min-w-0 truncate ${(u.unreadCount ?? 0) > 0 ? "font-bold" : ""}`}>
                            {u.name ?? "Kullanıcı"}
                          </span>
                          {"title" in u && u.title ? <ProfileTitleChip title={u.title} className="max-w-[140px] scale-90" /> : null}
                          {isMuted(u.id) && (
                            <BellOff className="h-3.5 w-3.5 flex-shrink-0 text-muted" aria-label="Bildirimler sessize alındı" />
                          )}
                        </p>
                        {(u.lastMessage || u.lastWasImage || u.lastWasShare || u.lastAt) ? (
                          <p className={`flex items-center gap-1.5 text-sm ${(u.unreadCount ?? 0) > 0 ? "font-bold text-white" : "text-muted"}`}>
                            {(u.lastMessage || u.lastWasImage || u.lastWasShare) && (
                              u.lastWasImage ? (
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" aria-hidden />
                                  {u.lastMessage ? (
                                    <span className="min-w-0 truncate" title={u.lastMessage}>
                                      {u.lastMessage.length > 15 ? `${u.lastMessage.slice(0, 15)}...` : u.lastMessage}
                                    </span>
                                  ) : (
                                    <span>Fotoğraf</span>
                                  )}
                                </span>
                              ) : u.lastWasShare ? (
                                <span className="flex min-w-0 items-center gap-1.5">
                                  {u.lastShareKind === "playlist" ? (
                                    <ListMusic className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400 opacity-90" aria-hidden />
                                  ) : (
                                    <Music2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400 opacity-90" aria-hidden />
                                  )}
                                  <span className="min-w-0 truncate" title={u.lastMessage}>
                                    {u.lastMessage
                                      ? u.lastMessage.length > 15
                                        ? `${u.lastMessage.slice(0, 15)}...`
                                        : u.lastMessage
                                      : u.lastShareKind === "playlist"
                                        ? "Playlist"
                                        : "Şarkı"}
                                  </span>
                                </span>
                              ) : (
                                <span className="min-w-0 truncate" title={u.lastMessage}>
                                  {u.lastMessage && (u.lastMessage.length > 15 ? `${u.lastMessage.slice(0, 15)}...` : u.lastMessage)}
                                </span>
                              )
                            )}
                            {(u.lastMessage || u.lastWasImage || u.lastWasShare) && u.lastAt && (
                              <Circle className={`h-[3px] w-[3px] flex-shrink-0 fill-current ${(u.unreadCount ?? 0) > 0 ? "text-white" : "text-muted"}`} />
                            )}
                            {u.lastAt && (
                              <span className={`flex-shrink-0 text-xs ${(u.unreadCount ?? 0) > 0 ? "text-white" : "text-muted"}`}>{formatTime(u.lastAt)}</span>
                            )}
                          </p>
                        ) : (
                          <p className={`text-sm ${u.isOnline ? "font-medium text-emerald-400/95" : "text-muted"}`}>
                            {u.isOnline ? t("onlinePresenceBadge") : t("messagesListNoMessagesYet")}
                          </p>
                        )}
                      </div>
                      {(u.unreadCount ?? 0) > 0 && (
                        <div className="flex flex-shrink-0 items-center self-center">
                          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500/60" />
                        </div>
                      )}
                    </Link>
                    <div className="relative flex flex-shrink-0 items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMenuUserId(u.id);
                          setShowMuteSubmenu(false);
                        }}
                        className="rounded-full p-2 text-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
                        aria-label="Sohbet seçenekleri"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <MessagesStevenMenus
        chatMenuOpen={openChatHeaderMenu}
        onChatMenuClose={() => setOpenChatHeaderMenu(false)}
        chatMuteSubmenu={showMuteSubmenuChat}
        onChatMuteSubmenu={setShowMuteSubmenuChat}
        selectedUser={
          selectedUser
            ? {
                id: selectedUser.id,
                name: selectedUser.name,
                blockedByMe: selectedUserBlockedByMe,
              }
            : null
        }
        listMenuUserId={openMenuUserId}
        listMenuUser={
          listMenuUser
            ? {
                id: listMenuUser.id,
                name: listMenuUser.name,
                blockedByMe: listMenuUser.blockedByMe,
              }
            : null
        }
        onListMenuClose={() => setOpenMenuUserId(null)}
        listMuteSubmenu={showMuteSubmenu}
        onListMuteSubmenu={setShowMuteSubmenu}
        isPinned={(id) => pinnedOrder.includes(id)}
        isMuted={isMuted}
        setMuted={setMuted}
        onOpenCustomMute={(userId) => {
          setCustomMuteUserId(userId);
          setCustomMuteValue(30);
          setCustomMuteUnit("dakika");
        }}
        blockLoading={blockLoading}
        listActionLoading={listActionLoading}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onDeleteConversation={handleDeleteConversation}
        onTogglePin={togglePinConversation}
        onMarkUnread={handleMarkUnread}
        customMuteUserId={customMuteUserId}
        onCustomMuteClose={() => setCustomMuteUserId(null)}
        customMuteValue={customMuteValue}
        onCustomMuteValueChange={setCustomMuteValue}
        customMuteUnit={customMuteUnit}
        onCustomMuteUnitChange={(v) => {
          setCustomMuteUnit(v as (typeof CUSTOM_MUTE_UNITS)[number]["value"]);
          const unitInfo = CUSTOM_MUTE_UNITS.find((u) => u.value === v);
          if (unitInfo?.max != null && customMuteValue > unitInfo.max) {
            setCustomMuteValue(unitInfo.max);
          }
        }}
        onCustomMuteApply={() => {
          if (!customMuteUserId) return;
          const unitInfo = CUSTOM_MUTE_UNITS.find((u) => u.value === customMuteUnit);
          let val = customMuteValue;
          if (unitInfo?.max != null && val > unitInfo.max) val = unitInfo.max;
          if (val < 1) val = 1;
          setMuted(customMuteUserId, getCustomMuteUntil(val, customMuteUnit));
          setCustomMuteUserId(null);
        }}
        customMuteUnits={CUSTOM_MUTE_UNITS}
      />

      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          role="presentation"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="absolute right-4 top-4 z-[310] flex flex-row-reverse items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={lightboxImageUrl}
              download={lightboxImageUrl.split("/").pop() ?? "resim"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              title="İndir"
              aria-label="İndir"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              title="Kapat"
              aria-label="Kapat"
              onClick={() => setLightboxImageUrl(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <img
            src={lightboxImageUrl}
            alt=""
            className="max-h-[min(92vh,100%)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
