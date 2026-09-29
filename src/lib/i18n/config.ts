export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "abc_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export const ogLocale: Record<Locale, string> = { en: "en_US", ar: "ar_EG" };
export const htmlLang: Record<Locale, string> = { en: "en", ar: "ar" };

/**
 * Pick the value for a locale from a bilingual pair, falling back to the other
 * language when one side has not been written yet (so pages never render empty).
 */
export function tr(locale: Locale, en: string | null | undefined, ar: string | null | undefined): string {
  const primary = locale === "ar" ? ar : en;
  const fallback = locale === "ar" ? en : ar;
  return (primary && primary.trim()) || fallback || "";
}

/** Same as `tr` for objects with `En`/`Ar` suffixed keys: tf(locale, row, "title"). */
export function tf<T extends Record<string, unknown>>(locale: Locale, row: T, base: string): string {
  return tr(locale, row[`${base}En`] as string | undefined, row[`${base}Ar`] as string | undefined);
}

/** Resolve the best locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null | undefined, fallback: Locale = defaultLocale): Locale {
  if (!acceptLanguage) return fallback;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return fallback;
}
