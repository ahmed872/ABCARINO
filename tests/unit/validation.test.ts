import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "@/lib/settings-schema";
import { articleSchema, packageSchema, slugSchema } from "@/lib/validation/content";
import { leadInputSchema } from "@/lib/validation/lead";

const pkgBase = {
  slug: "smart-lighting",
  categoryId: "",
  nameEn: "Smart Lighting",
  nameAr: "الإضاءة الذكية",
  taglineEn: "",
  taglineAr: "",
  descriptionEn: "",
  descriptionAr: "",
  includedFeatures: [{ en: "A", ar: "أ" }, { en: "", ar: "" }],
  optionalFeatures: [],
  imageId: "",
  gallery: [],
  visualKey: "lighting",
  price: "",
  currency: "egp",
  priceNoteEn: "",
  priceNoteAr: "",
  status: "available",
  featured: false,
  sortOrder: 0,
  ctaLabelEn: "",
  ctaLabelAr: "",
  solutionIds: [],
  seoTitleEn: "",
  seoTitleAr: "",
  seoDescriptionEn: "",
  seoDescriptionAr: "",
};

describe("package validation", () => {
  it("accepts price on request without a price and cleans empty rows", () => {
    const r = packageSchema.parse({ ...pkgBase, pricingMode: "contact" });
    expect(r.price).toBeNull();
    expect(r.currency).toBe("EGP");
    expect(r.includedFeatures).toHaveLength(1);
  });
  it("requires a price for fixed / starting-from modes", () => {
    expect(packageSchema.safeParse({ ...pkgBase, pricingMode: "fixed" }).success).toBe(false);
    expect(packageSchema.parse({ ...pkgBase, pricingMode: "starting_from", price: "25,000" }).price).toBe("25000");
  });
  it("rejects invalid amounts", () => {
    expect(packageSchema.safeParse({ ...pkgBase, pricingMode: "fixed", price: "-5" }).success).toBe(false);
  });
});

describe("slugs", () => {
  it("accepts clean slugs and rejects unsafe ones", () => {
    expect(slugSchema.parse("Smart-Homes")).toBe("smart-homes");
    expect(slugSchema.safeParse("../etc").success).toBe(false);
    expect(slugSchema.safeParse("a--b").success).toBe(false);
  });
});

describe("articles", () => {
  const base = { slug: "guide", categoryId: "", titleEn: "Guide", titleAr: "", excerptEn: "", excerptAr: "", bodyEn: "", bodyAr: "", imageId: "", seoTitleEn: "", seoTitleAr: "", seoDescriptionEn: "", seoDescriptionAr: "" };
  it("requires a date when scheduled", () => {
    expect(articleSchema.safeParse({ ...base, status: "scheduled", publishedAt: "" }).success).toBe(false);
    expect(articleSchema.safeParse({ ...base, status: "scheduled", publishedAt: "2030-01-01T10:00" }).success).toBe(true);
  });
  it("requires a title in at least one language", () => {
    expect(articleSchema.safeParse({ ...base, titleEn: "", status: "draft", publishedAt: "" }).success).toBe(false);
  });
});

describe("lead validation", () => {
  const lead = { name: "Mona", phone: "", email: "", projectType: "", message: "", preferredContact: "whatsapp", locale: "ar", sourcePath: "/ar/contact" };
  it("needs a phone or an email", () => {
    expect(leadInputSchema.safeParse(lead).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...lead, phone: "+20 100 123 4567" }).success).toBe(true);
    expect(leadInputSchema.safeParse({ ...lead, email: "mona@example.com" }).success).toBe(true);
  });
  it("rejects malformed input", () => {
    expect(leadInputSchema.safeParse({ ...lead, email: "not-an-email" }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...lead, phone: "call me" }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...lead, phone: "0100", name: "M" }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...lead, email: "a@b.co", message: "x".repeat(3001) }).success).toBe(false);
  });
});

describe("settings", () => {
  it("provides complete defaults with the correct brand spelling", () => {
    expect(defaultSettings.general.companyNameEn).toBe("ABCARINO");
    expect(defaultSettings.general.companyNameAr).toBe("عبقرينو");
    expect(defaultSettings.sections.showProjects).toBe(false);
    expect(defaultSettings.sections.showPartners).toBe(false);
    expect(defaultSettings.sections.showInsights).toBe(false);
    expect(defaultSettings.contact.whatsappNumber).toBe("");
  });
  it("merges stored values and falls back per group on invalid data", () => {
    const s = parseSettings([
      { key: "contact", value: { whatsappNumber: "+201001234567" } },
      { key: "sections", value: { showProjects: "yes-please" } },
    ]);
    expect(s.contact.whatsappNumber).toBe("+201001234567");
    expect(s.contact.whatsappMessageEn).toContain("ABCARINO");
    expect(s.sections.showProjects).toBe(false);
  });
});
