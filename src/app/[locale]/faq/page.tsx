import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { JsonLd } from "@/components/site/Primitives";
import { RENO_CATEGORIES, RENO_FAQ } from "@/content/reno/faq";
import { getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tr } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { whatsappLink } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const settings = await getSettings();
  return buildMetadata({ locale, settings, path: "/faq", title: t.reno.page.title, description: t.reno.page.intro });
}

/** RENO's knowledge base as a crawlable page: the same answers the companion gives, always visible. */
export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  const nonce = await getNonce();
  const wa = whatsappLink(settings.contact.whatsappNumber, tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr));
  return (
    <>
      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd([
          { name: t.nav.home, path: `/${locale}` },
          { name: t.reno.page.title, path: `/${locale}/faq` },
        ])}
      />
      <PageHero eyebrow={t.reno.page.eyebrow} title={t.reno.page.title} intro={t.reno.page.intro} />
      <section className="bg-paper">
        <div className="container-x grid gap-16 py-20 lg:py-28">
          {RENO_CATEGORIES.map((c) => {
            const entries = RENO_FAQ.filter((f) => f.category === c.id && !f.hidden);
            return (
              <div key={c.id} className="grid gap-8 lg:grid-cols-12" id={c.id}>
                <h2 className="display-3 lg:col-span-4">{c.label[locale]}</h2>
                <div className="grid gap-px overflow-hidden rounded-2xl bg-ink/10 lg:col-span-8">
                  {entries.map((f) => (
                    <article key={f.id} id={`q-${f.id}`} className="bg-paper p-6 lg:p-8">
                      <h3 className="text-lg font-medium tracking-tight">{f.questions[locale][0]}</h3>
                      <p className="mt-3 max-w-prose text-pretty leading-relaxed text-graphite">{f.answers[locale]}</p>
                      {f.action?.type === "link" ? (
                        <Link href={`/${locale}${f.action.href}`} className="mt-4 inline-block text-sm font-medium text-signal underline-offset-4 hover:underline">
                          {f.action.label[locale]}
                        </Link>
                      ) : f.action && wa ? (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium text-signal underline-offset-4 hover:underline">
                          {t.reno.whatsapp}
                        </a>
                      ) : f.action ? (
                        <Link href={`/${locale}/contact`} className="mt-4 inline-block text-sm font-medium text-signal underline-offset-4 hover:underline">
                          {t.reno.contact}
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
