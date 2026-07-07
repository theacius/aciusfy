"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";

interface CommentUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface PlaylistCommentsProps {
  playlistId: string;
  isOwner: boolean;
}

export function PlaylistComments({ playlistId, isOwner }: PlaylistCommentsProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(
    (silent = false) => {
      if (!playlistId) return;
      if (!silent) setLoading(true);
      fetch(`/api/playlists/${playlistId}/comments`)
        .then((r) => r.json())
        .then((data) => setComments(Array.isArray(data.comments) ? data.comments : []))
        .catch(() => setComments([]))
        .finally(() => !silent && setLoading(false));
    },
    [playlistId]
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useRefreshInterval(() => fetchComments(true), 5000, !!playlistId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submitting || !session?.user) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data, ...prev]);
        setNewComment("");
      } else {
        alert(data.error ?? (t("commentAddError") ?? "Yorum eklenemedi"));
      }
    } catch {
      alert(t("connectionError") ?? "Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? (t("commentDeleteError") ?? "Yorum silinemedi"));
      }
    } catch {
      alert(t("connectionError") ?? "Bağlantı hatası");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return t("justNow") ?? "Az önce";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t("minAgo") ?? "dk önce"}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t("hourAgo") ?? "sa önce"}`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} ${t("dayAgo") ?? "gün önce"}`;
    return d.toLocaleDateString();
  };

  return (
    <ScrollReveal delay={0.2}>
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <MessageCircle className="h-5 w-5 text-muted" />
          {t("comments") ?? "Yorumlar"} ({comments.length})
        </h2>

        {session?.user && (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
              {session.user.image ? (
                <Image src={session.user.image} alt="" fill sizes="40px" className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                  {session.user.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("writeComment") ?? "Yorum yaz..."}
                maxLength={2000}
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {session?.user
              ? (t("noCommentsYet") ?? "Henüz yorum yok. İlk yorumu sen yap!")
              : (t("loginToComment") ?? "Yorum yapmak için giriş yap")}
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const canDelete = session?.user?.id === c.user.id || isOwner;
              return (
                <div
                  key={c.id}
                  className="flex gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                    {c.user.avatar ? (
                      <Image src={c.user.avatar} alt="" fill sizes="32px" className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                        {c.user.name?.[0] ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{c.user.name ?? t("user")}</span>
                      <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/90">{c.content}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="flex-shrink-0 rounded p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-red-400 disabled:opacity-50"
                      title={t("delete") ?? "Sil"}
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
