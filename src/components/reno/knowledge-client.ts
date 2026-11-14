import type { RenoFaq, RenoLocale } from "@/content/reno/faq";
import { parseKnowledge, toFaq } from "@/lib/reno/knowledge";

export type LiveKnowledge = { faq: RenoFaq[]; facts: Record<string, string> };

export const NO_KNOWLEDGE: LiveKnowledge = { faq: [], facts: {} };

const cache = new Map<RenoLocale, Promise<LiveKnowledge>>();

/**
 * RENO's live knowledge (the site's catalogue and contact details), fetched once per
 * language from our own endpoint. If it can't be loaded he still answers from the
 * built-in FAQ, and the next call tries again.
 */
export function loadKnowledge(locale: RenoLocale): Promise<LiveKnowledge> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const request = fetch(`/api/reno/${locale}`, { credentials: "omit", headers: { Accept: "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      const k = parseKnowledge(data);
      return { faq: k.entries.map((e) => toFaq(e, locale)), facts: k.facts };
    })
    .catch(() => {
      cache.delete(locale);
      return NO_KNOWLEDGE;
    });
  cache.set(locale, request);
  return request;
}
