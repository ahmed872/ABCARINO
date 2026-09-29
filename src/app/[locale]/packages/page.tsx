import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/site/Cards";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { JsonLd } from "@/components/site/Primitives";
import { getCatalog, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tf } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/packages", title: t.packages.eyebrow, description: t.packages.intro });
}

export default async function PackagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showPackages) notFound();
  const { packages, categories } = await getCatalog();
  const nonce = await getNonce();
  const rank = (s: string) => (s === "available" ? 0 : 1);
  const groups = [
    ...categories.map((c) => ({ key: c.id, name: tf(locale, c, "name"), items: packages.filter((p) => p.categoryId === c.id) })),
    { key: "other", name: t.packages.eyebrow, items: packages.filter((p) => !p.categoryId || !categories.some((c) => c.id === p.categoryId)) },
  ]
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => rank(a.status) - rank(b.status)) }))
    .filter((g) => g.items.length);

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd([
          { name: t.nav.home, path: `/${locale}` },
          { name: t.nav.packages, path: `/${locale}/packages` },
        ])}
      />
      <PageHero eyebrow={t.packages.eyebrow} title={t.packages.title} intro={t.packages.intro} />
      <section className="bg-ink-2 text-paper">
        <div className="container-x space-y-20 py-20 lg:py-28">
          {!packages.length ? <p className="text-paper/60">{t.packages.empty}</p> : null}
          {groups.map((g) => (
            <div key={g.key}>
              <div className="flex items-baseline justify-between gap-6 border-b border-paper/10 pb-5" data-reveal>
                <h2 className="text-2xl font-medium tracking-tight lg:text-3xl">{g.name}</h2>
                <span className="mono text-xs text-paper/40">{String(g.items.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((p) => (
                  <div key={p.id} data-reveal>
                    <PackageCard pkg={p} locale={locale} t={t} uid={`pkg-${p.slug}`} showPrices={settings.sections.showPackagePrices} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-paper/45">{t.packages.note}</p>
        </div>
      </section>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
