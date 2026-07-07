"use client";

import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  cloneHeroDeviceLayout,
  fetchHeroDeviceLayout,
  HERO_DEVICE_LAYOUT_STORAGE_KEY,
  HERO_LAYOUT_CHANGED_EVENT,
  loadHeroDeviceLayoutFromPublicFile,
  parseHeroLayoutJsonString,
  readHeroLayoutFromLocalStorage,
  type HeroDeviceLayout,
} from "@/lib/hero-device-layout";
import {
  resolveHeroDeviceModelPaths,
  type HeroDevicePaths,
} from "@/lib/hero-device-models";

const HeroDeviceCanvas = dynamic(() => import("./HeroDeviceCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[260px] w-full animate-pulse rounded-2xl bg-white/[0.06] ring-1 ring-white/10" />
  ),
});

class DeviceErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function deriveLivePaths(
  usePlaceholders: boolean,
  phonePath?: string,
  laptopPath?: string,
): HeroDevicePaths | null {
  if (usePlaceholders) return null;
  return {
    phone: (phonePath ?? "").trim() || "/models/phone.glb",
    laptop: (laptopPath ?? "").trim() || "/models/laptop.glb",
  };
}

export type HeroDeviceShowcaseProps = {
  reduceMotion: boolean;
  liveLayout?: HeroDeviceLayout
  liveUsePlaceholders?: boolean;
  livePhonePath?: string;
  liveLaptopPath?: string;
  orbitPreview?: boolean;
};

export function HeroDeviceShowcase(
  {
    reduceMotion,
    liveLayout,
    liveUsePlaceholders = false,
    livePhonePath = "",
    liveLaptopPath = "",
    orbitPreview = false,
  }: HeroDeviceShowcaseProps
) {
  const liveActive = liveLayout != null;

  const [paths, setPaths] = useState<HeroDevicePaths | null | undefined>(() =>
    liveActive ? deriveLivePaths(liveUsePlaceholders, livePhonePath, liveLaptopPath) : undefined,
  );
  const [fileLayout, setFileLayout] = useState<HeroDeviceLayout | null>(() => {
    if (typeof window === "undefined" || liveActive) return null;
    return readHeroLayoutFromLocalStorage();
  });

  const syncLayoutFromBrowserStorage = useCallback(() => {
    const ls = readHeroLayoutFromLocalStorage();
    if (ls) {
      setFileLayout(cloneHeroDeviceLayout(ls));
      return;
    }
    void loadHeroDeviceLayoutFromPublicFile().then((l) => setFileLayout(cloneHeroDeviceLayout(l)));
  }, []);

  useEffect(() => {
    if (liveActive) {
      setPaths(deriveLivePaths(liveUsePlaceholders, livePhonePath, liveLaptopPath));
      return;
    }
    void Promise.all([resolveHeroDeviceModelPaths(), fetchHeroDeviceLayout()]).then(([p, l]) => {
      setPaths(p);
      setFileLayout(cloneHeroDeviceLayout(l));
    });
  }, [liveActive, liveUsePlaceholders, livePhonePath, liveLaptopPath]);

  useEffect(() => {
    if (liveActive) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== HERO_DEVICE_LAYOUT_STORAGE_KEY) return;
      if (e.newValue === null) {
        void loadHeroDeviceLayoutFromPublicFile().then((l) => setFileLayout(cloneHeroDeviceLayout(l)));
        return;
      }
      const parsed = parseHeroLayoutJsonString(e.newValue);
      if (parsed) setFileLayout(cloneHeroDeviceLayout(parsed));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(HERO_LAYOUT_CHANGED_EVENT, syncLayoutFromBrowserStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(HERO_LAYOUT_CHANGED_EVENT, syncLayoutFromBrowserStorage);
    };
  }, [liveActive, syncLayoutFromBrowserStorage]);

  const effectiveLayout = liveLayout ?? fileLayout;

  if (!liveActive && (paths === undefined || fileLayout === null)) {
    return (
      <div className="h-full min-h-[260px] w-full animate-pulse rounded-2xl bg-white/[0.05] ring-1 ring-white/10" />
    );
  }

  if (effectiveLayout == null || paths === undefined) {
    return (
      <div className="h-full min-h-[260px] w-full animate-pulse rounded-2xl bg-white/[0.05] ring-1 ring-white/10" />
    );
  }

  const canvasKey = paths === null ? "placeholders" : `${paths.phone}|${paths.laptop}`;

  return (
    <DeviceErrorBoundary fallback={null}>
      <div className="h-full min-h-[280px] w-full">
        <Suspense
          fallback={
            <div className="h-full min-h-[280px] w-full animate-pulse rounded-2xl bg-white/[0.06]" />
          }
        >
          {paths === null ? (
            <HeroDeviceCanvas
              key={canvasKey}
              placeholders
              reduceMotion={reduceMotion}
              layout={effectiveLayout}
              orbitPreview={orbitPreview}
            />
          ) : (
            <HeroDeviceCanvas
              key={canvasKey}
              phonePath={paths.phone}
              laptopPath={paths.laptop}
              reduceMotion={reduceMotion}
              layout={effectiveLayout}
              orbitPreview={orbitPreview}
            />
          )}
        </Suspense>
      </div>
    </DeviceErrorBoundary>
  );
}
