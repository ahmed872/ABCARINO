/**
 * RENO's live knowledge: built only from what the site publishes (catalogue, settings,
 * page copy), honest where nothing is published, and matchable alongside the built-in FAQ.
 */
import { describe, expect, it } from "vitest";
import { RENO_FAQ } from "../../src/content/reno/faq";
import type { Catalog } from "../../src/lib/content/queries";
import ar from "../../src/lib/i18n/dictionaries/ar";
import en from "../../src/lib/i18n/dictionaries/en";
import { buildKnowledge, parseKnowledge, toFaq, type KnowledgeInput } from "../../src/lib/reno/knowledge";
import { matchQuestion } from "../../src/lib/reno/matcher";
import { settingsSchema } from "../../src/lib/settings-schema";

const l = (e: string, a: string) => ({ en: e, ar: a });
const catalog = {
  categories: [{ id: "c1", slug: "entertainment", nameEn: "Entertainment", nameAr: "الترفيه", descriptionEn: "Rooms built for picture and sound", descriptionAr: "غرف مصممة للصورة والصوت", visualKey: "x" }],
  solutions: [
    { id: "s1", slug: "home-cinema", categoryId: "c1", titleEn: "Home Cinema", titleAr: "السينما المنزلية", summaryEn: "A cinema at home", summaryAr: "سينما في البيت", status: "available", features: [l("Calibrated picture", "صورة مضبوطة"), l("Acoustic planning", "تخطيط صوتي")] },
    { id: "s2", slug: "driving-simulators", categoryId: "c1", titleEn: "Driving Simulators", titleAr: "محاكيات القيادة", summaryEn: "A cockpit that feels like the track", summaryAr: "كابينة تحسّسك بالحلبة", status: "coming_soon", features: [l("Motion platform", "منصة حركة")] },
  ],
  packages: [
    { id: "p1", slug: "smart-lighting-essentials", categoryId: null, nameEn: "Smart Lighting Essentials", nameAr: "أساسيات الإضاءة الذكية", taglineEn: "The simplest way to start", taglineAr: "أبسط بداية", includedFeatures: [l("Smart switches", "مفاتيح ذكية")], optionalFeatures: [], pricingMode: "starting_from", price: "25000", currency: "EGP", priceNoteEn: "", priceNoteAr: "", status: "available" },
  ],
} as unknown as Catalog;

const settings = (over: Record<string, unknown> = {}) => settingsSchema.parse(over);
const input = (locale: "en" | "ar", over: Partial<KnowledgeInput> = {}): KnowledgeInput => ({
  locale,
  t: locale === "ar" ? ar : en,
  catalog,
  settings: settings(),
  projects: [],
  partners: [],
  articles: [],
  coveredSolutionSlugs: new Set(["home-cinema"]),
  formatPrice: (amount, currency) => `${amount} ${currency}`,
  ...over,
});
const combined = (locale: "en" | "ar", over: Partial<KnowledgeInput> = {}) => {
  const k = buildKnowledge(input(locale, over));
  return { k, faq: [...RENO_FAQ, ...k.entries.map((e) => toFaq(e, locale))] };
};
const answer = (q: string, locale: "en" | "ar", over: Partial<KnowledgeInput> = {}) => {
  const { faq } = combined(locale, over);
  const r = matchQuestion(q, faq);
  return r.kind === "answer" ? { id: r.entry.id, text: r.entry.answers[locale] } : { id: r.kind, text: "" };
};

describe("live knowledge from the catalogue", () => {
  it("answers about a solution the built-in FAQ doesn't cover, with its status and features", () => {
    const a = answer("what is driving simulators", "en");
    expect(a.id).toBe("sol:driving-simulators");
    expect(a.text).toContain("A cockpit that feels like the track.");
    expect(a.text).toContain(en.solutions.inPreparation);
    expect(a.text).toContain("Motion platform");
    expect(answer("عندكم محاكيات القيادة؟", "ar").id).toBe("sol:driving-simulators");
  });

  it("adds live facts to hand-written answers instead of a second entry", () => {
    const { k, faq } = combined("en");
    expect(k.entries.some((e) => e.id === "sol:home-cinema")).toBe(false);
    expect(k.facts["/solutions/home-cinema"]).toContain(en.solutions.availableNow);
    expect(k.facts["/solutions/home-cinema"]).toContain("Calibrated picture");
    const r = matchQuestion("home cinema", faq);
    expect(r.kind === "answer" && r.entry.id).toBe("home-cinema");
  });

  it("lists what is available, what is coming, and each category", () => {
    expect(answer("which solutions are available", "en").text).toContain("Home Cinema");
    expect(answer("what is coming soon", "en").text).toContain("Driving Simulators");
    expect(answer("إيه المتاح دلوقتي؟", "ar").text).toContain("السينما المنزلية");
    expect(answer("Entertainment", "en").id).toBe("cat:entertainment");
  });

  it("hides coming-soon solutions when the site hides them", () => {
    const off = { settings: settings({ sections: { showComingSoon: false } }) };
    const { k } = combined("en", off);
    expect(k.entries.some((e) => e.id === "sol:driving-simulators" || e.id === "list:soon")).toBe(false);
  });

  it("shows a package price only when the site shows prices", () => {
    expect(answer("how much is Smart Lighting Essentials", "en").text).toContain(`${en.packages.pricing.starting_from}: 25000 EGP`);
    const hidden = answer("how much is Smart Lighting Essentials", "en", { settings: settings({ sections: { showPackagePrices: false } }) });
    expect(hidden.id).toBe("pkg:smart-lighting-essentials");
    expect(hidden.text).not.toContain("25000");
    expect(hidden.text).toContain(en.packages.pricing.contact);
    const { k } = combined("en", { settings: settings({ sections: { showPackages: false } }) });
    expect(k.entries.some((e) => e.category === "packages")).toBe(false);
  });
});

