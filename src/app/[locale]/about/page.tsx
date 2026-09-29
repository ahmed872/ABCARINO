import type { Metadata } from "next";
import { ConceptVisual } from "@/components/illustrations/ConceptVisual";
import { Mark } from "@/components/brand/Mark";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Eyebrow, JsonLd } from "@/components/site/Primitives";
import { getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tr } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const settings = await getSettings();
  return buildMetadata({
    locale,
    settings,
    path: "/about",
    title: t.nav.about,
    description: tr(locale, settings.pages.aboutIntroEn, settings.pages.aboutIntroAr).slice(0, 300),
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  const a = t.about;
  const nonce = await getNonce();
  return (
    <>
      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd([
          { name: t.nav.home, path: `/${locale}` },
          { name: t.nav.about, path: `/${locale}/about` },
        ])}
      />
      <PageHero eyebrow={a.eyebrow} title={a.title} intro={tr(locale, settings.pages.aboutIntroEn, settings.pages.aboutIntroAr)} />

      <section className="bg-paper">
        <div className="container-x py-24 lg:py-32">
          <Eyebrow>{a.beliefsEyebrow}</Eyebrow>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2">
            {a.beliefs.map((b, i) => (
              <div key={b.title} className="bg-paper p-8 lg:p-12" data-reveal>
                <span className="mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-10 text-2xl font-medium tracking-tight lg:text-3xl">{b.title}</h2>
                <p className="mt-4 max-w-md text-pretty leading-relaxed text-graphite">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-2/60">
        <div className="container-x grid gap-14 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-5" data-reveal>
            <Eyebrow>{a.approachEyebrow}</Eyebrow>
            <h2 className="display-2 mt-5 text-balance">{a.approachTitle}</h2>
          </div>
          <div className="space-y-6 lg:col-span-6 lg:col-start-7" data-reveal>
            {a.approach.map((p, i) => (
              <p key={i} className="lead text-pretty text-graphite">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="container-x grid gap-12 py-24 lg:grid-cols-12 lg:items-center lg:py-32">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] ring-1 ring-paper/10 lg:col-span-7">
            <ConceptVisual visual="lighting" uid="about-comfort" locale={locale} className="absolute inset-0 h-full w-full" />
          </div>
          <div className="lg:col-span-5" data-reveal>
            <h2 className="display-3 text-balance">{a.comfortTitle}</h2>
            <p className="lead mt-6 text-pretty text-paper/65">{a.comfortText}</p>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-x grid gap-14 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-6" data-reveal>
            <Eyebrow>{a.modelEyebrow}</Eyebrow>
            <h2 className="display-3 mt-5 text-balance">{a.modelTitle}</h2>
            <p className="lead mt-6 text-pretty text-graphite">{a.modelText}</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8" data-reveal>
            <Eyebrow>{a.nameEyebrow}</Eyebrow>
            <div className="mt-6 flex items-center gap-6 rounded-2xl bg-ink p-8 text-paper">
              <Mark tone="paper" className="h-20 w-20 shrink-0" />
              <div>
                <p dir="ltr" className="text-xl font-semibold" style={{ letterSpacing: "0.18em" }}>
                  ABCARINO
                </p>
                <p lang="ar" className="mt-1 text-lg text-paper/70">
                  عبقرينو
                </p>
              </div>
            </div>
            <h3 className="mt-8 text-xl font-medium tracking-tight">{a.nameTitle}</h3>
            <p className="mt-3 text-pretty leading-relaxed text-graphite">{a.nameText}</p>
          </div>
        </div>
      </section>

      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
