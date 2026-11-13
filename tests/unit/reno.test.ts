import { describe, expect, it } from "vitest";
import { RENO_CATEGORIES, RENO_FAQ } from "@/content/reno/faq";
import { matchQuestion } from "@/lib/reno/matcher";
import { normalizeText, tokenize } from "@/lib/reno/normalize";

const answerId = (q: string) => {
  const r = matchQuestion(q, RENO_FAQ);
  return r.kind === "answer" ? r.entry.id : r.kind;
};

describe("Arabic/English normalisation", () => {
  it("unifies alef, ya, ta marbuta, hamza carriers, diacritics, tatweel and digits", () => {
    expect(normalizeText("أإآا")).toBe("اااا");
    expect(normalizeText("يعنى")).toBe(normalizeText("يعني"));
    expect(normalizeText("الإضاءة")).toBe("الاضاءه");
    expect(normalizeText("مُـــؤَسَّسَة")).toBe("موسسه");
    expect(normalizeText("٢٠٢٦ ۲۱۸۶")).toBe("2026 2186");
    expect(normalizeText("Smart-Home?!")).toBe("smart home");
  });
  it("maps synonyms and dialect spellings to one token, and drops filler words", () => {
    expect(tokenize("عاوز منزل سمارت")).toEqual(tokenize("عايز بيت ذكي"));
    expect(tokenize("the lights")).toEqual(tokenize("الإضاءة"));
    expect(tokenize("هل ممكن في")).toEqual([]);
  });
});

describe("FAQ matching", () => {
  it.each([
    ["مين ABCARINO؟", "about"],
    ["يعنى ايه سمارت هوم", "smart-home"],
    ["عاوز احول منزلي لمنزل ذكى", "smart-home"],
    ["اقدر اتحكم فى الاضاءة من الموبايل", "lighting-app"],
    ["ينفع اتحكم في النور من التليفون", "lighting-app"],
    ["الستاير", "ac-curtains"],
    ["home cinema", "home-cinema"],
    ["do you build websites", "websites-apps"],
    ["عايز موقع", "websites-apps"],
    ["بكام", "quote"],
    ["where are you located", "where"],
    ["CCTV", "cameras"],
    ["What is building automation?", "home-vs-building"],
    ["انت مين", "reno"],
    ["شكرا", "thanks"],
  ])("answers %s → %s", (q, id) => {
    expect(answerId(q)).toBe(id);
  });

  it("matches every listed phrasing of every entry to that entry", () => {
    for (const entry of RENO_FAQ) {
      for (const q of [...entry.questions.ar, ...entry.questions.en]) {
        expect(answerId(q), `${entry.id}: ${q}`).toBe(entry.id);
      }
    }
  });

  it("never answers questions outside the knowledge base", () => {
    for (const q of ["ما هي عاصمة فرنسا", "recipe for pizza", "asdfgh", "هل عندكم ضمان؟", "", "   ؟؟؟ "]) {
      expect(matchQuestion(q, RENO_FAQ).kind, q).toBe("none");
    }
  });

  it("offers suggestions, not an answer, when the question is only close", () => {
    const r = matchQuestion("بتشتغلوا في اسكندرية؟", RENO_FAQ);
    expect(r.kind).toBe("suggest");
    if (r.kind === "suggest") expect(r.suggestions.map((s) => s.id)).toContain("where");
  });

  it("never suggests hidden small-talk entries", () => {
    const r = matchQuestion("عايز اعمل مشروع", RENO_FAQ);
    expect(r.kind).not.toBe("none");
    const ids = r.kind === "none" ? [] : r.suggestions.map((s) => s.id);
    for (const id of ids) expect(RENO_FAQ.find((f) => f.id === id)?.hidden).toBeFalsy();
  });
});

describe("FAQ data integrity", () => {
  it("has unique ids, bilingual questions and answers, valid categories and related ids", () => {
    const ids = new Set<string>();
    const cats = new Set<string>([...RENO_CATEGORIES.map((c) => c.id), "meta"]);
    for (const f of RENO_FAQ) {
      expect(ids.has(f.id), f.id).toBe(false);
      ids.add(f.id);
      expect(cats.has(f.category), f.id).toBe(true);
      expect(f.questions.ar.length, f.id).toBeGreaterThan(0);
      expect(f.questions.en.length, f.id).toBeGreaterThan(0);
      expect(f.answers.ar.trim().length, f.id).toBeGreaterThan(10);
      expect(f.answers.en.trim().length, f.id).toBeGreaterThan(10);
      expect(/[؀-ۿ]/.test(f.answers.ar), f.id).toBe(true);
    }
    for (const f of RENO_FAQ) for (const r of f.related ?? []) expect(ids.has(r), `${f.id} → ${r}`).toBe(true);
    for (const c of RENO_CATEGORIES) expect(RENO_FAQ.some((f) => f.category === c.id && !f.hidden), c.id).toBe(true);
  });

  it("links only to internal pages (the locale is added by the UI)", () => {
    for (const f of RENO_FAQ) {
      if (f.action?.type === "link") expect(f.action.href, f.id).toMatch(/^\/[a-z0-9/-]+$/);
    }
  });

  it("does not claim things ABCARINO has not published", () => {
    const text = RENO_FAQ.map((f) => `${f.answers.en} ${f.answers.ar}`).join(" ").toLowerCase();
    for (const banned of ["certified", "warranty", "guarantee", "partner", "award", "years of experience", "ضمان", "معتمد", "شريك", "جائزة"]) {
      expect(text, banned).not.toContain(banned);
    }
    expect(text).not.toMatch(/\+?\d[\d\s-]{7,}/); // no phone numbers: WhatsApp comes from site settings
  });
});
