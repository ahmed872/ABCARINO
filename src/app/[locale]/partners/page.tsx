import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { getPartners, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tf } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { siteContext } from "@/lib/site";
import { safeExternalUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/partners", title: t.partners.eyebrow, description: t.partners.intro });
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showPartners) notFound();
  const partners = await getPartners();
  return (
    <>
      <PageHero eyebrow={t.partners.eyebrow} title={t.partners.title} intro={t.partners.intro} />
      <section className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          {!partners.length ? <p className="text-graphite">{t.partners.empty}</p> : null}
          <div className="grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => {
              const url = safeExternalUrl(p.websiteUrl);
              return (
                <div key={p.id} className="flex flex-col bg-paper p-8" data-reveal>
                  <div className="flex h-16 items-center">
                    {p.logo ? (
                      <Image src={p.logo.url} alt={p.name} width={p.logo.width} height={p.logo.height} className="h-12 w-auto max-w-[180px] object-contain" />
                    ) : (
                      <span className="text-xl font-medium">{p.name}</span>
                    )}
                  </div>
                  <p className="eyebrow mt-6 text-stone">{t.partners.relations[p.relationship]}</p>
                  <h2 className="mt-2 text-lg font-medium">{p.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-graphite">{tf(locale, p, "description")}</p>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium">
                      {t.partners.visit}
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
