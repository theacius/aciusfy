"use client";

import { LenisProvider } from "@/components/providers/LenisProvider";
import { PremiumShell } from "@/components/premium";
import { PremiumSiteNav } from "@/components/landing/LandingNavbar";
import { MarketingRouteReset } from "@/components/premium/MarketingRouteReset";

export function MarketingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
      <MarketingRouteReset />
      <PremiumShell variant="marketing" threeIntensity="landing" className="font-sans text-foreground">
        {children}
      </PremiumShell>
    </LenisProvider>
  );
}

export function MarketingPageWithNav({
  children,
  navVariant = "marketing",
}: {
  children: React.ReactNode;
  navVariant?: "marketing" | "discord";
}) {
  return (
    <MarketingPageShell>
      <PremiumSiteNav variant={navVariant} />
      <div className="premium-nav-offset">{children}</div>
    </MarketingPageShell>
  );
}
