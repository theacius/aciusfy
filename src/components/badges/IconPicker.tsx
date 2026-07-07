"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedModal } from "@/components/ui/animated-modal";

const POPULAR_ICONS = [
  "Award", "Trophy", "Star", "Crown", "Medal", "Gem", "Diamond", "Zap",
  "Flame", "Heart", "Music", "Headphones", "Mic", "Radio", "Disc3",
  "Guitar", "Piano", "Drum", "Speaker", "Volume2",
  "Users", "UserPlus", "UserCheck", "HandHeart", "Handshake",
  "ListMusic", "Library", "FolderHeart", "Bookmark", "BookmarkCheck",
  "Clock", "Timer", "Calendar", "CalendarCheck", "Sunrise",
  "Rocket", "Target", "Flag", "Shield", "ShieldCheck",
  "BadgeCheck", "CircleCheck", "CheckCircle2", "Sparkles", "PartyPopper",
  "Gift", "Cake", "Coffee", "Beer", "Wine",
  "Globe", "Map", "Compass", "Navigation", "Mountain",
  "Sun", "Moon", "CloudLightning", "Snowflake", "Rainbow",
  "Palette", "Brush", "Pencil", "Pen", "Wand2",
  "Code", "Terminal", "Bug", "Puzzle", "Gamepad2",
  "Eye", "EyeOff", "Scan", "Fingerprint", "Lock",
  "Bell", "BellRing", "MessageCircle", "Send", "Mail",
  "Upload", "Download", "Share2", "Link", "ExternalLink",
  "TrendingUp", "BarChart3", "PieChart", "Activity", "Gauge",
  "Swords", "Sword", "Crosshair", "Skull", "Ghost",
  "Cat", "Dog", "Bird", "Fish", "Rabbit",
  "Leaf", "Flower2", "TreePine", "Sprout", "Clover",
  "Infinity", "Hash", "AtSign", "Percent", "Binary",
  "Megaphone", "Siren", "AlertTriangle", "Info", "HelpCircle",
  "ThumbsUp", "ThumbsDown", "Smile", "Frown", "Meh",
  "Camera", "Image", "Film", "Video", "Tv",
  "Wifi", "Bluetooth", "Signal", "Satellite", "Radio",
  "Cpu", "HardDrive", "Server", "Database", "Cloud",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const SelectedIcon = icons[value] ?? LucideIcons.Award;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return POPULAR_ICONS;
    return POPULAR_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground transition-colors hover:border-white/[0.14]"
      >
        <SelectedIcon className="h-5 w-5" />
        <span className="max-w-[120px] truncate">{value}</span>
        <ChevronDown className="h-4 w-4 text-white/40" />
      </button>

      <AnimatedModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSearch("");
        }}
        title="İkon seç"
        className="max-w-md"
      >
        <div className="space-y-3 p-6 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İkon ara..."
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-white/16"
              autoFocus
            />
          </div>
          <div className="grid max-h-60 grid-cols-8 gap-1 overflow-y-auto">
            {filtered.map((name) => {
              const Ic = icons[name];
              if (!Ic) return null;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setSearch("");
                  }}
                  title={name}
                  className={cn(
                    "flex items-center justify-center rounded-xl p-1.5 transition-colors hover:bg-white/[0.08]",
                    value === name && "bg-white/[0.1] ring-1 ring-white/20",
                  )}
                >
                  <Ic className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-white/45">Sonuç bulunamadı</p>
          )}
        </div>
      </AnimatedModal>
    </>
  );
}
