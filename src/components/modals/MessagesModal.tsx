"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedModal } from "@/components/ui/animated-modal";
import {
  Loader2,
  Send,
  MessageCircle,
  ChevronLeft,
  Image as ImageIcon,
  ListMusic,
  Music2,
} from "lucide-react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { MessageShareComposer } from "@/components/messages/MessageShareComposer";
import { MessageShareCard } from "@/components/messages/MessageShareCard";
import { chatComposerMotionProps } from "@/components/messages/chatComposerMotion";
import type { MessageSharePayload } from "@/types/messageShare";

interface MessageUser {
  id: string;
  name: string | null;
  avatar: string | null;
  username: string | null;
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
  isOnline?: boolean;
  lastMessage: string;
  lastWasImage?: boolean;
  lastWasShare?: boolean;
  lastShareKind?: "playlist" | "song" | "song_now" | null;
  lastAt: string;
  unreadCount: number;
}

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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

export function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendsWithNoConvo, setFriendsWithNoConvo] = useState<(MessageUser & { isOnline?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MessageUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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
        .then((r) => r.json())
        .then((data) => {
          setMessages(Array.isArray(data) ? data : []);
        })
        .catch(() => setMessages([]))
        .finally(() => !silent && setLoadingMessages(false));
    },
    [selectedUser?.id, session?.user?.id]
  );

  useEffect(() => {
    if (isOpen && session?.user?.id) fetchConversations();
  }, [isOpen, session?.user?.id, fetchConversations]);

  useEffect(() => {
    if (isOpen && selectedUser) fetchMessages();
    else setMessages([]);
  }, [isOpen, selectedUser?.id, fetchMessages]);

  useRefreshInterval(
    () => {
      if (isOpen) {
        fetchConversations(true);
        if (selectedUser) fetchMessages(true);
      }
    },
    5000,
    isOpen
  );

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: selectedUser.id, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
        fetchConversations(true);
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const sendModalDisabled = !newMessage.trim() || sending;
  const sendModalMotion = useMemo(
    () => chatComposerMotionProps(sendModalDisabled, "primary"),
    [sendModalDisabled]
  );

  const allChatUsers: (MessageUser & {
    isOnline?: boolean;
    lastMessage?: string;
    lastWasImage?: boolean;
    lastWasShare?: boolean;
    lastShareKind?: "playlist" | "song" | "song_now" | null;
    lastAt?: string;
    unreadCount?: number;
  })[] = [
    ...conversations.map((c) => ({
      ...c.user,
      isOnline: c.isOnline,
      lastMessage: c.lastMessage,
      lastWasImage: c.lastWasImage,
      lastWasShare: c.lastWasShare,
      lastShareKind: c.lastShareKind,
      lastAt: c.lastAt,
      unreadCount: c.unreadCount,
    })),
    ...friendsWithNoConvo.map((u) => ({
      ...u,
      lastMessage: "",
      lastWasImage: false,
      lastWasShare: false,
      lastShareKind: null,
      lastAt: "",
      unreadCount: 0,
    })),
  ];

  if (!session?.user?.id) return null;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-[85vh] max-h-[700px] w-full max-w-2xl flex-col overflow-hidden"
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Link
                href={`/profile/${selectedUser.username || selectedUser.id}`}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="relative h-10 w-10 flex-shrink-0">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-white/10">
                    {selectedUser.avatar ? (
                      <Image
                        src={selectedUser.avatar}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized={selectedUser.avatar.startsWith("/uploads/") || selectedUser.avatar.startsWith("data:")}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {selectedUser.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  {allChatUsers.find((x) => x.id === selectedUser.id)?.isOnline && (
                    <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 h-3 w-3 rounded-full border-2 border-[#121212] bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.7)]" aria-hidden />
                  )}
                </div>
                <span className="truncate font-semibold text-white">{selectedUser.name ?? "Kullanıcı"}</span>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  Henüz mesaj yok. İlk mesajı sen gönder!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === session.user?.id;
                  const hasImage = !!m.imageUrl;
                  const hasShare = !!m.sharePayload && !hasImage;
                  const caption = m.content?.trim() ?? "";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[75%] flex-col overflow-hidden rounded-2xl ${
                          hasImage ? "p-0" : hasShare ? "p-0" : "px-4 py-2"
                        } ${
                          hasImage
                            ? "bg-white/10 text-white"
                            : hasShare
                              ? "bg-transparent text-white"
                              : isMe
                                ? "bg-green-600 text-white"
                                : "bg-white/10 text-white"
                        }`}
                      >
                        {hasImage && m.imageUrl && (
                          <div className="relative w-full max-h-48 min-h-[100px] bg-black/20">
                            <Image
                              src={m.imageUrl}
                              alt=""
                              width={320}
                              height={240}
                              className="h-auto max-h-48 w-full object-contain"
                              unoptimized={
                                m.imageUrl.startsWith("/uploads/") || m.imageUrl.startsWith("data:")
                              }
                            />
                            <span
                              className="absolute bottom-2 right-2 text-[10px] text-white/95"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {formatMessageTime(m.createdAt)}
                            </span>
                          </div>
                        )}
                        {hasImage && caption ? (
                          <div className="border-t border-white/10 px-3 py-2">
                            <p className="whitespace-pre-wrap break-words text-sm text-white/95">{m.content}</p>
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
                                  <p className="whitespace-pre-wrap break-words text-sm text-white/95">{m.content}</p>
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
                          <>
                            <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                            <p className={`mt-1 text-xs ${isMe ? "text-green-200" : "text-muted"}`}>
                              {formatMessageTime(m.createdAt)}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              <div aria-hidden />
            </div>

            <div className="border-t border-white/10 p-4">
              {sendError && <p className="mb-2 text-center text-xs text-red-400">{sendError}</p>}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <MessageShareComposer
                  receiverId={selectedUser.id}
                  disabled={sending}
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
                  placeholder="Mesaj yaz..."
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
                />
                <motion.button
                  type="submit"
                  disabled={sendModalDisabled}
                  whileHover={sendModalMotion.whileHover}
                  whileTap={sendModalMotion.whileTap}
                  transition={sendModalMotion.transition}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </motion.button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Mesajlar</h2>
              <p className="mt-0.5 text-sm text-muted">Arkadaşlarınla mesajlaş</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted" />
                </div>
              ) : allChatUsers.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Henüz mesajlaşacak arkadaşın yok</p>
                  <p className="mt-1 text-xs">Arkadaş olduğun kişilerle buradan mesajlaşabilirsin</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {allChatUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <span className="absolute inset-0 overflow-hidden rounded-full bg-white/10">
                          {u.avatar ? (
                            <Image
                              src={u.avatar}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized={u.avatar.startsWith("/uploads/") || u.avatar.startsWith("data:")}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                              {u.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                        </span>
                        {u.isOnline && (
                          <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-[#121212] bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" aria-hidden />
                        )}
                        {u.unreadCount !== undefined && u.unreadCount > 0 && (
                          <span className="absolute -bottom-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white shadow-md">
                            {u.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{u.name ?? "Kullanıcı"}</p>
                        {u.lastMessage || u.lastWasImage || u.lastWasShare ? (
                          <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted">
                            {u.lastWasImage ? (
                              <>
                                <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" aria-hidden />
                                {u.lastMessage ? (
                                  <span className="truncate">{u.lastMessage}</span>
                                ) : (
                                  <span>Fotoğraf</span>
                                )}
                              </>
                            ) : u.lastWasShare ? (
                              <>
                                {u.lastShareKind === "playlist" ? (
                                  <ListMusic className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" aria-hidden />
                                ) : (
                                  <Music2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" aria-hidden />
                                )}
                                <span className="truncate">
                                  {u.lastMessage
                                    ? u.lastMessage
                                    : u.lastShareKind === "playlist"
                                      ? "Playlist"
                                      : "Şarkı"}
                                </span>
                              </>
                            ) : (
                              <span className="truncate">{u.lastMessage}</span>
                            )}
                          </p>
                        ) : (
                          <p className={`truncate text-sm ${u.isOnline ? "font-medium text-emerald-400/95" : "text-muted"}`}>
                            {u.isOnline ? "Çevrimiçi" : "Henüz mesaj yok"}
                          </p>
                        )}
                      </div>
                      {u.lastAt && (
                        <span className="flex-shrink-0 text-xs text-muted">
                          {formatTime(u.lastAt)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AnimatedModal>
  );
}
