"use client";

import { LenisProvider } from "@/components/providers/LenisProvider";
import { PremiumShell } from "@/components/premium";
import { PremiumSiteNav } from "@/components/landing/LandingNavbar";
import { MarketingRouteReset } from "@/components/premium/MarketingRouteReset";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      <MarketingRouteReset />
      <PremiumShell variant="marketing" threeIntensity="landing" className="min-h-screen text-foreground">
        <PremiumSiteNav variant="marketing" />
        <div className="premium-nav-offset flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="relative z-10 w-full max-w-md">{children}</div>
        </div>
      </PremiumShell>
    </LenisProvider>
  );
}
