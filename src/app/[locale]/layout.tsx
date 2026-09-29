import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { fontVariables } from "../fonts";
import { Mark } from "@/components/brand/Mark";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { RevealObserver } from "@/components/site/RevealObserver";
import { getCurrentUser } from "@/lib/auth/session";
import { getMedia, getSettings } from "@/lib/content/public";
import { dirOf, getDictionary, htmlLang, isLocale, locales, tr } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { getLogoMedia } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

// Pages read live CMS data (cached in the data cache) and carry a per-request CSP nonce.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0e0f11",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSettings();
  const favicon = settings.general.faviconMediaId ? await getMedia(settings.general.faviconMediaId) : null;
  const ogImage = settings.seo.ogImageMediaId ? await getMedia(settings.seo.ogImageMediaId) : null;
  // Site-wide defaults only. Canonical, hreflang and robots are page-specific (every page
  // sets them); inheriting the home page's values here gave 404s a canonical to "/".
  const { alternates: _alternates, robots: _robots, ...defaults } = buildMetadata({ locale, settings, path: "/", image: ogImage });
  void _alternates;
  void _robots;
  return {
    ...defaults,
    applicationName: "ABCARINO",
    icons: {
      icon: favicon ? [{ url: favicon.url }] : [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const settings = await getSettings();

  const maintenance = settings.maintenance.enabled && !(await getCurrentUser());
  const logo = await getLogoMedia(settings.general.logoMediaId);
  const wa = whatsappLink(
    settings.contact.whatsappNumber,
    tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr),
  );

  return (
    <html lang={htmlLang[locale]} dir={dirOf(locale)} className={fontVariables}>
      <body className="min-h-dvh">
        {maintenance ? (
          <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center text-paper">
            <Mark tone="paper" className="h-16 w-16" />
            <h1 className="display-3 mt-10">{t.maintenance.title}</h1>
            <p className="lead mt-5 max-w-lg text-paper/60">
              {tr(locale, settings.maintenance.messageEn, settings.maintenance.messageAr)}
            </p>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-10 rounded-full bg-signal px-6 py-3 font-medium text-white">
                {tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr)}
              </a>
            ) : null}
          </main>
        ) : (
          <>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
            >
              {t.nav.skip}
            </a>
            <Header locale={locale} t={t} settings={settings} logo={logo} />
            <main id="main">{children}</main>
            <Footer locale={locale} t={t} settings={settings} />
            {wa ? <FloatingWhatsApp href={wa} label={tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr)} /> : null}
            <RevealObserver />
          </>
        )}
      </body>
    </html>
  );
}
