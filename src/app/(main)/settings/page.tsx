"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  RotateCcw,
  ChevronDown,
  Save,
  WifiOff,
  Trash2,
} from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { showErrorToast, showSuccessToast } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import { createEQChainWithFilters, EQ_PRESET_GAINS, getEffectiveEQGains } from "@/lib/webaudio-eq";
import { Dropdown } from "@/components/ui/dropdown";
import { LANGUAGES } from "@/lib/i18n";
import { useOfflineStore } from "@/store/offlineStore";
import { getOfflineStorageSize, clearAllOfflineAudio } from "@/lib/offline-storage";
import { prefersMobileHtml5Playback } from "@/lib/mobile-audio";
import { ACIUSFY_APP_VERSION } from "@/lib/app-version";

const EQ_FREQS = [60, 150, 400, 1000, 2400, 15000];
const EQ_W = 480;
const EQ_H = 140;
const EQ_PAD_LEFT = 52;
const EQ_PAD_RIGHT = 24;
const EQ_PAD_TOP = 24;
const EQ_PAD_BOTTOM = 36;
const DB_MIN = -12;
const DB_MAX = 12;

function gainDbToY(gainDb: number): number {
  const t = (gainDb - DB_MIN) / (DB_MAX - DB_MIN);
  return EQ_PAD_TOP + (EQ_H - EQ_PAD_TOP - EQ_PAD_BOTTOM) * (1 - Math.max(0, Math.min(1, t)));
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const tension = 0.2;
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

function EqualizerGraph({
  gains,
  onGainDrag,
  interactive,
}: {
  gains: number[];
  onGainDrag?: (index: number, gainDb: number) => void;
  interactive?: boolean;
}) {
  const [localGains, setLocalGains] = useState<number[] | null>(null);
  const dragValueRef = useRef<number>(0);
  const displayGains = localGains ?? gains;
  const isDragging = localGains !== null;

  const graphW = EQ_W - EQ_PAD_LEFT - EQ_PAD_RIGHT;
  const graphH = EQ_H - EQ_PAD_TOP - EQ_PAD_BOTTOM;
  const points = displayGains.map((g, i) => ({
    x: EQ_PAD_LEFT + (i / Math.max(1, displayGains.length - 1)) * graphW,
    y: gainDbToY(g),
  }));
  const lineD = buildSmoothPath(points);
  const lastX = points[points.length - 1]?.x ?? EQ_W - EQ_PAD_RIGHT;
  const areaD = `${lineD} L ${lastX} ${EQ_H - EQ_PAD_BOTTOM} L ${EQ_PAD_LEFT} ${EQ_H - EQ_PAD_BOTTOM} Z`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_50%,rgba(0,0,0,0.02)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,197,94,0.06)_0%,transparent_70%)]" />
      <svg
        viewBox={`0 0 ${EQ_W} ${EQ_H}`}
        className="relative h-auto w-full min-h-[120px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="eq-fill-settings" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0" stopColor="rgb(34 197 94)" stopOpacity="0.35" />
            <stop offset="0.4" stopColor="rgb(34 197 94)" stopOpacity="0.12" />
            <stop offset="1" stopColor="rgb(34 197 94)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eq-line-settings" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="rgb(74 222 128)" />
            <stop offset="0.5" stopColor="rgb(34 197 94)" />
            <stop offset="1" stopColor="rgb(22 163 74)" />
          </linearGradient>
          <filter id="eq-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <text x={12} y={EQ_PAD_TOP + 5} textAnchor="start" className="fill-white/40 text-[9px] font-medium tabular-nums">
          +12
        </text>
        <text x={12} y={EQ_PAD_TOP + graphH * 0.25 + 5} textAnchor="start" className="fill-white/30 text-[8px] tabular-nums">
          +6
        </text>
        <text x={18} y={EQ_PAD_TOP + graphH / 2 + 4} textAnchor="start" className="fill-white/40 text-[9px] font-medium tabular-nums">
          0dB
        </text>
        <text x={12} y={EQ_PAD_TOP + graphH * 0.75 + 5} textAnchor="start" className="fill-white/30 text-[8px] tabular-nums">
          -6
        </text>
        <text x={12} y={EQ_H - 10} textAnchor="start" className="fill-white/40 text-[9px] font-medium tabular-nums">
          -12
        </text>
        
        {[-6, 0, 6].map((db) => (
          <line
            key={db}
            x1={EQ_PAD_LEFT}
            y1={gainDbToY(db)}
            x2={EQ_W - EQ_PAD_RIGHT}
            y2={gainDbToY(db)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray={db === 0 ? "8 6" : "4 4"}
          />
        ))}
        
        {EQ_FREQS.map((_, i) => {
          const x = EQ_PAD_LEFT + (i / (EQ_FREQS.length - 1)) * graphW;
          return (
            <line
              key={i}
              x1={x}
              y1={EQ_PAD_TOP}
              x2={x}
              y2={EQ_H - EQ_PAD_BOTTOM}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          );
        })}
        
        {EQ_FREQS.map((hz, i) => {
          const x = EQ_PAD_LEFT + (i / (EQ_FREQS.length - 1)) * graphW;
          const label = hz >= 1000 ? `${hz / 1000}K` : String(hz);
          return (
            <text
              key={hz}
              x={x}
              y={EQ_H - 14}
              textAnchor="middle"
              className="fill-white/35 text-[9px] font-medium tabular-nums tracking-wide"
            >
              {label}Hz
            </text>
          );
        })}
        
        <motion.path
          d={areaD}
          fill="url(#eq-fill-settings)"
          initial={false}
          animate={{ d: areaD }}
          transition={{ duration: isDragging ? 0.12 : 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
        
        <motion.path
          d={lineD}
          fill="none"
          stroke="url(#eq-line-settings)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#eq-glow)"
          initial={false}
          animate={{ d: lineD }}
          transition={{ duration: isDragging ? 0.12 : 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
        
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={interactive ? 7 : 5}
            fill="white"
            fillOpacity={interactive ? 1 : 0.95}
            stroke={interactive ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.4)"}
            strokeWidth={1.5}
            className={interactive ? "cursor-ns-resize" : ""}
            style={interactive ? { cursor: "ns-resize" } : undefined}
            initial={false}
            animate={{ cx: p.x, cy: p.y }}
            transition={{ duration: isDragging ? 0.1 : 0.35, ease: [0.32, 0.72, 0, 1] }}
            onMouseDown={
              interactive && onGainDrag
                ? (e) => {
                    e.preventDefault();
                    const idx = i;
                    const startY = e.clientY;
                    const startGain = displayGains[idx];
                    dragValueRef.current = startGain;
                    setLocalGains([...displayGains]);
                    const move = (ev: MouseEvent) => {
                      const dy = ev.clientY - startY;
                      const pxPerDb = graphH / (DB_MAX - DB_MIN);
                      const dDb = -dy / pxPerDb;
                      const newVal = Math.max(DB_MIN, Math.min(DB_MAX, startGain + dDb));
                      dragValueRef.current = newVal;
                      setLocalGains((prev) =>
                        prev ? prev.map((v, j) => (j === idx ? newVal : v)) : prev
                      );
                    };
                    const up = () => {
                      window.removeEventListener("mousemove", move);
                      window.removeEventListener("mouseup", up);
                      onGainDrag(idx, dragValueRef.current);
                      setLocalGains(null);
                    };
                    window.addEventListener("mousemove", move);
                    window.addEventListener("mouseup", up);
                  }
                : undefined
            }
            onTouchStart={
              interactive && onGainDrag
                ? (e) => {
                    const touch = e.touches[0];
                    const idx = i;
                    const startY = touch.clientY;
                    const startGain = displayGains[idx];
                    dragValueRef.current = startGain;
                    setLocalGains([...displayGains]);
                    const move = (ev: TouchEvent) => {
                      const t = ev.touches[0];
                      const dy = t.clientY - startY;
                      const pxPerDb = graphH / (DB_MAX - DB_MIN);
                      const dDb = -dy / pxPerDb;
                      const newVal = Math.max(DB_MIN, Math.min(DB_MAX, startGain + dDb));
                      dragValueRef.current = newVal;
                      setLocalGains((prev) =>
                        prev ? prev.map((v, j) => (j === idx ? newVal : v)) : prev
                      );
                    };
                    const end = () => {
                      window.removeEventListener("touchmove", move);
                      window.removeEventListener("touchend", end);
                      onGainDrag(idx, dragValueRef.current);
                      setLocalGains(null);
                    };
                    window.addEventListener("touchmove", move);
                    window.addEventListener("touchend", end);
                  }
                : undefined
            }
          />
        ))}
      </svg>
    </div>
  );
}

