"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { Loader2, Music, Camera, X, Search } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { proxiedImageUrl } from "@/lib/media-proxy-url";

interface CollaboratorUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Collaborator {
  id: string;
  userId: string;
  user: CollaboratorUser;
}

interface PlaylistEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    isBuiltIn?: boolean;
    isCollaborative?: boolean;
  };
  firstSongCover?: string | null;
  isOwner?: boolean;
  collaborators?: Collaborator[];
  onSuccess?: (data: { title: string; description: string | null; coverImage: string | null; isCollaborative?: boolean }) => void;
  onCollaboratorsChange?: (collaborators: Collaborator[]) => void;
}

export function PlaylistEditModal({
  isOpen,
  onClose,
  playlist,
  firstSongCover,
  isOwner = false,
  collaborators = [],
  onSuccess,
  onCollaboratorsChange,
}: PlaylistEditModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBuiltIn = playlist.isBuiltIn ?? false;
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [coverImage, setCoverImage] = useState(playlist.coverImage ?? "");
  const [isCollaborative, setIsCollaborative] = useState(playlist.isCollaborative ?? false);
  const [collabList, setCollabList] = useState<Collaborator[]>(collaborators);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CollaboratorUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      setTitle(playlist.title);
      setDescription(playlist.description ?? "");
      setCoverImage(playlist.coverImage ?? "");
      setIsCollaborative(playlist.isCollaborative ?? false);
      setCollabList(collaborators);
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen, playlist.title, playlist.description, playlist.coverImage, playlist.isCollaborative, collaborators]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) setCoverImage(dataUrl);
    };
    reader.onerror = () => setError("Fotoğraf okunamadı");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return () => {};
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.users)) {
          const existingIds = new Set(collabList.map((c) => c.userId));
          setSearchResults(data.users.filter((u: CollaboratorUser) => !existingIds.has(u.id)));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, collabList]);

  const handleAddCollaborator = async (user: CollaboratorUser) => {
    if (!playlist.id || addingUserId) return;
    setAddingUserId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        const newCollab = data.id ? data : { id: "", userId: user.id, user };
        const next = [...collabList, newCollab];
        setCollabList(next);
        setSearchQuery("");
        setSearchResults([]);
        onCollaboratorsChange?.(next);
      } else {
        setError(data.error ?? (t("addCollaboratorError") ?? "Eklenemedi"));
      }
    } catch {
      setError(t("connectionError") ?? "Bağlantı hatası");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!playlist.id || removingUserId) return;
    setRemovingUserId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}/collaborators/${userId}`, { method: "DELETE" });
      if (res.ok) {
        const next = collabList.filter((c) => c.userId !== userId);
        setCollabList(next);
        onCollaboratorsChange?.(next);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? (t("removeCollaboratorError") ?? "Çıkarılamadı"));
      }
    } catch {
      setError(t("connectionError") ?? "Bağlantı hatası");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!isBuiltIn && !trimmedTitle) {
      setError(t("playlistTitleRequired") ?? "Başlık gerekli");
      return;
    }

    setSaving(true);
    try {
      const body: { title?: string; description?: string | null; coverImage?: string | null; isCollaborative?: boolean } = {
        description: description.trim() || null,
      };
      if (!isBuiltIn) {
        body.title = trimmedTitle;
        body.coverImage = coverImage.trim() || null;
        body.isCollaborative = isCollaborative;
      }
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? (t("saveError") ?? "Kaydedilemedi"));
        return;
      }

      onSuccess?.({
        title: data.title ?? playlist.title,
        description: data.description ?? null,
        coverImage: data.coverImage ?? playlist.coverImage,
        isCollaborative: data.isCollaborative ?? playlist.isCollaborative,
      });
      onClose();
    } catch {
      setError(t("connectionError") ?? "Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  const useFirstSongCover = () => {
    if (firstSongCover) setCoverImage(firstSongCover);
  };

  return (
    <>
      <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-md">
        <form onSubmit={handleSubmit} className="p-6 pt-12">
          <h2 className="text-xl font-bold text-white">{t("editPlaylist") ?? "Playlisti düzenle"}</h2>
          <p className="mt-1 text-sm text-muted">
            {isBuiltIn
              ? (t("editPlaylistDescBuiltIn") ?? "Sadece açıklamayı değiştirebilirsin")
              : (t("editPlaylistDesc") ?? "İsim ve kapak resmini değiştirebilirsin")}
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <div
                className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/5 ${!isBuiltIn ? "group cursor-pointer transition-colors hover:bg-white/10" : ""}`}
                onClick={!isBuiltIn ? () => fileInputRef.current?.click() : undefined}
              >
                {coverImage ? (
                  coverImage.startsWith("data:") ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${coverImage}")` }}
                    />
                  ) : (
                    <Image
                      src={proxiedImageUrl(coverImage) || coverImage}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                      onError={() => !isBuiltIn && setCoverImage("")}
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="h-10 w-10 text-muted" />
                  </div>
                )}
                {!isBuiltIn && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label htmlFor="playlist-title" className="block text-sm font-medium text-white">
                    {t("playlistName") ?? "İsim"}
                  </label>
                  <input
                    id="playlist-title"
                    type="text"
                    value={title}
                    onChange={(e) => !isBuiltIn && setTitle(e.target.value)}
                    placeholder={t("playlistName") ?? "İsim"}
                    required={!isBuiltIn}
                    disabled={isBuiltIn}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                {!isBuiltIn && firstSongCover && (
                  <button
                    type="button"
                    onClick={useFirstSongCover}
                    className="text-sm text-green-500 transition-colors hover:text-green-400"
                  >
                    {t("useFirstSongCover") ?? "İlk şarkının kapağını kullan"}
                  </button>
                )}
              </div>
            </div>

            {!isBuiltIn && (
              <p className="text-xs text-muted">Kapak fotoğrafına tıklayarak cihazınızdan seçim yapabilirsiniz</p>
            )}

            <div>
              <label htmlFor="playlist-desc" className="block text-sm font-medium text-white">
                {t("description") ?? "Açıklama"}
              </label>
              <textarea
                id="playlist-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("description") ?? "Açıklama"}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
              />
            </div>

            {isOwner && !isBuiltIn && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isCollaborative}
                    onChange={(e) => setIsCollaborative(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-white">
                    {t("collaborativePlaylist") ?? "İşbirlikçi playlist"}
                  </span>
                </label>
                <p className="text-xs text-muted">
                  {t("collaborativePlaylistDesc") ?? "İşbirlikçiler şarkı ekleyip çıkarabilir ve sırayı değiştirebilir"}
                </p>
                {isCollaborative && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t("searchUserToAdd") ?? "Kullanıcı ara..."}
                          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    {searching && (
                      <p className="text-xs text-muted">{t("searching") ?? "Aranıyor..."}</p>
                    )}
                    {searchResults.length > 0 && (
                      <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleAddCollaborator(u)}
                            disabled={addingUserId === u.id}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
                          >
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                              {u.avatar ? (
                                <Image src={u.avatar} alt="" fill sizes="32px" className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted">
                                  <span className="text-xs font-medium">{u.name?.[0] ?? "?"}</span>
                                </div>
                              )}
                            </div>
                            <span className="truncate text-white">{u.name ?? "Kullanıcı"}</span>
                            {addingUserId === u.id && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-green-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                    {collabList.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted">
                          {t("collaborators") ?? "İşbirlikçiler"} ({collabList.length})
                        </p>
                        {collabList.map((c) => (
                          <div
                            key={c.id || c.userId}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                                {c.user.avatar ? (
                                  <Image src={c.user.avatar} alt="" fill sizes="24px" className="object-cover" unoptimized />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                                    {c.user.name?.[0] ?? "?"}
                                  </div>
                                )}
                              </div>
                              <span className="truncate text-sm text-white">{c.user.name ?? "Kullanıcı"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.userId)}
                              disabled={removingUserId === c.userId}
                              className="rounded p-1 text-muted transition-colors hover:bg-white/10 hover:text-red-400 disabled:opacity-50"
                              title={t("remove") ?? "Çıkar"}
                            >
                              {removingUserId === c.userId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              {t("cancel") ?? "İptal"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving") ?? "Kaydediliyor..."}
                </>
              ) : (
                t("save") ?? "Kaydet"
              )}
            </button>
          </div>
        </form>
      </AnimatedModal>
    </>
  );
}
