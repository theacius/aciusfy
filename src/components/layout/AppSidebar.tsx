"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Home,
  Heart,
  Compass,
  ListMusic,
  Plus,
  Music2,
  Library,
  Shield,
  LayoutDashboard,
  Mic2,
  Settings,
  BarChart3,
  Users,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Blend,
  Disc3,
  Download,
  Radio,
  ShoppingBag,
  CalendarDays,
  Link2,
} from "lucide-react";
import { proxiedImageUrl } from "@/lib/media-proxy-url";
import { PlaylistContextMenu } from "@/components/ui/playlist-context-menu";
import { SavedSectionContextMenu } from "@/components/ui/saved-section-context-menu";
import { PlaylistType } from "@/types";
import { useSettingsStore } from "@/store/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { StevenActionMenu, type StevenActionItem } from "@/components/navigation/StevenActionMenu";

const SIDEBAR_PLAYLIST_HINT_DISMISS_KEY = "aciusfy-dismiss-sidebar-playlist-hint";

function useMainNav() {
  const { t } = useTranslation();
  return [
    { label: t("mainMenu"), href: "/home", icon: Home },
    { label: t("browse"), href: "/search", icon: Compass },
    { label: t("smartRadio"), href: "/radio", icon: Radio },
    { label: t("lyricsNav"), href: "/lyrics", icon: Mic2 },
    { label: t("stats"), href: "/stats", icon: BarChart3 },
    { label: t("whatsNew"), href: "/whats-new", icon: Disc3 },
    { label: t("friends"), href: "/friends", icon: Users },
    { label: t("shop"), href: "/shop", icon: ShoppingBag },
    { label: t("dailyQuestsNav"), href: "/rewards", icon: CalendarDays },
    { label: t("memberPanelNav"), href: "/member", icon: Link2 },
    { label: t("settings"), href: "/settings", icon: Settings },
  ];
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const mainNav = useMainNav();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<PlaylistType[]>([]);
  const [savedSections, setSavedSections] = useState<{ sectionId: string; title: string; coverImage?: string | null }[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isArtist, setIsArtist] = useState(false);
  const [playlistHintVisible, setPlaylistHintVisible] = useState(true);

  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const plusMenuItems: StevenActionItem[] = [
    {
      id: "create-playlist",
      icon: ListMusic,
      label: t("createPlaylist"),
      onClick: () => createPlaylist(),
    },
    {
      id: "blend",
      icon: Blend,
      label: t("blendCreate"),
      onClick: () => router.push("/blend"),
    },
    {
      id: "spotify-import",
      icon: Link2,
      label: t("spotifyImportMenu"),
      onClick: () => router.push("/library?tab=playlists&import=spotify"),
    },
  ];

  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setCollapsed = useSettingsStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(SIDEBAR_PLAYLIST_HINT_DISMISS_KEY) === "1") {
        setPlaylistHintVisible(false);
      }
    } catch {}
  }, []);

  const dismissPlaylistHint = () => {
    try {
      localStorage.setItem(SIDEBAR_PLAYLIST_HINT_DISMISS_KEY, "1");
    } catch {}
    setPlaylistHintVisible(false);
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/profile", { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          setIsAdmin(d?.role === "ADMIN");
          setIsArtist(d?.role === "ARTIST");
        })
        .catch(() => {});
    }
  }, [session?.user?.email]);

  const fetchPlaylists = () => {
    if (session?.user) {
      fetch("/api/playlists")
        .then((r) => r.json())
        .then((data) => {
          const list = data?.playlists ?? (Array.isArray(data) ? data : []);
          setPlaylists(list);
          setSavedSections(data?.savedSections ?? []);
        })
        .catch(() => {});
    }
  };

  const sessionUserId = session?.user?.id;
  useEffect(() => {
    fetchPlaylists();
  }, [sessionUserId]);

  useEffect(() => {
    const handler = () => fetchPlaylists();
    window.addEventListener("playlist-updated", handler);
    return () => window.removeEventListener("playlist-updated", handler);
  }, [sessionUserId]);

  useRefreshInterval(fetchPlaylists, 5000, !!session?.user && !isMobile);

  const createPlaylist = async () => {
    if (!session?.user) return;
    setCreating(true);
    setCreateError(null);
    const newPlaylistsVisible = useSettingsStore.getState().newPlaylistsVisible;
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${t("myPlaylist")} #${playlists.length + 1}`,
          isPublic: newPlaylistsVisible,
          showOnProfile: newPlaylistsVisible,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPlaylists((prev) => [data, ...prev]);
      } else {
        setCreateError(data?.error ?? t("playlistCreateError"));
      }
    } catch {
      setCreateError(t("connectionError"));
    }
    setCreating(false);
  };

  const sidebarWidth = collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)";

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="premium-sidebar fixed left-0 top-0 bottom-[var(--player-height)] z-40 hidden flex-col gap-0 p-0 transition-[width] duration-300 ease-out lg:flex"
    >
      
      <div className={cn(collapsed ? "px-2 py-4" : "px-5 py-5")}>
        <div className={cn("mb-6 flex items-center", collapsed ? "flex-col gap-3" : "justify-between")}>
          <Link href="/home" className="flex min-w-0 items-center gap-2">
            <motion.div
              className={cn("relative flex min-w-0 flex-shrink-0 items-center", collapsed ? "h-8 w-8 justify-center" : "min-h-10 justify-start pr-0")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {collapsed ? (
                <span className="font-display text-lg text-foreground">A</span>
              ) : (
                <span className="font-display text-lg tracking-[-0.02em] text-foreground">Aciusfy</span>
              )}
            </motion.div>
          </Link>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            title={collapsed ? "Genişlet" : "Küçült"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        <nav className="space-y-1">
          <p
            className={cn(
              "mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30",
              collapsed ? "sr-only" : "px-2",
            )}
          >
            ( {t("mainMenu")} )
          </p>
          {mainNav.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href === "/home" && pathname === "/");
            return (
              <Link key={link.href} href={link.href} className="premium-sidebar-link block" data-active={isActive ? "true" : undefined}>
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  className={cn(
                    "flex items-center rounded-xl text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-all",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    isActive ? "text-foreground" : "text-muted hover:text-foreground/85",
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon
                    className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5", isActive && "fill-current")}
                  />
                  {!collapsed && link.label}
                </motion.div>
              </Link>
            );
          })}
          {isArtist && (
            <Link href="/dashboard">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={cn(
                  "flex items-center rounded-md text-sm font-semibold transition-colors",
                  collapsed ? "justify-center px-0 py-2" : "gap-4 px-3 py-2.5",
                  pathname === "/dashboard" ? "text-cyan-400" : "text-muted hover:text-white"
                )}
                title={collapsed ? t("artistPanel") : undefined}
              >
                <LayoutDashboard className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-6 w-6")} />
                {!collapsed && t("artistPanel")}
              </motion.div>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={cn(
                  "flex items-center rounded-md text-sm font-semibold transition-colors",
                  collapsed ? "justify-center px-0 py-2" : "gap-4 px-3 py-2.5",
                  pathname === "/admin" ? "text-green-500" : "text-muted hover:text-white"
                )}
                title={collapsed ? t("admin") : undefined}
              >
                <Shield className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-6 w-6")} />
                {!collapsed && t("admin")}
              </motion.div>
            </Link>
          )}
        </nav>
      </div>

      
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className={cn("flex items-center pt-3 pb-2", collapsed ? "justify-center px-1.5" : "justify-between px-4")}>
          {collapsed ? (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={createPlaylist}
              disabled={creating}
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              title={t("newPlaylistTitle")}
            >
              <Plus className={`h-5 w-5 ${creating ? "animate-pulse" : ""}`} />
            </motion.button>
          ) : (
            <>
              <Link
                href="/library"
                className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
              >
                <Library className="h-5 w-5" />
                {t("yourLibrary")}
              </Link>
              <div className="relative flex flex-col items-end gap-0.5">
                {createError && (
                  <p className="text-[10px] text-red-400 max-w-[120px] truncate" title={createError}>
                    {createError}
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPlusMenu(true)}
                  disabled={creating}
                  className={cn(
                    "rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50",
                    showPlusMenu && "bg-white/[0.06] text-foreground",
                  )}
                  title={t("newPlaylistTitle")}
                >
                  <Plus className={`h-5 w-5 ${creating ? "animate-pulse" : ""}`} />
                </motion.button>
                <StevenActionMenu
                  open={showPlusMenu}
                  onClose={() => setShowPlusMenu(false)}
                  items={plusMenuItems}
                  title={t("newPlaylistTitle")}
                />
              </div>
            </>
          )}
        </div>

        
        {!collapsed && (
          <div className="flex gap-1.5 px-4 pb-2">
            <Link
              href="/library?tab=playlists"
              className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/60 ring-1 ring-white/[0.04] transition-all hover:bg-white/10 hover:text-white"
            >
              {t("playlists")}
            </Link>
            <Link
              href="/library?tab=liked"
              className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/60 ring-1 ring-white/[0.04] transition-all hover:bg-white/10 hover:text-white"
            >
              {t("songs")}
            </Link>
          </div>
        )}

        <div className={cn("flex-1 overflow-y-auto pb-2", collapsed ? "px-1" : "px-2")}>
          
          <Link href="/library?tab=liked">
            <motion.div
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                collapsed && "justify-center",
                pathname === "/library" ? "bg-white/10" : ""
              )}
              title={collapsed ? t("likedSongs") : undefined}
            >
              <div className={cn(
                "flex flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-700 to-cyan-400",
                collapsed ? "h-9 w-9" : "h-12 w-12"
              )}>
                <Heart className={cn("fill-white text-white", collapsed ? "h-4 w-4" : "h-5 w-5")} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {t("likedSongs")}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <ListMusic className="h-3 w-3" />
                    {t("playlists")}
                  </p>
                </div>
              )}
            </motion.div>
          </Link>

          <Link href="/downloads">
            <motion.div
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                collapsed && "justify-center",
                pathname === "/downloads" ? "bg-white/10" : ""
              )}
              title={collapsed ? t("downloads") : undefined}
            >
              <div
                className={cn(
                  "flex flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-600 to-emerald-600",
                  collapsed ? "h-9 w-9" : "h-12 w-12"
                )}
              >
                <Download className={cn("text-white", collapsed ? "h-4 w-4" : "h-5 w-5")} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{t("downloads")}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <Download className="h-3 w-3" />
                    {t("offline")}
                  </p>
                </div>
              )}
            </motion.div>
          </Link>

          
          {savedSections.map((s, i) => (
            <SavedSectionContextMenu
              key={`section-${s.sectionId}`}
              sectionId={s.sectionId}
              onRemove={() =>
                setSavedSections((prev) => prev.filter((x) => x.sectionId !== s.sectionId))
              }
            >
              <Link href={`/section/${s.sectionId}`}>
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                  collapsed && "justify-center",
                  pathname === `/section/${s.sectionId}` ? "bg-white/10" : ""
                )}
                title={collapsed ? s.title : undefined}
              >
                <div className={cn(
                  "relative flex-shrink-0 overflow-hidden rounded-md bg-white/5",
                  collapsed ? "h-9 w-9" : "h-12 w-12"
                )}>
                  {proxiedImageUrl(s.coverImage) ? (
                    <Image
                      src={proxiedImageUrl(s.coverImage)!}
                      alt={s.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music2 className={cn("text-muted", collapsed ? "h-4 w-4" : "h-5 w-5")} />
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{s.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <ListMusic className="h-3 w-3" />
                      {t("mix")}
                    </p>
                  </div>
                )}
              </motion.div>
            </Link>
            </SavedSectionContextMenu>
          ))}

          
          <AnimatePresence>
            {playlists.map((pl, i) => (
              <motion.div
                key={pl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <PlaylistContextMenu
                  playlist={pl}
                  onProfileVisibilityChange={(next) =>
                    setPlaylists((prev) =>
                      prev.map((p) => (p.id === pl.id ? { ...p, showOnProfile: next } : p))
                    )
                  }
                  onRemove={() => setPlaylists((prev) => prev.filter((p) => p.id !== pl.id))}
                >
                  <Link href={`/playlist/${pl.id}`}>
                    <motion.div
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                        collapsed && "justify-center",
                        pathname === `/playlist/${pl.id}` ? "bg-white/10" : ""
                      )}
                      title={collapsed ? pl.title : undefined}
                    >
                      <div className={cn(
                        "relative flex-shrink-0 overflow-hidden rounded-md bg-white/5",
                        collapsed ? "h-9 w-9" : "h-12 w-12"
                      )}>
                        {(pl as unknown as { blend?: { id: string; creator: { name: string | null; avatar: string | null }; invited: { name: string | null; avatar: string | null } } }).blend ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-400">
                            <span className={cn("font-extrabold uppercase tracking-wider text-white", collapsed ? "text-[7px]" : "text-[9px]")}>Blend</span>
                          </div>
                        ) : proxiedImageUrl(pl.coverImage) ? (
                          <Image
                            src={proxiedImageUrl(pl.coverImage)!}
                            alt={pl.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music2 className={cn("text-muted", collapsed ? "h-4 w-4" : "h-5 w-5")} />
                          </div>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {pl.title}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <ListMusic className="h-3 w-3" />
                            {t("playlists")}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                </PlaylistContextMenu>
              </motion.div>
            ))}
          </AnimatePresence>

          {!collapsed && playlists.length === 0 && savedSections.length === 0 && playlistHintVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative mt-4 rounded-lg bg-white/5 p-4 pr-10"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  dismissPlaylistHint();
                }}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-white">
                {t("createFirstPlaylist")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t("createPlaylistHelp")}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createPlaylist}
                disabled={creating}
                className="mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black"
              >
                {t("createPlaylistBtn")}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </aside>
  );
}
