/**
 * RENO's deterministic FAQ matcher. No AI, no network: it scores the visitor's text
 * against the questions and keywords of the local knowledge base and either answers,
 * suggests close matches, or admits it doesn't know. It never composes new answers.
 */
import type { RenoFaq } from "@/content/reno/faq";
import { normalizeText, tokenize } from "./normalize";

export type MatchResult =
  | { kind: "answer"; entry: RenoFaq; score: number; suggestions: RenoFaq[] }
  | { kind: "suggest"; suggestions: RenoFaq[] }
  | { kind: "none" };

/** Confidence needed to answer directly, and to offer "did you mean" suggestions. */
export const ANSWER_THRESHOLD = 0.55;
export const SUGGEST_THRESHOLD = 0.22;

type Prepared = { entry: RenoFaq; phrases: Array<{ text: string; tokens: string[] }>; keywords: Array<{ text: string; tokens: string[] }> };

const cache = new WeakMap<RenoFaq[], Prepared[]>();

function prepare(faq: RenoFaq[]): Prepared[] {
  const hit = cache.get(faq);
  if (hit) return hit;
  const prepared = faq.map((entry) => ({
    entry,
    phrases: [...entry.questions.ar, ...entry.questions.en].map((q) => ({ text: normalizeText(q), tokens: tokenize(q) })),
    keywords: entry.keywords.map((k) => ({ text: normalizeText(k), tokens: tokenize(k) })),
  }));
  cache.set(faq, prepared);
  return prepared;
}

function overlap(a: string[], b: string[]): number {
  const set = new Set(b);
  return new Set(a.filter((t) => set.has(t))).size;
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

/** Score in [0, 1] for one entry; only an exact phrasing reaches 1. */
export function scoreEntry(query: string, p: Prepared): number {
  const qText = normalizeText(query);
  const qTokens = tokenize(query);
  if (!qText) return 0;

  let best = 0;
  for (const phrase of p.phrases) {
    if (phrase.text === qText) return 1;
    const shared = overlap(qTokens, phrase.tokens);
    if (shared > 0) {
      const uq = new Set(qTokens).size;
      const up = new Set(phrase.tokens).size;
      // Dice coefficient on meaningful tokens.
      best = Math.max(best, Math.min(0.95, (2 * shared) / (uq + up)));
    }
    // A short query fully contained in a known phrasing ("سمارت هوم", "home cinema").
    if (qText.length >= 4 && containsPhrase(phrase.text, qText)) best = Math.max(best, 0.7);
  }

  let bonus = 0;
  for (const k of p.keywords) {
    if (!k.text) continue;
    if (k.text.includes(" ") ? containsPhrase(qText, k.text) : k.tokens.length > 0 && overlap(qTokens, k.tokens) === k.tokens.length) {
      bonus += k.text.includes(" ") ? 0.3 : 0.18;
    } else if (!k.text.includes(" ") && containsPhrase(qText, k.text)) {
      bonus += 0.18;
    }
  }
  return Math.min(0.99, best + Math.min(bonus, 0.45));
}

export function matchQuestion(query: string, faq: RenoFaq[]): MatchResult {
  if (!normalizeText(query)) return { kind: "none" };
  const ranked = prepare(faq)
    .map((p) => ({ entry: p.entry, score: scoreEntry(query, p) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top || top.score < SUGGEST_THRESHOLD) return { kind: "none" };
  const visible = ranked.filter((r) => !r.entry.hidden);
  if (top.score >= ANSWER_THRESHOLD) {
    return {
      kind: "answer",
      entry: top.entry,
      score: top.score,
      suggestions: visible.filter((r) => r.entry.id !== top.entry.id && r.score >= SUGGEST_THRESHOLD).slice(0, 2).map((r) => r.entry),
    };
  }
  const suggestions = visible.filter((r) => r.score >= SUGGEST_THRESHOLD).slice(0, 3).map((r) => r.entry);
  return suggestions.length ? { kind: "suggest", suggestions } : { kind: "none" };
}

/** Entry by id (for chips and related questions). */
export function faqById(faq: RenoFaq[], id: string): RenoFaq | undefined {
  return faq.find((f) => f.id === id);
}
