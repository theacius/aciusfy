"use client";

import { AciusfyLandingWordmark } from "@/components/branding/AciusfyLandingWordmark";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const footerLinksStatic = {
  Platform: [
    { label: "Özellikler", href: "#features" },
    { label: "Keşfet", href: "#categories" },
    { label: "Fiyatlandırma", href: "#pricing" },
    { label: "SSS", href: "#faq" },
  ],
  Destek: [
    { label: "İletişim", href: "#" },
    { label: "Geri Bildirim", href: "#" },
    { label: "İndir", href: "/download" },
  ],
  Yasal: [
    { label: "Gizlilik Politikası", href: "#" },
    { label: "Kullanım Şartları", href: "#" },
    { label: "Çerez Politikası", href: "#" },
  ],
};

export function Footer() {
  const { t } = useTranslation();
  const footerLinks = {
    ...footerLinksStatic,
    Platform: [
      ...footerLinksStatic.Platform,
      { label: t("landingDiscordBotNav"), href: "/discord-bot" },
    ],
  };

  return (
    <footer className="border-t border-white/[0.06] bg-[#09090b]/80 px-4 py-16 backdrop-blur-md sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-1">
            <Link
              href="/"
              className="inline-flex rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
              aria-label="Aciusfy"
            >
              <AciusfyLandingWordmark variant="navbar" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">{t("landingFooterTagline")}</p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/[0.06] pt-8 text-center text-xs text-muted sm:text-sm">
          &copy; {new Date().getFullYear()} Aciusfy. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
