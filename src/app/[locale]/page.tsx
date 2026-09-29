import type { Metadata } from "next";
import Link from "next/link";
import { ConceptVisual } from "@/components/illustrations/ConceptVisual";
import { PackageCard, SolutionCard } from "@/components/site/Cards";
import { Button, Eyebrow, JsonLd, SectionHeader, TextLink } from "@/components/site/Primitives";
import { Visual } from "@/components/site/Visual";
import { ArrowIcon } from "@/components/ui/icons";
import { getCatalog, getSettings } from "@/lib/content/public";
import { isLocale, tf, tr } from "@/lib/i18n";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, settings: await getSettings(), path: "/" });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  const catalog = await getCatalog();
  const nonce = await getNonce();
  const h = t.home;
  const p = settings.pages;

  const wa = whatsappLink(
    settings.contact.whatsappNumber,
    tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr),
  );
  const primaryLabel = tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr);
  const secondaryLabel = tr(locale, settings.cta.secondaryLabelEn, settings.cta.secondaryLabelAr);
  const consultationNote = tr(locale, settings.cta.consultationNoteEn, settings.cta.consultationNoteAr);

  const catById = new Map(catalog.categories.map((c) => [c.id, c]));
  const available = catalog.solutions.filter((s) => s.status === "available");
  const comingSoon = catalog.solutions.filter((s) => s.status === "coming_soon");
  const showcase = [...available].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);
  const featuredPackages = settings.sections.showPackages
    ? [...catalog.packages].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3)
    : [];
  const logoUrl = "/brand/apple-touch-icon.png";

  return (
    <>
      <JsonLd nonce={nonce} data={[organizationJsonLd(locale, settings, logoUrl), websiteJsonLd(locale, settings)]} />

      {/* 1 ─ Hero */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div aria-hidden className="pointer-events-none absolute -top-60 start-[-15%] h-[42rem] w-[42rem] rounded-full bg-glow/[0.07] blur-[140px]" />
        <div className="container-x relative grid gap-12 pb-16 pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-5">
            <Eyebrow tone="paper" className="animate-rise">
              {h.heroEyebrow}
            </Eyebrow>
            <h1 className="display-1 mt-7 text-balance animate-rise [animation-delay:80ms]">
              {tr(locale, p.heroTitleEn, p.heroTitleAr)}
            </h1>
            <p className="lead mt-8 max-w-xl text-pretty text-paper/65 animate-rise [animation-delay:160ms]">
              {tr(locale, p.heroSubtitleEn, p.heroSubtitleAr)}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center animate-rise [animation-delay:240ms]">
              {wa ? (
                <Button href={wa} external variant="signal" icon="whatsapp" size="lg">
                  {primaryLabel}
                </Button>
              ) : (
                <Button href={`/${locale}/contact`} variant="signal" size="lg">
                  {secondaryLabel}
                </Button>
              )}
              <Button href={`/${locale}/solutions`} variant="ghost-paper" size="lg">
                {h.heroSecondary}
              </Button>
            </div>
          </div>
          <figure className="lg:col-span-6 xl:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] ring-1 ring-paper/10">
              <ConceptVisual visual="living" uid="hero" locale={locale} animated className="absolute inset-0 h-full w-full" />
            </div>
            <figcaption className="eyebrow mt-4 flex items-center gap-3 text-paper/40">
              <span aria-hidden className="h-px w-8 bg-paper/25" />
              {h.heroCaption}
            </figcaption>
          </figure>
        </div>
        {catalog.categories.length ? (
          <div className="border-t border-paper/[0.08]">
            <ul className="container-x flex gap-x-10 gap-y-3 overflow-x-auto py-5 text-sm text-paper/50 [scrollbar-width:none] lg:justify-between">
              {catalog.categories.map((c, i) => (
                <li key={c.id} className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                  <span className="mono text-[0.7rem] text-signal">{String(i + 1).padStart(2, "0")}</span>
                  {tf(locale, c, "name")}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* 2 ─ Brand statement */}
      <section className="bg-paper">
        <div className="container-x py-24 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-3">
              <Eyebrow>{h.statementEyebrow}</Eyebrow>
            </div>
            <p className="display-3 text-balance text-ink lg:col-span-9 lg:text-[clamp(2rem,1.2rem+2vw,3.4rem)] lg:leading-[1.1]">
              {tr(locale, p.statementEn, p.statementAr)}
            </p>
          </div>
        </div>
      </section>

      {/* 3 ─ What we do */}
      <section className="bg-paper">
        <div className="container-x pb-24 lg:pb-32">
          <SectionHeader eyebrow={h.whatEyebrow} index="01" title={h.whatTitle} intro={h.whatIntro} />
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-ink/10 md:grid-cols-3">
            {h.pillars.map((pillar, i) => (
              <div key={pillar.title} className="flex flex-col bg-paper p-8 lg:p-10" data-reveal>
                <span className="mono text-xs text-stone">{String(i + 1).padStart(2, "0")} / 03</span>
                <h3 className="mt-14 text-2xl font-medium tracking-tight lg:text-[1.75rem]">{pillar.title}</h3>
                <p className="mt-4 text-pretty leading-relaxed text-graphite">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 ─ Solutions */}
      <section className="bg-paper-2/60">
        <div className="container-x py-24 lg:py-32">
          <SectionHeader
            eyebrow={h.solutionsEyebrow}
            index="02"
            title={h.solutionsTitle}
            intro={h.solutionsIntro}
            action={<TextLink href={`/${locale}/solutions`}>{t.common.viewAll}</TextLink>}
          />
          {showcase.length ? (
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((s) => (
                <div key={s.id} data-reveal>
                  <SolutionCard solution={s} category={s.categoryId ? catById.get(s.categoryId) : undefined} locale={locale} t={t} uid={`home-sol-${s.slug}`} />
                </div>
              ))}
            </div>
          ) : null}
          {catalog.categories.length ? (
            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2 lg:grid-cols-5" data-reveal>
              {catalog.categories.map((c) => {
                const items = catalog.solutions.filter((s) => s.categoryId === c.id);
                return (
                  <div key={c.id} className="bg-paper p-6">
                    <p className="font-medium text-ink">{tf(locale, c, "name")}</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {items.map((s) => (
                        <li key={s.id}>
                          <Link href={`/${locale}/solutions/${s.slug}`} className="group flex items-center justify-between gap-2 text-graphite hover:text-ink">
                            <span>{tf(locale, s, "title")}</span>
                            {s.status === "coming_soon" ? (
                              <span className="shrink-0 text-[0.68rem] text-stone">{t.common.comingSoon}</span>
                            ) : (
                              <span aria-hidden className="h-1 w-1 shrink-0 rotate-45 bg-signal" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* 5 ─ Packages */}
      {featuredPackages.length ? (
        <section className="bg-ink text-paper">
          <div className="container-x py-24 lg:py-32">
            <SectionHeader
              tone="paper"
              eyebrow={h.packagesEyebrow}
              index="03"
              title={h.packagesTitle}
              intro={h.packagesIntro}
              action={
                <Link href={`/${locale}/packages`} className="group inline-flex items-center gap-2 text-sm font-medium text-paper">
                  <span className="link-underline pb-0.5">{t.common.viewAll}</span>
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              }
            />
            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPackages.map((pkg) => (
                <div key={pkg.id} data-reveal>
                  <PackageCard pkg={pkg} locale={locale} t={t} uid={`home-pkg-${pkg.slug}`} showPrices={settings.sections.showPackagePrices} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 6 ─ Why ABCARINO */}
      <section className="bg-paper">
        <div className="container-x py-24 lg:py-32">
          <SectionHeader eyebrow={h.whyEyebrow} index="04" title={h.whyTitle} />
          <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {h.why.map((item, i) => (
              <div key={item.title} className="border-t border-ink/15 pt-6" data-reveal>
                <div className="flex items-baseline gap-4">
                  <span className="mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-medium tracking-tight">{item.title}</h3>
                </div>
                <p className="mt-4 text-pretty leading-relaxed text-graphite">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 ─ How we work */}
      <section className="bg-paper-2/60">
        <div className="container-x py-24 lg:py-32">
          <SectionHeader eyebrow={h.processEyebrow} index="05" title={h.processTitle} />
          <ol className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
            <span aria-hidden className="absolute inset-x-0 top-[7px] hidden h-px bg-ink/15 lg:block" />
            {h.process.map((step, i) => (
              <li key={step.title} className="relative ps-8 lg:ps-0 lg:pt-10" data-reveal>
                <span aria-hidden className="absolute start-0 top-1.5 h-3.5 w-3.5 rotate-45 border border-ink/30 bg-paper lg:top-0" />
                <span aria-hidden className="absolute start-0 top-1.5 h-3.5 w-3.5 rotate-45 scale-50 bg-signal lg:top-0" />
                <span className="mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed text-graphite">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8 ─ Future / coming soon */}
      {settings.sections.showComingSoon && comingSoon.length ? (
        <section className="bg-paper">
          <div className="container-x py-24 lg:py-32">
            <SectionHeader eyebrow={h.futureEyebrow} index="06" title={h.futureTitle} intro={h.futureIntro} />
            <ul className="mt-14 border-t border-ink/15">
              {comingSoon.slice(0, 6).map((s) => {
                const cat = s.categoryId ? catById.get(s.categoryId) : undefined;
                return (
                  <li key={s.id} className="border-b border-ink/15" data-reveal>
                    <Link
                      href={`/${locale}/solutions/${s.slug}`}
                      className="group grid items-center gap-2 py-6 transition-colors sm:grid-cols-12 sm:gap-6"
                    >
                      <span className="eyebrow text-stone sm:col-span-3">{cat ? tf(locale, cat, "name") : ""}</span>
                      <span className="text-xl font-medium tracking-tight text-ink sm:col-span-4 lg:text-2xl">{tf(locale, s, "title")}</span>
                      <span className="text-sm text-graphite sm:col-span-4">{tf(locale, s, "summary")}</span>
                      <span className="hidden justify-end sm:col-span-1 sm:flex">
                        <ArrowIcon className="h-5 w-5 text-stone transition-all duration-300 group-hover:translate-x-1 group-hover:text-signal rtl:group-hover:-translate-x-1" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {comingSoon.length > 6 ? (
              <div className="mt-8">
                <TextLink href={`/${locale}/solutions`}>{t.common.viewAll}</TextLink>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 9 ─ Visual experience: a day, quietly handled */}
      <section className="bg-ink text-paper">
        <div className="container-x py-24 lg:py-32">
          <SectionHeader tone="paper" eyebrow={h.dayEyebrow} index="07" title={h.dayTitle} intro={h.dayIntro} />
          <div className="mt-16 grid gap-10 lg:grid-cols-12">
            <Visual
              visualKey="plan"
              uid="home-day"
              locale={locale}
              className="aspect-[4/3] rounded-[1.25rem] ring-1 ring-paper/10 lg:col-span-7"
            />
            <ol className="lg:col-span-5">
              {h.day.map((m) => (
                <li key={m.time} className="grid grid-cols-[4.5rem_1fr] gap-4 border-t border-paper/10 py-5 first:border-t-0 first:pt-0" data-reveal>
                  <span className="mono pt-0.5 text-sm text-glow" dir="ltr">
                    {m.time}
                  </span>
                  <div>
                    <h3 className="font-medium">{m.title}</h3>
                    <p className="mt-1.5 text-pretty text-[0.95rem] leading-relaxed text-paper/60">{m.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 10 ─ CTA */}
      <section className="relative overflow-hidden bg-paper">
        <div className="container-x py-24 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end" data-reveal>
            <div className="lg:col-span-8">
              <Eyebrow>{h.ctaEyebrow}</Eyebrow>
              <h2 className="display-1 mt-6 text-balance">{h.ctaTitle}</h2>
            </div>
            <div className="lg:col-span-4">
              <p className="lead text-pretty text-graphite">{h.ctaText}</p>
              {consultationNote ? <p className="mt-4 text-sm text-stone">{consultationNote}</p> : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                {wa ? (
                  <Button href={wa} external variant="signal" icon="whatsapp" size="lg">
                    {primaryLabel}
                  </Button>
                ) : null}
                <Button href={`/${locale}/contact`} variant="ghost-ink" size="lg">
                  {wa ? h.ctaSecondary : secondaryLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
