"use client";

import { LenisProvider } from "@/components/providers/LenisProvider";
import { PremiumShell } from "@/components/premium";
import { MarketingRouteReset } from "@/components/premium/MarketingRouteReset";
import { LandingEntranceCurtain } from "@/components/landing/LandingEntranceCurtain";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingMarquee } from "@/components/landing/marquee";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TrendingSection } from "@/components/landing/TrendingSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { useMarketingRemountKey } from "@/hooks/useMarketingRemountKey";
import { useTranslation } from "@/hooks/useTranslation";

export function LandingExperience() {
  const remountKey = useMarketingRemountKey("/");
  const { t } = useTranslation();

  const marqueeItems = [
    t("landingMarquee0"),
    t("landingMarquee1"),
    t("landingMarquee2"),
    t("landingMarquee3"),
    t("landingMarquee4"),
    t("landingMarquee5"),
    t("landingMarquee6"),
    t("landingMarquee7"),
  ];

  return (
    <LenisProvider key={`landing-lenis-${remountKey}`}>
      <MarketingRouteReset />
      <LandingEntranceCurtain />
      <PremiumShell variant="landing" threeIntensity="landing" className="text-foreground">
        <div key={`landing-shell-${remountKey}`}>
          <LandingNavbar />
          <main>
            <HeroSection />
            <LandingMarquee items={marqueeItems} />
            <FeaturesSection />
            <TrendingSection />
            <CategoriesSection />
            <TestimonialsSection />
            <SocialProofSection />
            <PricingSection />
            <FaqSection />
            <CTASection />
          </main>
          <Footer />
        </div>
      </PremiumShell>
    </LenisProvider>
  );
}
