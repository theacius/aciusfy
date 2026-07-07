"use client";

import Link from "next/link";
import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import HeroDeviceCanvas from "@/components/landing/HeroDeviceCanvas";
import { HeroSection } from "@/components/landing/HeroSection";
import { useTranslation } from "@/hooks/useTranslation";
import {
  cloneHeroDeviceLayout,
  clearHeroLayoutLocalStorage,
  DEFAULT_HERO_DEVICE_LAYOUT,
  fetchHeroDeviceLayout,
  HERO_DEVICE_LAYOUT_STORAGE_KEY,
  HERO_LAYOUT_CHANGED_EVENT,
  layoutToPublicJson,
  loadHeroDeviceLayoutFromPublicFile,
  parseHeroLayoutJsonString,
  readHeroLayoutFromLocalStorage,
  saveHeroLayoutToLocalStorage,
  type HeroDeviceLayout,
} from "@/lib/hero-device-layout";
import { resolveHeroDeviceModelPaths } from "@/lib/hero-device-models";
import { cn } from "@/lib/utils";

const RAD = Math.PI / 180;

type Tab = "camera" | "phone" | "laptop" | "assets" | "export";

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      <div className="flex justify-between gap-2">
        <span>{label}</span>
        <input
          type="number"
          className="w-24 rounded-md border border-white/10 bg-zinc-950 px-2 py-0.5 text-right text-xs text-white"
          value={Number.isFinite(value) ? Number(value.toFixed(5)) : 0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <input
        type="range"
        className="w-full accent-violet-500"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

class PreviewErrorBoundary extends Component<
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

function PreviewBlock({
  layout,
  usePlaceholders,
  phonePath,
  laptopPath,
  orbitPreview,
  glbErrorText,
  loadingText,
}: {
  layout: HeroDeviceLayout;
  usePlaceholders: boolean;
  phonePath: string;
  laptopPath: string;
  orbitPreview: boolean;
  glbErrorText: string;
  loadingText: string;
}) {
  return (
    <PreviewErrorBoundary
      key={`${phonePath}|${laptopPath}|${usePlaceholders}`}
      fallback={
        <div className="flex h-full min-h-[400px] items-center justify-center px-6 text-center text-sm text-red-300/90">
          {glbErrorText}
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-zinc-500">
            {loadingText}
          </div>
        }
      >
        {usePlaceholders ? (
          <HeroDeviceCanvas
            placeholders
            layout={layout}
            reduceMotion={false}
            orbitPreview={orbitPreview}
          />
        ) : (
          <HeroDeviceCanvas
            key={`${phonePath}|${laptopPath}`}
            phonePath={phonePath.trim() || "/models/phone.glb"}
            laptopPath={laptopPath.trim() || "/models/laptop.glb"}
            layout={layout}
            reduceMotion={false}
            orbitPreview={orbitPreview}
          />
        )}
      </Suspense>
    </PreviewErrorBoundary>
  );
}

export default function HeroLayoutEditor() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("camera");
  const [layout, setLayout] = useState<HeroDeviceLayout>(() =>
    cloneHeroDeviceLayout(DEFAULT_HERO_DEVICE_LAYOUT),
  );
  const [usePlaceholders, setUsePlaceholders] = useState(true);
  const [phonePath, setPhonePath] = useState("/models/phone.glb");
  const [laptopPath, setLaptopPath] = useState("/models/laptop.glb");
  const [orbitPreview, setOrbitPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveLanding, setLiveLanding] = useState(true);
  const [savedBrowser, setSavedBrowser] = useState(false);

  useEffect(() => {
    void Promise.all([fetchHeroDeviceLayout(), resolveHeroDeviceModelPaths()]).then(([fileLayout, paths]) => {
      setLayout(cloneHeroDeviceLayout(fileLayout));
      if (paths) {
        setPhonePath(paths.phone);
        setLaptopPath(paths.laptop);
        setUsePlaceholders(false);
      }
      setReady(true);
    });
  }, []);

  const syncEditorLayoutFromBrowser = useCallback(() => {
    const ls = readHeroLayoutFromLocalStorage();
    if (ls) {
      setLayout(cloneHeroDeviceLayout(ls));
      return;
    }
    void loadHeroDeviceLayoutFromPublicFile().then((l) => setLayout(cloneHeroDeviceLayout(l)));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== HERO_DEVICE_LAYOUT_STORAGE_KEY) return;
      if (e.newValue === null) {
        void loadHeroDeviceLayoutFromPublicFile().then((l) => setLayout(cloneHeroDeviceLayout(l)));
        return;
      }
      const parsed = parseHeroLayoutJsonString(e.newValue);
      if (parsed) setLayout(cloneHeroDeviceLayout(parsed));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(HERO_LAYOUT_CHANGED_EVENT, syncEditorLayoutFromBrowser);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(HERO_LAYOUT_CHANGED_EVENT, syncEditorLayoutFromBrowser);
    };
  }, [ready, syncEditorLayoutFromBrowser]);

  const reloadFromFile = useCallback(() => {
    void loadHeroDeviceLayoutFromPublicFile().then((l) => setLayout(cloneHeroDeviceLayout(l)));
  }, []);

  const saveToBrowser = useCallback(() => {
    saveHeroLayoutToLocalStorage(layout);
    setSavedBrowser(true);
    setTimeout(() => setSavedBrowser(false), 2600);
  }, [layout]);

  const clearBrowserSave = useCallback(() => {
    clearHeroLayoutLocalStorage();
    void loadHeroDeviceLayoutFromPublicFile().then((l) => setLayout(cloneHeroDeviceLayout(l)));
  }, []);

  const resetDefaults = useCallback(() => {
    setLayout(cloneHeroDeviceLayout(DEFAULT_HERO_DEVICE_LAYOUT));
  }, []);

  const json = layoutToPublicJson(layout);

  const copyJson = useCallback(() => {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [json]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "hero-devices.layout.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [json]);

  const setCamPos = (i: 0 | 1 | 2, v: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      const p = [...n.camera.position] as [number, number, number];
      p[i] = v;
      n.camera = { ...n.camera, position: p };
      return n;
    });
  };

  const setCamFov = (v: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      n.camera = { ...n.camera, fov: v };
      return n;
    });
  };

  const setSidePos = (side: "phone" | "laptop", i: 0 | 1 | 2, v: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      const p = [...n[side].position] as [number, number, number];
      p[i] = v;
      n[side] = { ...n[side], position: p };
      return n;
    });
  };

  const setSideRotDeg = (side: "phone" | "laptop", i: 0 | 1 | 2, deg: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      const r = [...n[side].rotation] as [number, number, number];
      r[i] = deg * RAD;
      n[side] = { ...n[side], rotation: r };
      return n;
    });
  };

  const setSideScale = (side: "phone" | "laptop", v: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      n[side] = { ...n[side], scale: v };
      return n;
    });
  };

  const setSideBoundsMargin = (side: "phone" | "laptop", v: number) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      n[side] = { ...n[side], boundsMargin: v };
      return n;
    });
  };

  const setSideUseBounds = (side: "phone" | "laptop", v: boolean) => {
    setLayout((prev) => {
      const n = cloneHeroDeviceLayout(prev);
      n[side] = { ...n[side], useBounds: v };
      return n;
    });
  };

  const posLabel = (axis: string) => `${t("heroLayoutEditorPosition")} ${axis}`;
  const rotLabel = (axis: string) => `${t("heroLayoutEditorRotationDeg")} ${axis}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "camera", label: t("heroLayoutEditorTabCamera") },
    { id: "phone", label: t("heroLayoutEditorTabPhone") },
    { id: "laptop", label: t("heroLayoutEditorTabLaptop") },
    { id: "assets", label: t("heroLayoutEditorTabAssets") },
    { id: "export", label: t("heroLayoutEditorTabExport") },
  ];

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        {t("heroLayoutEditorLoading")}
      </div>
    );
  }

  const rotDeg = (side: "phone" | "laptop") => {
    const r = layout[side].rotation;
    return [r[0] / RAD, r[1] / RAD, r[2] / RAD] as const;
  };

  const sidePanel = (side: "phone" | "laptop") => {
    const rd = rotDeg(side);
    return (
      <div className="flex flex-col gap-3 pt-2">
        <SliderRow
          label={posLabel("X")}
          value={layout[side].position[0]}
          min={-4}
          max={4}
          step={0.02}
          onChange={(v) => setSidePos(side, 0, v)}
        />
        <SliderRow
          label={posLabel("Y")}
          value={layout[side].position[1]}
          min={-3}
          max={3}
          step={0.02}
          onChange={(v) => setSidePos(side, 1, v)}
        />
        <SliderRow
          label={posLabel("Z")}
          value={layout[side].position[2]}
          min={-2}
          max={4}
          step={0.02}
          onChange={(v) => setSidePos(side, 2, v)}
        />
        <SliderRow
          label={rotLabel("X")}
          value={rd[0]}
          min={-180}
          max={180}
          step={1}
          onChange={(v) => setSideRotDeg(side, 0, v)}
        />
        <SliderRow
          label={rotLabel("Y")}
          value={rd[1]}
          min={-180}
          max={180}
          step={1}
          onChange={(v) => setSideRotDeg(side, 1, v)}
        />
        <SliderRow
          label={rotLabel("Z")}
          value={rd[2]}
          min={-180}
          max={180}
          step={1}
          onChange={(v) => setSideRotDeg(side, 2, v)}
        />
        <SliderRow
          label={t("heroLayoutEditorScale")}
          value={layout[side].scale}
          min={0.15}
          max={3.5}
          step={0.02}
          onChange={(v) => setSideScale(side, v)}
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={layout[side].useBounds}
            onChange={(e) => setSideUseBounds(side, e.target.checked)}
          />
          {t("heroLayoutEditorUseBounds")}
        </label>
        <SliderRow
          label={t("heroLayoutEditorBoundsMargin")}
          value={layout[side].boundsMargin}
          min={0.4}
          max={3}
          step={0.05}
          onChange={(v) => setSideBoundsMargin(side, v)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t("heroLayoutEditorTitle")}</h1>
          </div>
          <Link href="/" className="text-sm text-violet-400 hover:underline">
            ← {t("heroLayoutEditorBackHome")}
          </Link>
        </div>
      </header>

      {liveLanding ? (
        <div className="relative z-10 border-b border-white/10">
          <HeroSection
            heroLiveLayout={layout}
            heroLiveUsePlaceholders={usePlaceholders}
            heroLivePhonePath={phonePath}
            heroLiveLaptopPath={laptopPath}
            heroOrbitPreview={orbitPreview}
          />
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto grid max-w-[1600px] gap-4 p-4",
          liveLanding
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(280px,380px)_1fr] lg:items-stretch",
        )}
      >
        <aside
          className={cn(
            "flex max-h-[min(85dvh,720px)] flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/40 p-4 lg:max-h-[calc(100dvh-88px)]",
            liveLanding && "mx-auto w-full max-w-xl lg:max-h-none",
          )}
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveToBrowser}
              className="rounded-lg bg-emerald-600/90 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500"
            >
              {savedBrowser ? t("heroLayoutEditorSavedBrowser") : t("heroLayoutEditorSaveBrowser")}
            </button>
            <button
              type="button"
              onClick={clearBrowserSave}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/5"
            >
              {t("heroLayoutEditorClearBrowserSave")}
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/90">
            <input
              type="checkbox"
              checked={liveLanding}
              onChange={(e) => setLiveLanding(e.target.checked)}
            />
            {t("heroLayoutEditorLiveLanding")}
          </label>
          <nav className="flex flex-wrap gap-1">
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  tab === x.id
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10",
                )}
              >
                {x.label}
              </button>
            ))}
          </nav>

          <label className="flex cursor-pointer items-center gap-2 border-t border-white/5 pt-3 text-xs text-zinc-400">
            <input type="checkbox" checked={orbitPreview} onChange={(e) => setOrbitPreview(e.target.checked)} />
            {t("heroLayoutEditorOrbit")}
          </label>
          {tab === "camera" ? (
            <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
              <SliderRow
                label={posLabel("X")}
                value={layout.camera.position[0]}
                min={-4}
                max={4}
                step={0.02}
                onChange={(v) => setCamPos(0, v)}
              />
              <SliderRow
                label={posLabel("Y")}
                value={layout.camera.position[1]}
                min={-2}
                max={4}
                step={0.02}
                onChange={(v) => setCamPos(1, v)}
              />
              <SliderRow
                label={posLabel("Z")}
                value={layout.camera.position[2]}
                min={2}
                max={14}
                step={0.05}
                onChange={(v) => setCamPos(2, v)}
              />
              <SliderRow
                label={t("heroLayoutEditorFov")}
                value={layout.camera.fov}
                min={18}
                max={72}
                step={1}
                onChange={setCamFov}
              />
            </div>
          ) : null}

          {tab === "phone" ? sidePanel("phone") : null}
          {tab === "laptop" ? sidePanel("laptop") : null}

          {tab === "assets" ? (
            <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={usePlaceholders}
                  onChange={(e) => setUsePlaceholders(e.target.checked)}
                />
                {t("heroLayoutEditorPlaceholderOnly")}
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                {t("heroLayoutEditorPhoneUrl")}
                <input
                  type="text"
                  value={phonePath}
                  onChange={(e) => setPhonePath(e.target.value)}
                  className="rounded-md border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                  disabled={usePlaceholders}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                {t("heroLayoutEditorLaptopUrl")}
                <input
                  type="text"
                  value={laptopPath}
                  onChange={(e) => setLaptopPath(e.target.value)}
                  className="rounded-md border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                  disabled={usePlaceholders}
                />
              </label>
              <button
                type="button"
                onClick={reloadFromFile}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
              >
                {t("heroLayoutEditorReloadFile")}
              </button>
              <button
                type="button"
                onClick={resetDefaults}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200/90 hover:bg-amber-500/15"
              >
                {t("heroLayoutEditorResetDefaults")}
              </button>
            </div>
          ) : null}

          {tab === "export" ? (
            <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveToBrowser}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  {savedBrowser ? t("heroLayoutEditorSavedBrowser") : t("heroLayoutEditorSaveBrowser")}
                </button>
                <button
                  type="button"
                  onClick={clearBrowserSave}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200/90 hover:bg-red-500/15"
                >
                  {t("heroLayoutEditorClearBrowserSave")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={copyJson}
                  className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"
                >
                  {copied ? t("heroLayoutEditorCopied") : t("heroLayoutEditorCopyJson")}
                </button>
                <button
                  type="button"
                  onClick={downloadJson}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  {t("heroLayoutEditorDownloadJson")}
                </button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-400">
                {json}
              </pre>
            </div>
          ) : null}
        </aside>

        {!liveLanding ? (
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black lg:min-h-[min(calc(100dvh-100px),680px)]">
            <div className="absolute inset-0">
              <PreviewBlock
                layout={layout}
                usePlaceholders={usePlaceholders}
                phonePath={phonePath}
                laptopPath={laptopPath}
                orbitPreview={orbitPreview}
                glbErrorText={t("heroLayoutEditorGlbError")}
                loadingText={t("heroLayoutEditorLoading")}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
