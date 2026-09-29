import type { Metadata } from "next";
import { SolutionCard } from "@/components/site/Cards";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { JsonLd } from "@/components/site/Primitives";
import { getCatalog, getSettings } from "@/lib/content/public";
import { isLocale, tf, getDictionary } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/solutions", title: t.solutions.eyebrow, description: t.solutions.intro });
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  const { categories, solutions } = await getCatalog();
  const nonce = await getNonce();
  const visible = settings.sections.showComingSoon ? solutions : solutions.filter((s) => s.status === "available");
  const rank = (s: (typeof visible)[number]) => (s.status === "available" ? 0 : 1);
  const groups = [
    ...categories.map((c) => ({ key: c.id, category: c as (typeof categories)[number] | undefined, items: visible.filter((s) => s.categoryId === c.id) })),
    { key: "other", category: undefined, items: visible.filter((s) => !s.categoryId || !categories.some((c) => c.id === s.categoryId)) },
  ]
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => rank(a) - rank(b)) }))
    .filter((g) => g.items.length);

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd([
          { name: t.nav.home, path: `/${locale}` },
          { name: t.nav.solutions, path: `/${locale}/solutions` },
        ])}
      />
      <PageHero eyebrow={t.solutions.eyebrow} title={t.solutions.title} intro={t.solutions.intro}>
        {categories.length ? (
          <ul className="mt-12 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <a href={`#${c.slug}`} className="inline-flex rounded-full border border-paper/15 px-4 py-2 text-sm text-paper/70 transition-colors hover:border-paper/40 hover:text-paper">
                  {tf(locale, c, "name")}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </PageHero>

      <section className="bg-paper">
        <div className="container-x space-y-20 py-20 lg:space-y-28 lg:py-28">
          {!visible.length ? <p className="text-graphite">{t.solutions.empty}</p> : null}
          {groups.map(({ key, category, items }) => (
            <div key={key} id={category?.slug} className="scroll-mt-28 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-3" data-reveal>
                <div className="lg:sticky lg:top-28">
                  <h2 className="text-2xl font-medium tracking-tight lg:text-3xl">{category ? tf(locale, category, "name") : t.nav.solutions}</h2>
                  {category ? <p className="mt-3 text-sm leading-relaxed text-graphite">{tf(locale, category, "description")}</p> : null}
                  <p className="eyebrow mt-5 text-stone">
                    {items.filter((s) => s.status === "available").length ? `${items.filter((s) => s.status === "available").length} · ${t.solutions.availableNow}` : t.solutions.inPreparation}
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-9">
                {items.map((s) => (
                  <div key={s.id} data-reveal>
                    <SolutionCard solution={s} locale={locale} t={t} uid={`sol-${s.slug}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
