"use client";

import { cn } from "@/lib/utils";

export type GenreVisualKind = "eq" | "spike" | "flow" | "grid" | "orb";

/** Slug’a göre hangi yapay görsel kümesinin kullanılacağını seçer */
function inferVisualKind(slug: string): GenreVisualKind {
  const s = slug.toLowerCase();
  if (/(phonk|trap|drill)/.test(s)) return "spike";
  if (/(metal|rock|grunge)/.test(s)) return "spike";
  if (/(jazz|blues)/.test(s)) return "flow";
  if (/(arabesk|fantez|classical|turk-halk|halk)/.test(s)) return "flow";
  if (/(folk|country|acoustic)/.test(s)) return "flow";
  if (/(edm|electronic|electro|house)/.test(s)) return "grid";
  if (/(lofi|ambient|dream|chill)/.test(s)) return "orb";
  if (/(pop|rnb|indie)/.test(s)) return "orb";
  if (/(rap|hip|hiphop)/.test(s)) return "eq";
  const idx = [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5;
  return (["eq", "spike", "flow", "grid", "orb"] as const)[idx];
}

const KIND_AI_SRC: Record<GenreVisualKind, string> = {
  eq: "/smart-radio/genres/genre-radio-ai-eq.png",
  spike: "/smart-radio/genres/genre-radio-ai-spike.png",
  flow: "/smart-radio/genres/genre-radio-ai-flow.png",
  grid: "/smart-radio/genres/genre-radio-ai-grid.png",
  orb: "/smart-radio/genres/genre-radio-ai-orb.png",
};

type Props = {
  genreSlug: string;
  /** Genre rengi — ince çerçeve / gölgede kullanılır */
  color: string;
  className?: string;
  /** Piksel kenar uzunluğu (kare) */
  size?: number;
};

export function GenreRadioPoster({ genreSlug, color, size = 40, className }: Props) {
  const kind = inferVisualKind(genreSlug || "genre");
  const src = KIND_AI_SRC[kind];

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20", className)}
      style={{ width: size, height: size, boxShadow: `0 0 0 1px ${color}35` }}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        className="pointer-events-none h-full w-full object-cover select-none"
      />
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-black/25" aria-hidden />
    </div>
  );
}
