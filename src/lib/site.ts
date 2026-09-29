import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getMedia, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

/** Common per-request context for public pages. */
export async function siteContext(params: Promise<{ locale: string }>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const settings = await getSettings();
  return { locale, settings, t: getDictionary(locale) };
}

export async function getNonce(): Promise<string | undefined> {
  return (await headers()).get("x-nonce") ?? undefined;
}

export async function getLogoMedia(logoMediaId: string) {
  return logoMediaId ? await getMedia(logoMediaId) : null;
}
