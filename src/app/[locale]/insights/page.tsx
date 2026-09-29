import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Visual } from "@/components/site/Visual";
import { getArticleCategories, getArticles, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tf } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { siteContext } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/insights", title: t.insights.eyebrow, description: t.insights.intro });
}

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showInsights) notFound();
  const [articles, cats] = await Promise.all([getArticles(), getArticleCategories()]);
  const catById = new Map(cats.map((c) => [c.id, c]));
  return (
    <>
      <PageHero eyebrow={t.insights.eyebrow} title={t.insights.title} intro={t.insights.intro} />
      <section className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          {!articles.length ? <p className="text-graphite">{t.insights.empty}</p> : null}
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => {
              const cat = a.categoryId ? catById.get(a.categoryId) : undefined;
              return (
                <Link key={a.id} href={`/${locale}/insights/${a.slug}`} className="group block" data-reveal>
                  <Visual media={a.image} visualKey={cat?.visualKey ?? "lighting"} uid={`art-${a.slug}`} locale={locale} className="aspect-[16/10] rounded-2xl" sizes="(min-width: 1024px) 33vw, 50vw" />
                  <p className="eyebrow mt-5 text-stone">
                    {cat ? `${tf(locale, cat, "name")} · ` : ""}
                    {formatDate(a.publishedAt, locale)}
                  </p>
                  <h2 className="mt-2 text-xl font-medium tracking-tight group-hover:underline">{tf(locale, a, "title")}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-graphite">{tf(locale, a, "excerpt")}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
