"use client";

import { FocusCards } from "@/components/ui/focus-cards";
import { useTranslation } from "@/hooks/useTranslation";
import { LandingSection } from "@/components/landing/section-shell";

const categories = [
  { title: "Pop", src: "/images/genre-pop.jpg", color: "#a78bfa" },
  { title: "Rock", src: "/images/genre-rock.jpg", color: "#d4d4d8" },
  { title: "Hip-Hop", src: "/images/genre-hiphop.jpg", color: "#fafafa" },
  { title: "Elektronik", src: "/images/genre-electronic.jpg", color: "#a1a1aa" },
  { title: "Jazz", src: "/images/genre-jazz.jpg", color: "#e4e4e7" },
  { title: "R&B", src: "/images/genre-rnb.jpg", color: "#c4b5fd" },
  { title: "Klasik", src: "/images/genre-classical.jpg", color: "#71717a" },
  { title: "Indie", src: "/images/genre-indie.jpg", color: "#f4f4f5" },
];

export function CategoriesSection() {
  const { t } = useTranslation();

  return (
    <LandingSection
      id="categories"
      eyebrow={t("landingNavExplore")}
      title={
        <>
          {t("landingCategoriesTitleBefore")}
          <span className="text-foreground/50">{t("landingCategoriesTitleAccent")}</span>
        </>
      }
      description={t("landingCategoriesLead")}
    >
      <FocusCards cards={categories} />
    </LandingSection>
  );
}
