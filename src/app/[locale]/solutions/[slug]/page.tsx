import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PackageCard, SolutionCard } from "@/components/site/Cards";
import { CtaBand } from "@/components/site/CtaBand";
import { Markdown } from "@/components/site/Markdown";
import { PageHero } from "@/components/site/PageHero";
import { Button, Eyebrow, JsonLd, StatusBadge } from "@/components/site/Primitives";
import { Visual } from "@/components/site/Visual";
import { CheckIcon } from "@/components/ui/icons";
import { getCatalog, getSettings } from "@/lib/content/public";
import { isLocale, tf, tr } from "@/lib/i18n";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

async function load(slug: string) {
  const catalog = await getCatalog();
  const solution = catalog.solutions.find((s) => s.slug === slug);
  return { catalog, solution };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { solution } = await load(slug);
  if (!solution) return {};
  return buildMetadata({
    locale,
    settings: await getSettings(),
    path: `/solutions/${solution.slug}`,
    title: tr(locale, solution.seoTitleEn, solution.seoTitleAr) || tf(locale, solution, "title"),
    description: tr(locale, solution.seoDescriptionEn, solution.seoDescriptionAr) || tf(locale, solution, "summary"),
    image: solution.image,
  });
}

export default async function SolutionPage({ params }: { params: Params }) {
  const { locale, settings, t } = await siteContext(params);
  const { slug } = await params;
  const { catalog, solution } = await load(slug);
  if (!solution) notFound();
  if (solution.status === "coming_soon" && !settings.sections.showComingSoon) notFound();

  const nonce = await getNonce();
  const title = tf(locale, solution, "title");
  const category = catalog.categories.find((c) => c.id === solution.categoryId);
  const related = catalog.packages.filter((p) => solution.packageIds.includes(p.id));
  const others = catalog.solutions
    .filter((s) => s.id !== solution.id && (s.categoryId === solution.categoryId || s.status === "available"))
    .sort((a, b) => Number(b.categoryId === solution.categoryId) - Number(a.categoryId === solution.categoryId))
    .slice(0, 3);
  const isSoon = solution.status === "coming_soon";
  const waBase = tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr);
  const wa = whatsappLink(settings.contact.whatsappNumber, `${waBase} — ${title}`);
  const ctaLabel =
    tr(locale, solution.ctaLabelEn, solution.ctaLabelAr) ||
    (isSoon ? t.solutions.interest : tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr));

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description: tf(locale, solution, "summary"),
    serviceType: category ? tf(locale, category, "name") : undefined,
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    url: absoluteUrl(`/${locale}/solutions/${solution.slug}`),
    areaServed: "EG",
  };

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={[
          serviceLd,
          breadcrumbJsonLd([
            { name: t.nav.home, path: `/${locale}` },
            { name: t.nav.solutions, path: `/${locale}/solutions` },
            { name: title, path: `/${locale}/solutions/${solution.slug}` },
          ]),
        ]}
      />
      <PageHero
        eyebrow={category ? tf(locale, category, "name") : t.solutions.eyebrow}
        title={title}
        intro={tf(locale, solution, "summary")}
        crumbs={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.solutions, href: `/${locale}/solutions` },
          { label: title },
        ]}
      >
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          {wa ? (
            <Button href={wa} external variant="signal" icon="whatsapp" size="lg">
              {ctaLabel}
            </Button>
          ) : (
            <Button href={`/${locale}/contact?topic=${solution.slug}`} variant="signal" size="lg">
              {isSoon ? t.solutions.interest : t.solutions.discuss}
            </Button>
          )}
          <StatusBadge status={solution.status} labels={{ available: t.common.available, comingSoon: t.common.comingSoon }} tone="paper" />
        </div>
      </PageHero>

      <section className="bg-ink pb-4">
        <div className="container-x">
          <Visual
            media={solution.image}
            visualKey={solution.visualKey}
            uid={`detail-${solution.slug}`}
            locale={locale}
            priority
            sizes="(min-width: 1344px) 1344px, 100vw"
            className="aspect-[4/3] translate-y-10 rounded-[1.25rem] ring-1 ring-paper/10 sm:aspect-[16/9] lg:aspect-[21/9]"
          />
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-x pb-20 pt-28 lg:pb-28 lg:pt-36">
          {isSoon ? (
            <div className="mb-14 flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between" data-reveal>
              <p className="text-pretty text-graphite">{t.solutions.comingSoonNotice}</p>
              <Button href={`/${locale}/contact?topic=${solution.slug}`} variant="ink" className="shrink-0">
                {t.solutions.interest}
              </Button>
            </div>
          ) : null}
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7" data-reveal>
              <Markdown source={tf(locale, solution, "description")} className="lead !text-graphite" />
            </div>
            {solution.features.length ? (
              <aside className="lg:col-span-5" data-reveal>
                <div className="rounded-2xl bg-white p-7 ring-1 ring-ink/[0.06] lg:p-8">
                  <Eyebrow>{t.solutions.features}</Eyebrow>
                  <ul className="mt-6 space-y-4">
                    {solution.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-ink">
                        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                        <span>{tr(locale, f.en, f.ar)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            ) : null}
          </div>

          {solution.benefits.length ? (
            <div className="mt-24">
              <Eyebrow>{t.solutions.benefits}</Eyebrow>
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-ink/10 md:grid-cols-3">
                {solution.benefits.map((b, i) => (
                  <div key={i} className="bg-paper p-8" data-reveal>
                    <span className="mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-8 text-xl font-medium tracking-tight">{tr(locale, b.titleEn, b.titleAr)}</h3>
                    <p className="mt-3 text-pretty leading-relaxed text-graphite">{tr(locale, b.textEn, b.textAr)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {solution.gallery.length ? (
            <div className="mt-24">
              <Eyebrow>{t.solutions.gallery}</Eyebrow>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {solution.gallery.map((m) => (
                  <figure key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink" data-reveal>
                    <Image src={m.url} alt={tr(locale, m.altEn, m.altAr)} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                    {m.isInspiration ? (
                      <span className="eyebrow absolute end-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] text-paper/75">{t.common.inspiration}</span>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {related.length && settings.sections.showPackages ? (
        <section className="bg-ink text-paper">
          <div className="container-x py-20 lg:py-28">
            <Eyebrow tone="paper">{t.solutions.relatedPackages}</Eyebrow>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PackageCard key={p.id} pkg={p} locale={locale} t={t} uid={`rel-${p.slug}`} showPrices={settings.sections.showPackagePrices} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {others.length ? (
        <section className="bg-paper-2/60">
          <div className="container-x py-20 lg:py-28">
            <Eyebrow>{t.solutions.others}</Eyebrow>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((s) => (
                <SolutionCard
                  key={s.id}
                  solution={s}
                  category={catalog.categories.find((c) => c.id === s.categoryId)}
                  locale={locale}
                  t={t}
                  uid={`other-${s.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CtaBand locale={locale} t={t} settings={settings} whatsappContext={title} contactQuery={`?topic=${solution.slug}`} />
    </>
  );
}
