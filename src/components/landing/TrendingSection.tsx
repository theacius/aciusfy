"use client";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";
import Image from "next/image";

const trendingSongs = [
  { title: "Gece Gölgenin Rahatına Bak", artist: "Çağatay Akman", cover: "https://cdn-images.dzcdn.net/images/cover/995fea8e0368a42d8eb70086631be254/1000x1000-000000-80-0-0.jpg" },
  { title: "Gel", artist: "Mabel Matiz", cover: "https://cdn-images.dzcdn.net/images/cover/e04972572e698675b5579424392d5af1/1000x1000-000000-80-0-0.jpg" },
  { title: "Ela", artist: "Reynmen", cover: "https://cdn-images.dzcdn.net/images/cover/c4d805f23ae6934516507b48ad06fbbb/1000x1000-000000-80-0-0.jpg" },
  { title: "Kuzu Kuzu", artist: "Tarkan", cover: "https://cdn-images.dzcdn.net/images/cover/69e0ae06617a32508cc77a0b8eb67d10/1000x1000-000000-80-0-0.jpg" },
  { title: "Geceler", artist: "Sagopa Kajmer", cover: "https://cdn-images.dzcdn.net/images/cover/5e6bc8de3c2eaa2b9ec282674b9c7084/1000x1000-000000-80-0-0.jpg" },
  { title: "Cambaz", artist: "Mor ve Ötesi", cover: "https://cdn-images.dzcdn.net/images/cover/ce3df29b1b2fc81961722e5ef07f3d6c/1000x1000-000000-80-0-0.jpg" },
  { title: "Şımarık", artist: "Tarkan", cover: "https://cdn-images.dzcdn.net/images/cover/e6b020b3a610d615164d01fc2298fd61/1000x1000-000000-80-0-0.jpg" },
  { title: "Bir Kadın Çizeceksin", artist: "maNga", cover: "https://cdn-images.dzcdn.net/images/cover/4e1d47cf51bb4636b07bd7c55245f58d/1000x1000-000000-80-0-0.jpg" },
];

export function TrendingSection() {
  const { t } = useTranslation();

  const cards = trendingSongs.map((song, idx) => (
    <div
      key={idx}
      className="landing-bento-card flex w-64 flex-shrink-0 flex-col overflow-hidden p-0"
    >
      <div className="relative aspect-square">
        <Image src={song.cover} alt={song.title} fill sizes="200px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
      </div>
    </div>
  ));

  return (
    <LandingSection
      eyebrow={t("landingNavExplore")}
      title={
        <>
          {t("landingTrendingTitleBefore")}
          <span className="text-foreground/50">{t("landingTrendingTitleAccent")}</span>
        </>
      }
      headerClassName="mb-10 sm:mb-12"
    >
      <InfiniteMovingCards items={cards} speed="slow" />
    </LandingSection>
  );
}
