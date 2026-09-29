import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { JsonLd } from "@/components/site/Primitives";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getCatalog, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tf, tr } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { safeExternalUrl, whatsappLink } from "@/lib/utils";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/contact", title: t.nav.contact, description: t.contact.intro });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, settings, t } = await siteContext(params);
  const sp = await searchParams;
  const { solutions, packages } = await getCatalog();
  const nonce = await getNonce();
  const c = settings.contact;

  const topics = [
    ...solutions.map((s) => ({ value: s.slug, label: tf(locale, s, "title") })),
    ...(settings.sections.showPackages ? packages.map((p) => ({ value: p.slug, label: `${t.nav.packages} — ${tf(locale, p, "name")}` })) : []),
  ];
  const requested = typeof sp.topic === "string" ? sp.topic : undefined;
  const defaultTopic = topics.some((o) => o.value === requested) ? requested : undefined;

  const wa = whatsappLink(c.whatsappNumber, tr(locale, c.whatsappMessageEn, c.whatsappMessageAr));
  const address = tr(locale, c.addressEn, c.addressAr);
  const hours = tr(locale, c.businessHoursEn, c.businessHoursAr);
  const map = safeExternalUrl(c.mapUrl);
  const consultation = tr(locale, settings.cta.consultationNoteEn, settings.cta.consultationNoteAr);
  const hasDirect = !!(wa || c.email || c.phone || address);

  const row = "flex items-start gap-4 border-t border-paper/10 py-5 first:border-t-0";

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd([
          { name: t.nav.home, path: `/${locale}` },
          { name: t.nav.contact, path: `/${locale}/contact` },
        ])}
      />
      <PageHero eyebrow={t.contact.eyebrow} title={t.contact.title} intro={t.contact.intro} />
      <section className="bg-paper">
        <div className="container-x grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-medium tracking-tight">{t.contact.formTitle}</h2>
            <div className="relative mt-8">
              <ContactForm t={t.contact} locale={locale} topics={topics} defaultTopic={defaultTopic} />
            </div>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="rounded-2xl bg-ink p-7 text-paper lg:p-8">
              <h2 className="text-xl font-medium tracking-tight">{t.contact.directTitle}</h2>
              {hasDirect ? (
                <ul className="mt-6">
                  {wa ? (
                    <li className={row}>
                      <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr)}
                      </a>
                    </li>
                  ) : null}
                  {c.phone ? (
                    <li className={row}>
                      <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-paper/50" />
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} dir="ltr" className="hover:underline">
                        {c.phone}
                      </a>
                    </li>
                  ) : null}
                  {c.email ? (
                    <li className={row}>
                      <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-paper/50" />
                      <a href={`mailto:${c.email}`} className="break-all hover:underline">
                        {c.email}
                      </a>
                    </li>
                  ) : null}
                  {address ? (
                    <li className={row}>
                      <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-paper/50" />
                      <span>
                        {address}
                        {map ? (
                          <a href={map} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-paper/60 underline underline-offset-4">
                            {t.common.map}
                          </a>
                        ) : null}
                      </span>
                    </li>
                  ) : null}
                  {hours ? (
                    <li className={row}>
                      <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-paper/50" />
                      <span className="text-paper/75">{hours}</span>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-paper/60">{t.contact.notConfigured}</p>
              )}
            </div>
            {consultation ? (
              <div className="mt-6 rounded-2xl border border-ink/10 p-7">
                <h2 className="font-medium">{t.contact.consultationTitle}</h2>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{consultation}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
