"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { Loader2 } from "lucide-react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";

interface FollowerUser {
  id: string;
  name: string | null;
  avatar: string | null;
  username?: string | null;
  isFriend?: boolean;
}

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUnfollow?: () => void;
}

export function FollowersListModal({
  isOpen,
  onClose,
  userId,
  onUnfollow,
}: FollowersListModalProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const isOwnProfile = session?.user?.id === userId;

  const handleUnfollow = async (targetUserId: string) => {
    if (!session?.user?.id || !isOwnProfile) return;
    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (res.ok && data.following === false) {
        setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
        onUnfollow?.();
      }
    } catch {}
  };

  const fetchFollowers = useCallback(
    (silent = false) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      setHidden(false);
      fetch(`/api/profile/${userId}/followers`, { credentials: "include" })
        .then((r) => {
          if (r.status === 403) {
            setHidden(true);
            return [];
          }
          return r.ok ? r.json() : [];
        })
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch(() => setUsers([]))
        .finally(() => !silent && setLoading(false));
    },
    [userId]
  );

  useEffect(() => {
    if (isOpen && userId) fetchFollowers();
  }, [isOpen, userId, fetchFollowers]);

  useRefreshInterval(() => isOpen && userId && fetchFollowers(true), 5000, isOpen && !!userId);

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
      <div className="p-6 pt-12">
        <h2 className="text-xl font-bold text-white">Takipçiler</h2>
        <p className="mt-1 text-sm text-muted">
          {isOwnProfile ? "Seni takip eden kullanıcılar" : "Onu takip eden kullanıcılar"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : hidden ? (
          <div className="py-12 text-center text-muted">
            Bu bilgi gizli
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted">
            {isOwnProfile ? "Henüz takipçin yok" : "Henüz takipçisi yok"}
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <Link
                  href={`/profile/${user.username || user.id}`}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name ?? ""}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </div>
                  <span className="truncate font-medium text-white">
                    {user.name ?? "Kullanıcı"}
                  </span>
                </Link>
                {isOwnProfile && user.isFriend && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnfollow(user.id);
                    }}
                    className="relative z-10 flex-shrink-0 cursor-pointer rounded-full border border-emerald-500/60 bg-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:border-emerald-400/80 hover:bg-emerald-500/30"
                  >
                    Arkadaş
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedModal>
  );
}