describe("live knowledge stays honest", () => {
  it("says so when hours, address, projects, brands and warranty terms aren't published", () => {
    expect(answer("what are your working hours", "en").text).toMatch(/aren't published/);
    expect(answer("where is your office", "en").text).toMatch(/isn't published/);
    expect(answer("do you have a portfolio", "en").text).toMatch(/haven't published projects/);
    expect(answer("which brands do you work with", "en").text).toMatch(/don't list brands/);
    expect(answer("is there a warranty", "en").text).toMatch(/aren't published/);
    expect(answer("فيه ضمان؟", "ar").text).toContain("مش منشورة");
  });

  it("uses contact details exactly as set in the site settings, and none otherwise", () => {
    const bare = combined("en").k;
    expect(bare.entries.some((e) => e.id === "contact:email" || e.id === "contact:phone")).toBe(false);
    expect(bare.facts["#contact"]).toBeUndefined();
    expect(JSON.stringify(bare)).not.toMatch(/\+?\d[\d\s-]{7,}/); // no phone-like numbers appear from nowhere

    const set = { settings: settings({ contact: { email: "hello@abcarino.test", phone: "+20 100 000 0000", businessHoursEn: "Sat–Thu, 10–6", addressEn: "1 Test St, Cairo" } }) };
    expect(answer("what is your email", "en", set).text).toContain("hello@abcarino.test");
    expect(answer("can I call you", "en", set).text).toContain("+20 100 000 0000");
    expect(answer("when are you open", "en", set).text).toContain("Sat–Thu, 10–6");
    expect(answer("where is your office", "en", set).text).toContain("1 Test St, Cairo");
    expect(combined("en", set).k.facts["#contact"]).toContain("hello@abcarino.test");
  });

  it("quotes the site's own copy for how we work and why", () => {
    const process = answer("what are the steps of a project", "en").text;
    for (const step of en.home.process) expect(process).toContain(step.title);
    expect(answer("what makes you different", "en").text).toContain(en.home.why[0].title);
    expect(answer("بتشتغلوا إزاي؟", "ar").text).toContain(ar.home.process[0].title);
  });
});

describe("combined knowledge base", () => {
  it.each(["en", "ar"] as const)("every phrasing still finds its own entry (%s)", (locale) => {
    const set = { settings: settings({ contact: { email: "hello@abcarino.test", phone: "+20 100 000 0000" } }) };
    const { faq } = combined(locale, set);
    const ids = new Set<string>();
    for (const f of faq) {
      expect(ids.has(f.id), f.id).toBe(false);
      ids.add(f.id);
      for (const q of [...f.questions.en, ...f.questions.ar]) {
        const r = matchQuestion(q, faq);
        expect(r.kind === "answer" ? r.entry.id : r.kind, `${f.id}: ${q}`).toBe(f.id);
      }
    }
    for (const f of faq) for (const r of f.related ?? []) expect(ids.has(r), `${f.id} → ${r}`).toBe(true);
  });

  it("forgives a typo in a longer word", () => {
    const { faq } = combined("en");
    const typo = matchQuestion("home cinema instalation price", faq);
    expect(typo.kind).not.toBe("none");
    const r = matchQuestion("what is driving simulatrs", faq);
    expect(r.kind === "answer" && r.entry.id).toBe("sol:driving-simulators");
    expect(matchQuestion("do you sell pizza", faq).kind).toBe("none");
  });

  it("survives the wire: malformed API data is dropped, not rendered", () => {
    const k = buildKnowledge(input("en"));
    expect(parseKnowledge(JSON.parse(JSON.stringify(k))).entries.length).toBe(k.entries.length);
    const bad = parseKnowledge({ entries: [null, { id: 1 }, { id: "x", category: "about", q: ["q"], alt: [], k: [], a: "ok", link: { href: "https://evil.example", label: "x" } }], facts: { a: 1, b: "fine" } });
    expect(bad.entries).toHaveLength(1);
    expect(bad.entries[0].link).toBeUndefined();
    expect(bad.facts).toEqual({ b: "fine" });
    expect(parseKnowledge("nope")).toEqual({ entries: [], facts: {} });
  });
});