const EQ_PRESET_IDS = ["flat", "bass", "treble", "pop", "rock", "jazz", "custom"] as const;
const EQ_PRESET_I18N: Record<string, string> = {
  flat: "eqFlat",
  bass: "eqBass",
  treble: "eqTreble",
  pop: "eqPop",
  rock: "eqRock",
  jazz: "eqJazz",
  custom: "eqCustom",
};
function getEQPresets(t: (k: string) => string, hasCustom: boolean) {
  const ids = hasCustom ? [...EQ_PRESET_IDS] : EQ_PRESET_IDS.filter((id) => id !== "custom");
  return ids.map((id) => ({ id, label: t(EQ_PRESET_I18N[id] ?? id) }));
}

function PresetButtons({
  presets,
  selectedId,
  onSelect,
}: {
  presets: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200",
            selectedId === p.id
              ? "border-green-500/60 bg-green-500/15 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
              : "border-white/10 text-muted hover:border-white/25 hover:bg-white/5 hover:text-white"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function EqualizerSection() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [testing, setTesting] = useState(false);

  const playTestTone = async () => {
    if (typeof window === "undefined") return;
    setTesting(true);
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    await ctx.resume();
    const gains = getEffectiveEQGains(
      settings.equalizerMode,
      settings.equalizerPreset,
      settings.equalizerManualGains,
      settings.equalizerCustomGains
    );
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 200;
    const { node } = createEQChainWithFilters(ctx, gains, osc);
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    node.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 1.5);
    setTimeout(() => {
      ctx.close();
      setTesting(false);
    }, 1600);
  };

  const gains = getEffectiveEQGains(
    settings.equalizerMode,
    settings.equalizerPreset,
    settings.equalizerManualGains,
    settings.equalizerCustomGains
  );

  const handleReset = () => {
    if (settings.equalizerMode === "manual") {
      settings.setEqualizerManualGains([0, 0, 0, 0, 0, 0]);
    } else {
      settings.setEqualizerPreset("flat");
    }
  };

  const handleSaveCustomPreset = () => {
    settings.saveCustomEQPreset(gains);
    setShowSavePreset(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-white/5 p-0.5">
          <motion.button
            layout
            onClick={() => settings.setEqualizerMode("preset")}
            className={cn(
              "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
              settings.equalizerMode === "preset"
                ? "text-white"
                : "text-muted hover:text-white"
            )}
          >
            {settings.equalizerMode === "preset" && (
              <motion.div
                layoutId="eq-tab"
                className="absolute inset-0 rounded-md bg-green-500/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{t("eqPresets")}</span>
          </motion.button>
          <motion.button
            layout
            onClick={() => settings.setEqualizerMode("manual")}
            className={cn(
              "relative flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              settings.equalizerMode === "manual"
                ? "text-white"
                : "text-muted hover:text-white"
            )}
          >
            {settings.equalizerMode === "manual" && (
              <motion.div
                layoutId="eq-tab"
                className="absolute inset-0 rounded-md bg-green-500/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{t("eqManual")}</span>
            <ChevronDown className="relative z-10 h-4 w-4" />
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSavePreset(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:text-white"
        >
          <Save className="h-4 w-4" />
          {t("savePreset")}
        </motion.button>
      </div>

      {settings.equalizerMode === "preset" && (
        <PresetButtons
          presets={getEQPresets(t, !!settings.equalizerCustomGains)}
          selectedId={settings.equalizerPreset}
          onSelect={(id) => settings.setEqualizerPreset(id)}
        />
      )}

      <div className="p-4">
        <EqualizerGraph
          gains={gains}
          interactive={settings.equalizerMode === "manual"}
          onGainDrag={
            settings.equalizerMode === "manual"
              ? (i, v) => settings.setEqualizerManualGain(i, v)
              : undefined
          }
        />
      </div>

      <div className="flex justify-end gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={playTestTone}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-400 transition-colors hover:border-green-500/60 hover:bg-green-500/20 disabled:opacity-50"
        >
          {testing ? t("eqTesting") ?? "..." : t("eqTest") ?? "Test"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          {t("reset")}
        </motion.button>
      </div>

      {showSavePreset && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm text-muted">
            {t("customPresetDesc") ?? "Mevcut ekolayzer ayarlarını özel ön ayar olarak kaydeder."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSavePreset(false)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-muted hover:bg-white/5"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSaveCustomPreset}
              className="rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-400 hover:bg-green-500/30"
            >
              {t("savePreset")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-all duration-200",
        checked ? "bg-gradient-to-r from-purple-500 to-emerald-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]" : "bg-white/10 ring-1 ring-white/[0.06]"
      )}
    >
      <motion.div
        layout
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ left: 2 }}
      />
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function OfflineStorageSection({
  t,
  searchQuery,
}: {
  t: (k: string) => string;
  searchQuery: string;
}) {
  const [storageSize, setStorageSize] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const setDownloadedIds = useOfflineStore((s) => s.setDownloadedIds);

  useEffect(() => {
    getOfflineStorageSize().then(setStorageSize).catch(() => setStorageSize(0));
  }, []);

  const handleClear = async () => {
    if (!confirm(t("clearOfflineConfirm"))) return;
    setClearing(true);
    try {
      await clearAllOfflineAudio();
      setDownloadedIds([]);
      setStorageSize(0);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("playlist-updated"));
    } catch {} finally {
      setClearing(false);
    }
  };

  return (
    <Section title={t("offlineStorage")} searchKeywords={["offline", "indir", "depolama", "storage"]} searchQuery={searchQuery}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            {storageSize !== null ? formatBytes(storageSize) : "—"}
          </span>
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing || (storageSize ?? 0) === 0}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("clearOfflineStorage")}
          </button>
        </div>
        <p className="text-xs text-muted">{t("offlineDesc")}</p>
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
  className,
  searchKeywords = [],
  searchQuery = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  searchKeywords?: string[];
  searchQuery?: string;
}) {
  const q = searchQuery.toLowerCase().trim();
  if (q) {
    const matchTitle = title.toLowerCase().includes(q);
    const matchKeyword = searchKeywords.some((k) => k.toLowerCase().includes(q));
    if (!matchTitle && !matchKeyword) return null;
  }
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/40">{title}</h2>
      <div className="space-y-4 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06]">
        {children}
      </div>
    </motion.section>
  );
}

function SettingRow({
  label,
  description,
  action,
  info,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
  info?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          {info && (
            <span title={info} className="text-muted">
              <Info className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      <div className="shrink-0 sm:pl-4">{action}</div>
    </div>
  );
}

const QUALITY_KEYS = ["auto", "low", "normal", "high"] as const;
const VOLUME_KEYS = ["quiet", "normal", "loud"] as const;

const ZOOM_LEVELS = [70, 80, 90, 100, 110, 120, 130];

function SettingsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const discordParamToastDone = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ email: string } | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [discordLinked, setDiscordLinked] = useState(false);
  const [mobileHtml5Playback, setMobileHtml5Playback] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMobileHtml5Playback(prefersMobileHtml5Playback());
  }, []);

  const settings = useSettingsStore();
  const hydrate = useSettingsStore((s) => s.hydrateFromServer);

  const qualityOptions = QUALITY_KEYS.map((v) => ({ value: v, label: t(v as "auto") }));
  const volumeOptions = VOLUME_KEYS.map((v) => ({ value: v, label: t(v as "quiet") }));

  useEffect(() => {
    if (session?.user) {
      fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Object.keys(data).length > 0) hydrate(data);
        })
        .catch(() => showErrorToast(t("settingsLoadError")));
    }
  }, [session?.user, hydrate, t]);

  useEffect(() => {
    if (session?.user && editModalOpen) {
      fetch("/api/profile", { credentials: "include" })
        .then((r) => r.ok && r.json())
        .then((data) => data && setProfileData({ email: data.email }))
        .catch(() => showErrorToast(t("profileLoadError")));
    }
  }, [session?.user, editModalOpen, t]);

  const refetchProfilePrefs = useCallback(() => {
    if (!session?.user) return;
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) {
          const privateVal = data.isPrivate ?? false;
          setIsPrivate(privateVal);
          useSettingsStore.getState().setProfileFollowVisible(!privateVal);
          if (typeof data.discordLinked === "boolean") setDiscordLinked(data.discordLinked);
        }
      })
      .catch(() => showErrorToast(t("settingsLoadError")));
  }, [session?.user, t]);

  useEffect(() => {
    refetchProfilePrefs();
  }, [refetchProfilePrefs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "visible") refetchProfilePrefs();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refetchProfilePrefs]);

  useEffect(() => {
    if (discordParamToastDone.current) return;
    const linked = searchParams.get("discord_linked") === "1";
    const taken = searchParams.get("discord_link") === "taken";
    const oauthSeal = searchParams.get("discord_oauth") === "seal";
    const oauthFailed = searchParams.get("discord_oauth") === "callback_failed";
    if (!linked && !taken && !oauthSeal && !oauthFailed) return;
    discordParamToastDone.current = true;
    if (linked) {
      showSuccessToast(t("settingsDiscordLinkSuccess"));
    }
    if (taken) {
      showErrorToast(t("settingsDiscordLinkTaken"));
    }
    if (oauthSeal) {
      showErrorToast(t("settingsDiscordOauthSealError"));
    }
    if (oauthFailed) {
      showErrorToast(t("settingsDiscordOauthCallbackFailed"));
    }
    const q = new URLSearchParams(searchParams.toString());
    q.delete("discord_linked");
    q.delete("discord_link");
    q.delete("discord_oauth");
    const next = q.toString();
    router.replace(next ? `/settings?${next}` : "/settings", { scroll: false });
    refetchProfilePrefs();
  }, [searchParams, router, t, refetchProfilePrefs]);

  const saveToServer = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const state = useSettingsStore.getState();
      const payload = {
        language: state.language,
        allowExplicit: state.allowExplicit,
        autoplay: state.autoplay,
        listeningQuality: state.listeningQuality,
        downloadQuality: state.downloadQuality,
        autoAdjustQuality: state.autoAdjustQuality,
        libraryCompactView: state.libraryCompactView,
        showLocalFiles: state.showLocalFiles,
        showNowPlayingOnPlay: state.showNowPlayingOnPlay,
        showCanvasInTracks: state.showCanvasInTracks,
        showDesktopOverlay: state.showDesktopOverlay,
        seeFriendsListening: state.seeFriendsListening,
        zoomLevel: state.zoomLevel,
        newPlaylistsVisible: state.newPlaylistsVisible,
        shareListeningActivity: state.shareListeningActivity ?? true,
        onlinePresenceEnabled: state.onlinePresenceEnabled ?? true,
        profilePlaylistsVisible: state.profilePlaylistsVisible,
        profileFollowVisible: state.profileFollowVisible,
        profileArtistsVisible: state.profileArtistsVisible,
        crossfade: state.crossfade,
        crossfadeSeconds: state.crossfadeSeconds,
        gaplessPlayback: state.gaplessPlayback,
        normalizeVolume: state.normalizeVolume,
        volumeLevel: state.volumeLevel,
        monoAudio: state.monoAudio,
        equalizerEnabled: state.equalizerEnabled,
        equalizerPreset: state.equalizerPreset,
        equalizerMode: state.equalizerMode,
        equalizerManualGains: state.equalizerManualGains,
      };
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}
    setSaving(false);
  };

  useEffect(() => {
    if (!session?.user) return;
    let timeout: ReturnType<typeof setTimeout>;
    const unsub = useSettingsStore.subscribe(() => {
      clearTimeout(timeout);
      timeout = setTimeout(saveToServer, 800);
    });
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [session?.user]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white">{t("settings")}</h1>
        <div className="group relative w-full sm:w-56">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchSettings")}
            className="w-full rounded-xl border-0 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white ring-1 ring-white/[0.06] transition-all placeholder:text-white/20 focus:bg-white/[0.06] focus:outline-none focus:ring-purple-500/40"
          />
        </div>
      </motion.div>

      
      <Section title={t("editSessionMethods")} searchKeywords={["profil", "düzenle", "oturum", "hesap", "giriş"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("editSessionMethods")}
          description="Profil bilgilerinizi ve giriş yöntemlerinizi güncelleyin"
          action={
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
            >
              {t("edit")}
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          }
        />
      </Section>

      
      <Section title={t("language")} searchKeywords={["dil", "language", "türkçe", "english"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("language")}
          description={t("languageDesc")}
          action={
            <Dropdown
              value={settings.language}
              options={LANGUAGES}
              onChange={(v) => settings.setLanguage(v)}
            />
          }
        />
      </Section>

      
      <Section title={t("explicitContent")} searchKeywords={["sansür", "explicit", "içerik"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("allowExplicit")}
          action={
            <Toggle
              checked={settings.allowExplicit}
              onChange={settings.setAllowExplicit}
            />
          }
        />
        <p className="text-xs text-muted">{t("explicitNote1")}</p>
        <p className="text-xs text-muted">{t("explicitNote2")}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Info className="h-3.5 w-3.5" />
          {t("explicitNote3")}
        </p>
      </Section>

      
      <Section title={t("autoplay")} searchKeywords={["otomatik", "autoplay", "çalma"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("autoplay")}
          description={t("autoplayDesc")}
          action={
            <Toggle checked={settings.autoplay} onChange={settings.setAutoplay} />
          }
        />
      </Section>

      
      <Section title={t("audioQuality")} searchKeywords={["ses", "kalite", "dinleme", "indir", "quality"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("listeningQuality")}
          action={
            <Dropdown
              value={settings.listeningQuality}
              options={qualityOptions}
              onChange={(v) => settings.setListeningQuality(v)}
            />
          }
        />
        <SettingRow
          label={t("download")}
          info={t("downloadQualityDesc")}
          action={
            <Dropdown
              value={settings.downloadQuality}
              options={qualityOptions}
              onChange={(v) => settings.setDownloadQuality(v)}
            />
          }
        />
        <SettingRow
          label={t("autoAdjustQuality")}
          description={t("recommendedSetting")}
          action={
            <Toggle
              checked={settings.autoAdjustQuality}
              onChange={settings.setAutoAdjustQuality}
            />
          }
        />
      </Section>

      
      <Section title={t("library")} searchKeywords={["kitaplık", "library", "kompakt", "yerel"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("libraryCompact")}
          action={
            <Toggle
              checked={settings.libraryCompactView}
              onChange={settings.setLibraryCompactView}
            />
          }
        />
        
      </Section>

      
      <OfflineStorageSection t={t} searchQuery={searchQuery} />

      
      <Section title={t("display")} searchKeywords={["görüntüle", "çal", "now playing", "canvas", "medya", "arkadaş", "tema", "theme", "karanlık", "açık"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("theme")}
          description={t("theme") + ": " + (settings.theme === "dark" ? t("themeDark") : settings.theme === "light" ? t("themeLight") : t("themeSystem"))}
          action={
            <div className="flex gap-2">
              {(["dark", "light", "system"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => settings.setTheme(v)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    settings.theme === v
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-white/10 text-muted hover:border-white/20 hover:text-white"
                  )}
                >
                  {v === "dark" ? t("themeDark") : v === "light" ? t("themeLight") : t("themeSystem")}
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          label={t("showNowPlaying")}
          action={
            <Toggle
              checked={settings.showNowPlayingOnPlay}
              onChange={settings.setShowNowPlayingOnPlay}
            />
          }
        />
        <SettingRow
          label={t("showCanvas")}
          action={
            <Toggle
              checked={settings.showCanvasInTracks}
              onChange={settings.setShowCanvasInTracks}
            />
          }
        />
        <SettingRow
          label={t("showDesktopOverlay")}
          action={
            <Toggle
              checked={settings.showDesktopOverlay}
              onChange={settings.setShowDesktopOverlay}
            />
          }
        />
        <SettingRow
          label={t("playerCompactMode") ?? "Mini oynatıcı"}
          description={t("playerCompactModeDesc") ?? "Oynatıcı çubuğunu daha küçük göster"}
          action={
            <Toggle
              checked={settings.playerCompactMode}
              onChange={settings.setPlayerCompactMode}
            />
          }
        />
        <SettingRow
          label={t("seeFriendsListening")}
          action={
            <Toggle
              checked={settings.seeFriendsListening}
              onChange={settings.setSeeFriendsListening}
            />
          }
        />
      </Section>

      
      <Section title={t("zoomLevel")} searchKeywords={["yakınlaştırma", "zoom", "zoom level"]} searchQuery={searchQuery}>
        <p className="text-xs text-muted">{t("zoomDesc")}</p>
        <div className="flex flex-wrap gap-4 pt-2">
          {[t("compact"), t("default_"), t("wide")].map((label, i) => {
            const val = [70, 90, 110][i];
            return (
              <button
                key={label}
                onClick={() => settings.setZoomLevel(val)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors",
                  settings.zoomLevel === val
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-white/10 text-muted hover:border-white/20 hover:text-white"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {ZOOM_LEVELS.map((z) => (
            <button
              key={z}
              onClick={() => settings.setZoomLevel(z)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                settings.zoomLevel === z
                  ? "bg-green-500/20 text-green-400"
                  : "text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              %{z}
            </button>
          ))}
          <button
            onClick={() => settings.setZoomLevel(90)}
            className="ml-2 flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-white/20 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            {t("reset")}
          </button>
        </div>
      </Section>

      
      <Section title={t("social")} searchKeywords={["sosyal", "playlist", "gizli", "profil", "takip", "paylaş", "çevrimiçi", "online"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("profileFollowVisible")}
          action={
            <Toggle
              checked={!isPrivate}
              onChange={async (checked) => {
                const newIsPrivate = !checked;
                setIsPrivate(newIsPrivate);
                settings.setProfileFollowVisible(checked);
                try {
                  await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPrivate: newIsPrivate }),
                  });
                } catch {
                  setIsPrivate(!newIsPrivate);
                  settings.setProfileFollowVisible(!checked);
                }
              }}
            />
          }
        />
        <SettingRow
          label={t("newPlaylistsVisible")}
          description={t("newPlaylistsDesc")}
          action={
            <Toggle
              checked={settings.newPlaylistsVisible}
              onChange={settings.setNewPlaylistsVisible}
            />
          }
        />
        <SettingRow
          label={t("shareListeningFriends")}
          action={
            <Toggle
              checked={settings.shareListeningActivity ?? true}
              onChange={settings.setShareListeningActivity}
            />
          }
        />
        <SettingRow
          label={t("onlinePresenceSocial")}
          description={t("onlinePresenceSocialDesc")}
          action={
            <Toggle
              checked={settings.onlinePresenceEnabled ?? true}
              onChange={settings.setOnlinePresenceEnabled}
            />
          }
        />
        <SettingRow
          label={t("profilePlaylistsVisible")}
          action={
            <Toggle
              checked={settings.profilePlaylistsVisible}
              onChange={settings.setProfilePlaylistsVisible}
            />
          }
        />
        <SettingRow
          label={t("profileArtistsVisible")}
          action={
            <Toggle
              checked={settings.profileArtistsVisible}
              onChange={settings.setProfileArtistsVisible}
            />
          }
        />
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-xs font-medium text-white/90">{t("settingsDiscordLinkTitle")}</p>
            <p className="mt-1 text-xs text-muted">{t("settingsDiscordLinkDesc")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {discordLinked ? (
                <>
                  <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                    {t("settingsDiscordLinked")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void (async () => {
                        try {
                          const r = await fetch("/api/me/discord-unlink", {
                            method: "POST",
                            credentials: "include",
                          });
                          if (r.ok) {
                            setDiscordLinked(false);
                            showSuccessToast(t("settingsDiscordUnlinked"));
                          } else showErrorToast(t("settingsLoadError"));
                        } catch {
                          showErrorToast(t("settingsLoadError"));
                        }
                      })()
                    }
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                  >
                    {t("settingsDiscordUnlink")}
                  </button>
                </>
              ) : (
                <a
                  href="/api/discord-bot/oauth/authorize?link=1"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#4752c4]"
                >
                  {t("settingsDiscordLinkButton")}
                  <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                </a>
              )}
            </div>
            {discordLinked ? (
              <Link
                href="/member"
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-200 transition hover:bg-green-500/15"
              >
                {t("memberPanelOpen")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted">{t("thirdPartyApps")}</p>
            <button className="mt-2 flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white transition-colors hover:border-white/20">
              {t("show")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Section>

      
      <Section title={t("playback")} searchKeywords={["çalma", "crossfade", "gapless", "ses", "mono", "volume"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("crossfadeLabel")}
          action={
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={12}
                value={settings.crossfadeSeconds}
                onChange={(e) =>
                  settings.setCrossfadeSeconds(Number(e.target.value) || 0)
                }
                className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-green-500 focus:outline-none"
              />
              <span className="text-xs text-muted">{t("seconds")}</span>
              <Toggle
                checked={settings.crossfade}
                onChange={settings.setCrossfade}
              />
            </div>
          }
        />
        <SettingRow
          label={t("gaplessLabel")}
          action={
            <Toggle
              checked={settings.gaplessPlayback}
              onChange={settings.setGaplessPlayback}
            />
          }
        />
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-white/90">{t("playbackTipsTitle")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-[11px] text-muted sm:text-xs">
            <li>{t("playbackTipsCrossfade")}</li>
            <li>{t("playbackTipsNetwork")}</li>
            <li>{t("playbackTipsRetry")}</li>
          </ul>
        </div>
        <SettingRow
          label={t("normalizeVolume")}
          action={
            <Toggle
              checked={settings.normalizeVolume}
              onChange={settings.setNormalizeVolume}
            />
          }
        />
        <SettingRow
          label={t("volumeLevel")}
          description={t("volumeLevelDesc")}
          action={
            <Dropdown
              value={settings.volumeLevel}
              options={volumeOptions}
              onChange={(v) => settings.setVolumeLevel(v)}
            />
          }
        />
        <SettingRow
          label={t("monoAudio")}
          action={
            <Toggle
              checked={settings.monoAudio}
              onChange={settings.setMonoAudio}
            />
          }
        />
        {mobileHtml5Playback && (
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">{t("equalizerMobileBackgroundNote")}</p>
        )}
      </Section>

      
      <Section title={t("equalizer")} searchKeywords={["ekolayzer", "equalizer", "eq"]} searchQuery={searchQuery}>
        <SettingRow
          label={t("equalizer")}
          action={
            <Toggle
              checked={settings.equalizerEnabled}
              onChange={settings.setEqualizerEnabled}
            />
          }
        />
        {settings.equalizerEnabled && <EqualizerSection />}
      </Section>

      <p className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-white/30 tabular-nums">
        {t("settingsAppFooter").replace("{v}", ACIUSFY_APP_VERSION)}
      </p>

      <ProfileEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={profileData ?? { email: session?.user?.email ?? "" }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">{t("discordBotLoading")}</div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
