import type { Metadata } from "next";
import { appUrl } from "@/lib/env";
import { htmlLang, locales, ogLocale, tr, type Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/lib/settings-schema";
import type { PublicMedia } from "@/lib/content/queries";

type BuildArgs = {
  locale: Locale;
  settings: SiteSettings;
  /** Path without locale prefix, e.g. "/solutions/smart-lighting". */
  path: string;
  title?: string;
  description?: string;
  image?: PublicMedia | null;
  ogImageUrl?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
};

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function localized(locale: Locale, path: string) {
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Consistent, bilingual metadata for every public page (canonical + hreflang + OG + Twitter). */
export function buildMetadata({
  locale,
  settings,
  path,
  title,
  description,
  image,
  ogImageUrl,
  type = "website",
  noindex,
  publishedTime,
}: BuildArgs): Metadata {
  const siteName = tr(locale, settings.general.companyNameEn, settings.general.companyNameAr);
  const defaultTitle = tr(locale, settings.seo.titleEn, settings.seo.titleAr);
  const desc = description?.trim() || tr(locale, settings.seo.descriptionEn, settings.seo.descriptionAr);
  const fullTitle = title ? `${title} — ${siteName}` : defaultTitle;
  const canonical = absoluteUrl(localized(locale, path));
  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = absoluteUrl(localized(l, path));
  languages["x-default"] = absoluteUrl(localized(settings.localization.defaultLocale, path));

  const img = image?.url ?? ogImageUrl ?? `/brand/og-${locale}.png`;
  const imgWidth = image?.width ?? 1200;
  const imgHeight = image?.height ?? 630;
  const allowIndex = settings.seo.allowIndexing && !noindex;

  return {
    metadataBase: new URL(appUrl()),
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical, languages },
    openGraph: {
      type,
      url: canonical,
      siteName,
      title: fullTitle,
      description: desc,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      images: [{ url: absoluteUrl(img), width: imgWidth, height: imgHeight, alt: title ?? siteName }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [absoluteUrl(img)],
    },
    robots: allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    ...(settings.seo.googleVerification ? { verification: { google: settings.seo.googleVerification } } : {}),
  };
}

export function organizationJsonLd(locale: Locale, settings: SiteSettings, logoUrl: string) {
  const sameAs = Object.values(settings.social).filter((v) => /^https?:\/\//.test(v));
  const contactPoint =
    settings.contact.phone || settings.contact.email
      ? [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(settings.contact.phone ? { telephone: settings.contact.phone } : {}),
            ...(settings.contact.email ? { email: settings.contact.email } : {}),
            availableLanguage: ["English", "Arabic"],
          },
        ]
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${appUrl()}/#organization`,
    name: settings.general.companyNameEn || "ABCARINO",
    alternateName: settings.general.companyNameAr || "عبقرينو",
    url: absoluteUrl(`/${locale}`),
    logo: absoluteUrl(logoUrl),
    description: tr(locale, settings.seo.descriptionEn, settings.seo.descriptionAr),
    ...(sameAs.length ? { sameAs } : {}),
    ...(contactPoint ? { contactPoint } : {}),
  };
}

export function websiteJsonLd(locale: Locale, settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${appUrl()}/#website`,
    url: absoluteUrl(`/${locale}`),
    name: settings.general.companyNameEn || "ABCARINO",
    alternateName: settings.general.companyNameAr || "عبقرينو",
    inLanguage: htmlLang[locale],
    publisher: { "@id": `${appUrl()}/#organization` },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
