import type { MetadataRoute } from "next";
import { queryArticles, queryCatalog, queryProjects, querySettings } from "@/lib/content/queries";
import { locales } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Bilingual sitemap with hreflang alternates. Only published/activated content is listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await querySettings();
  if (!settings.seo.allowIndexing) return [];
  const { solutions, packages } = await queryCatalog();
  const s = settings.sections;

  const entries: Array<{ path: string; lastModified?: string; priority: number }> = [
    { path: "", priority: 1 },
    { path: "/solutions", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
    ...solutions
      .filter((x) => x.status === "available" || s.showComingSoon)
      .map((x) => ({ path: `/solutions/${x.slug}`, lastModified: x.updatedAt, priority: x.status === "available" ? 0.8 : 0.5 })),
  ];
  if (s.showPackages) {
    entries.push({ path: "/packages", priority: 0.8 });
    entries.push(...packages.map((p) => ({ path: `/packages/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })));
  }
  if (s.showProjects) {
    entries.push({ path: "/projects", priority: 0.7 });
    entries.push(...(await queryProjects()).map((p) => ({ path: `/projects/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })));
  }
  if (s.showPartners) entries.push({ path: "/partners", priority: 0.4 });
  if (s.showInsights) {
    entries.push({ path: "/insights", priority: 0.6 });
    entries.push(...(await queryArticles()).map((a) => ({ path: `/insights/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })));
  }

  return entries.flatMap((e) =>
    locales.map((locale) => ({
      url: absoluteUrl(`/${locale}${e.path}`),
      lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
      changeFrequency: "weekly" as const,
      priority: e.priority,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((l) => [l, absoluteUrl(`/${l}${e.path}`)]),
          ["x-default", absoluteUrl(`/${settings.localization.defaultLocale}${e.path}`)],
        ]),
      },
    })),
  );
}
