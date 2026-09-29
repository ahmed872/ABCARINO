import { describe, expect, it } from "vitest";
import { dirOf, isLocale, negotiateLocale, tf, tr } from "@/lib/i18n/config";
import en from "@/lib/i18n/dictionaries/en";
import ar from "@/lib/i18n/dictionaries/ar";

describe("locale negotiation", () => {
  it("prefers Arabic when the browser asks for it", () => {
    expect(negotiateLocale("ar-EG,ar;q=0.9,en;q=0.8")).toBe("ar");
  });
  it("respects quality ordering", () => {
    expect(negotiateLocale("fr;q=1, en;q=0.5, ar;q=0.9")).toBe("ar");
  });
  it("falls back when no supported language is present", () => {
    expect(negotiateLocale("fr-FR,de;q=0.8", "ar")).toBe("ar");
    expect(negotiateLocale(null)).toBe("en");
  });
  it("validates locales and direction", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
});

describe("bilingual content helpers", () => {
  it("returns the requested language when present", () => {
    expect(tr("ar", "Hello", "مرحبا")).toBe("مرحبا");
  });
  it("falls back to the other language instead of rendering empty", () => {
    expect(tr("ar", "Hello", "")).toBe("Hello");
    expect(tr("en", "  ", "مرحبا")).toBe("مرحبا");
  });
  it("reads suffixed fields", () => {
    expect(tf("en", { titleEn: "Smart Homes", titleAr: "المنازل الذكية" }, "title")).toBe("Smart Homes");
  });
});

describe("dictionaries", () => {
  const keys = (o: unknown, prefix = ""): string[] =>
    o && typeof o === "object"
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (Array.isArray(v) ? [`${prefix}${k}[${v.length}]`, ...v.flatMap((x, i) => keys(x, `${prefix}${k}[${i}].`))] : keys(v, `${prefix}${k}.`)))
      : [prefix];
  it("Arabic covers every English key (including list lengths)", () => {
    expect(keys(ar)).toEqual(keys(en));
  });
  it("has no empty strings", () => {
    const empty = (o: unknown): boolean => (typeof o === "string" ? o.trim() === "" : o && typeof o === "object" ? Object.values(o).some(empty) : false);
    expect(empty(en)).toBe(false);
    expect(empty(ar)).toBe(false);
  });
  it("never contains the wrong brand spelling", () => {
    const text = JSON.stringify([en, ar]);
    expect(text).not.toMatch(/ABQARINO|ABGARINO/i);
  });
});
