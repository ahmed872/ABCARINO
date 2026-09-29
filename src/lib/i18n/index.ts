import en, { type Dictionary } from "./dictionaries/en";
import ar from "./dictionaries/ar";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Build a locale-prefixed internal path: lp("ar", "/solutions") → "/ar/solutions". */
export function lp(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

export type { Dictionary };
export * from "./config";
