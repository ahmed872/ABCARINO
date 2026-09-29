import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCard, PriceTag } from "@/components/site/Cards";
import { CtaBand } from "@/components/site/CtaBand";
import { Markdown } from "@/components/site/Markdown";
import { PageHero } from "@/components/site/PageHero";
import { Button, Eyebrow, JsonLd, StatusBadge } from "@/components/site/Primitives";
import { Visual } from "@/components/site/Visual";
import { ArrowIcon, CheckIcon, PlusIcon } from "@/components/ui/icons";
import { getCatalog, getSettings } from "@/lib/content/public";
import { isLocale, tf, tr } from "@/lib/i18n";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

async function load(slug: string) {
  const catalog = await getCatalog();
  return { catalog, pkg: catalog.packages.find((p) => p.slug === slug) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { pkg } = await load(slug);
  if (!pkg) return {};
  return buildMetadata({
    locale,
    settings: await getSettings(),
    path: `/packages/${pkg.slug}`,
    title: tr(locale, pkg.seoTitleEn, pkg.seoTitleAr) || tf(locale, pkg, "name"),
    description: tr(locale, pkg.seoDescriptionEn, pkg.seoDescriptionAr) || tf(locale, pkg, "tagline"),
    image: pkg.image,
  });
}

export default async function PackagePage({ params }: { params: Params }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showPackages) notFound();
  const { slug } = await params;
  const { catalog, pkg } = await load(slug);
  if (!pkg) notFound();

  const nonce = await getNonce();
  const name = tf(locale, pkg, "name");
  const solutions = catalog.solutions.filter((s) => pkg.solutionIds.includes(s.id));
  const others = catalog.packages.filter((p) => p.id !== pkg.id).slice(0, 3);
  const waBase = tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr);
  const wa = whatsappLink(settings.contact.whatsappNumber, `${waBase} — ${name}`);
  const isSoon = pkg.status === "coming_soon";
  const ctaLabel = tr(locale, pkg.ctaLabelEn, pkg.ctaLabelAr) || (isSoon ? t.solutions.interest : t.packages.requestQuote);

  const offerLd =
    !isSoon && settings.sections.showPackagePrices && pkg.price && (pkg.pricingMode === "fixed" || pkg.pricingMode === "starting_from")
      ? { offers: { "@type": "Offer", price: pkg.price, priceCurrency: pkg.currency, availability: "https://schema.org/InStock" } }
      : {};

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name,
            description: tf(locale, pkg, "tagline"),
            provider: { "@id": `${absoluteUrl("/")}#organization` },
            url: absoluteUrl(`/${locale}/packages/${pkg.slug}`),
            ...offerLd,
          },
          breadcrumbJsonLd([
            { name: t.nav.home, path: `/${locale}` },
            { name: t.nav.packages, path: `/${locale}/packages` },
            { name, path: `/${locale}/packages/${pkg.slug}` },
          ]),
        ]}
      />
      <PageHero
        eyebrow={t.packages.eyebrow}
        title={name}
        intro={tf(locale, pkg, "tagline")}
        crumbs={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.packages, href: `/${locale}/packages` },
          { label: name },
        ]}
      >
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <PriceTag pkg={pkg} locale={locale} t={t} showPrices={settings.sections.showPackagePrices} tone="paper" />
          {wa ? (
            <Button href={wa} external variant="signal" icon="whatsapp" size="lg">
              {ctaLabel}
            </Button>
          ) : (
            <Button href={`/${locale}/contact?topic=package:${pkg.slug}`} variant="signal" size="lg">
              {ctaLabel}
            </Button>
          )}
          {isSoon ? <StatusBadge status="coming_soon" labels={{ available: t.common.available, comingSoon: t.common.comingSoon }} tone="paper" /> : null}
        </div>
      </PageHero>

      <section className="bg-paper">
        <div className="container-x grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <Visual
              media={pkg.image}
              visualKey={pkg.visualKey}
              uid={`pkgd-${pkg.slug}`}
              locale={locale}
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="aspect-[4/3] rounded-[1.25rem]"
            />
            <Markdown source={tf(locale, pkg, "description")} className="lead mt-12 !text-graphite" />
            {pkg.gallery.length ? (
              <div className="mt-12 grid grid-cols-2 gap-4">
                {pkg.gallery.map((m) => (
                  <figure key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink">
                    <Image src={m.url} alt={tr(locale, m.altEn, m.altAr)} fill sizes="(min-width: 1024px) 29vw, 50vw" className="object-cover" />
                    {m.isInspiration ? (
                      <span className="eyebrow absolute end-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] text-paper/75">{t.common.inspiration}</span>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
          <aside className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl bg-white p-7 ring-1 ring-ink/[0.06] lg:sticky lg:top-28 lg:p-8">
              {pkg.includedFeatures.length ? (
                <>
                  <Eyebrow>{t.packages.included}</Eyebrow>
                  <ul className="mt-6 space-y-4">
                    {pkg.includedFeatures.map((f, i) => (
                      <li key={i} className="flex gap-3">
                        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                        <span>{tr(locale, f.en, f.ar)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {pkg.optionalFeatures.length ? (
                <div className="mt-8 border-t border-ink/10 pt-8">
                  <Eyebrow>{t.packages.optional}</Eyebrow>
                  <ul className="mt-6 space-y-4 text-graphite">
                    {pkg.optionalFeatures.map((f, i) => (
                      <li key={i} className="flex gap-3">
                        <PlusIcon className="mt-0.5 h-5 w-5 shrink-0 text-stone" />
                        <span>{tr(locale, f.en, f.ar)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {solutions.length ? (
                <div className="mt-8 border-t border-ink/10 pt-8">
                  <Eyebrow>{t.packages.relatedSolutions}</Eyebrow>
                  <ul className="mt-5 space-y-2">
                    {solutions.map((s) => (
                      <li key={s.id}>
                        <Link href={`/${locale}/solutions/${s.slug}`} className="group flex items-center justify-between gap-3 py-1 font-medium">
                          <span className="link-underline">{tf(locale, s, "title")}</span>
                          <ArrowIcon className="h-4 w-4 text-stone group-hover:text-ink" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-8 border-t border-ink/10 pt-6 text-sm text-stone">{t.packages.note}</p>
            </div>
          </aside>
        </div>
      </section>

      {others.length ? (
        <section className="bg-ink text-paper">
          <div className="container-x py-20 lg:py-28">
            <Eyebrow tone="paper">{t.packages.eyebrow}</Eyebrow>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <PackageCard key={p.id} pkg={p} locale={locale} t={t} uid={`other-${p.slug}`} showPrices={settings.sections.showPackagePrices} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <CtaBand locale={locale} t={t} settings={settings} whatsappContext={name} contactQuery={`?topic=package:${pkg.slug}`} />
    </>
  );
}
