import { RENO_FAQ } from "@/content/reno/faq";
import { getArticles, getCatalog, getPartners, getProjects, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildKnowledge, type RenoKnowledge } from "@/lib/reno/knowledge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Solutions the hand-written FAQ already answers: they get live facts instead of a second entry. */
const COVERED = new Set(
  RENO_FAQ.flatMap((f) => (f.action?.type === "link" && f.action.href.startsWith("/solutions/") ? [f.action.href.slice("/solutions/".length)] : [])),
);

const EMPTY: RenoKnowledge = { entries: [], facts: {} };

/**
 * RENO's live knowledge for one language: public content only (the same catalogue, settings
 * and page copy the site already shows), read through the cached public read-models.
 * No input besides the locale, no cookies, nothing written.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return Response.json({ error: "Unknown locale" }, { status: 404 });
  const settings = await getSettings();
  let body = EMPTY;
  if (!settings.maintenance.enabled) {
    const [catalog, projects, partners, articles] = await Promise.all([getCatalog(), getProjects(), getPartners(), getArticles()]);
    body = buildKnowledge({ locale, t: getDictionary(locale), catalog, settings, projects, partners, articles, coveredSolutionSlugs: COVERED, formatPrice });
  }
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff" } });
}
