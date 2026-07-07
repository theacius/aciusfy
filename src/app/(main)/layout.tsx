"use client";

import { Suspense, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PipPlayer } from "@/components/player/PipPlayer";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { SongDetailModal } from "@/components/modals/SongDetailModal";
import { AddToPlaylistModal } from "@/components/modals/AddToPlaylistModal";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { NowPlayingSidebar } from "@/components/player/NowPlayingSidebar";
import { LyricsPanel } from "@/components/player/LyricsPanel";
import { QueuePanel } from "@/components/player/QueuePanel";
import { DesktopOverlay } from "@/components/player/DesktopOverlay";
import { KeyboardShortcuts } from "@/components/player/KeyboardShortcuts";
import { MessageNotificationToast } from "@/components/notifications/MessageNotificationToast";
import { GlobalToast } from "@/components/notifications/GlobalToast";
import { MessageNotificationProvider } from "@/components/providers/MessageNotificationProvider";
import { SettingsHydration } from "@/components/providers/SettingsHydration";
import { ListeningBroadcaster } from "@/components/providers/ListeningBroadcaster";
import { PresenceBroadcaster } from "@/components/providers/PresenceBroadcaster";
import { OfflineSync } from "@/components/providers/OfflineSync";
import { UserProfileProvider } from "@/components/providers/UserProfileProvider";
import { RewardsSync } from "@/components/providers/RewardsSync";
import { PremiumShell } from "@/components/premium";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { CinematicPage } from "@/components/cinematic";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { InstallPwaBanner } from "@/components/layout/InstallPwaBanner";
import { NativeAppPromoBanner } from "@/components/layout/NativeAppPromoBanner";
import { VisitBeacon } from "@/components/analytics/VisitBeacon";
import { ListenTogetherDeepLinkHandler } from "@/components/listen-together/ListenTogetherDeepLinkHandler";
import { MainAppEntranceCurtain } from "@/components/layout/MainAppEntranceCurtain";
import { AiChatDock } from "@/components/ai/AiChatDock";

function useDesktopRightPanelPadding(): "lg:pr-[340px]" {
  return "lg:pr-[340px]";
}

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const mainRightPad = useDesktopRightPanelPadding();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const sidebarMl = sidebarCollapsed ? "lg:ml-[var(--sidebar-collapsed-width)]" : "lg:ml-[var(--sidebar-width)]";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const bindScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setScrollEl(node);
  }, []);

  return (
    <>
      <MainAppEntranceCurtain />
      <SettingsHydration />
      <RewardsSync />
      <VisitBeacon />
      <Suspense>
        <ListenTogetherDeepLinkHandler />
      </Suspense>
      <ListeningBroadcaster />
      <PresenceBroadcaster />
      <OfflineSync />
      <LenisProvider mode="element" scrollElement={scrollEl}>
      <PremiumShell threeIntensity="subtle" className="min-h-[100dvh]">
        <div className="flex h-[100dvh] flex-col overflow-hidden">
            <div className={cn("shrink-0", sidebarMl, "transition-[margin] duration-300 ease-out")}>
              <Suspense>
                <TopNavbar />
              </Suspense>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <Suspense>
                <AppSidebar />
              </Suspense>
              <main
                className={cn(
                  "ml-0 flex flex-1 flex-col overflow-hidden pb-[var(--main-content-bottom-padding)] transition-[margin,padding] duration-300 ease-out",
                  sidebarMl,
                  mainRightPad,
                )}
              >
                <div className="relative flex flex-1 flex-col overflow-hidden">
                  <div
                    ref={bindScrollRef}
                    className="main-scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
                  >
                    <Suspense>
                      <CinematicPage>{children}</CinematicPage>
                    </Suspense>
                  </div>
                </div>
              </main>
            </div>
            <PlayerBar />
            <PipPlayer />
            <NativeAppPromoBanner />
            <InstallPwaBanner />
            <MobileBottomNav />
            <KeyboardShortcuts />
            <DesktopOverlay />
            <SongDetailModal />
            <AddToPlaylistModal />
            <NowPlayingSidebar />
            <LyricsPanel />
            <QueuePanel />
            <MessageNotificationProvider />
            <Suspense fallback={null}>
              <MessageNotificationToast />
            </Suspense>
            <GlobalToast />
            <AiChatDock />
        </div>
      </PremiumShell>
      </LenisProvider>
    </>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AudioProvider>
      <UserProfileProvider>
        <MainLayoutInner>{children}</MainLayoutInner>
      </UserProfileProvider>
    </AudioProvider>
  );
}
