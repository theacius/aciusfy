import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { LanguageSync } from "@/components/providers/LanguageSync";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MobileMotionConfig } from "@/components/providers/MobileMotionConfig";
import { CapacitorNativeShell } from "@/components/providers/CapacitorNativeShell";
import { AdSenseReadyBridge } from "@/components/ads/AdSenseReadyBridge";
import { getAdSenseClientId, isAdSenseEnabled } from "@/lib/adsense";
import Script from "next/script";
import "@fontsource-variable/mona-sans/wght.css";
import "lenis/dist/lenis.css";
import "./globals.css";
import "@/styles/light-theme.css";
import "@/styles/badge-animations.css";
import "@/styles/decoration-animations.css";

export const metadata: Metadata = {
  title: "Aciusfy - Müziği Hisset, Anlamı Keşfet",
  description:
    "Yeni nesil müzik streaming platformu. Milyonlarca şarkıyı keşfet, playlistler oluştur ve müzik deneyimini yaşa.",
  icons: {
    icon: [{ url: "/branding/aciusfy-logo.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/branding/aciusfy-logo.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aciusfy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adClient = getAdSenseClientId();
  const adSense = isAdSenseEnabled() && adClient.startsWith("ca-pub-");
  return (
    <html
      lang="tr"
      className="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {adSense ? (
          <Script
            id="aciusfy-adsbygoogle"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClient)}`}
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        ) : null}
        {adSense ? <AdSenseReadyBridge /> : null}
        <SessionProvider>
          <LanguageSync />
          <ThemeProvider />
          <CapacitorNativeShell />
          <MobileMotionConfig>{children}</MobileMotionConfig>
        </SessionProvider>
      </body>
    </html>
  );
}
