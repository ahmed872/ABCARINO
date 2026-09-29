import { tr, type Dictionary, type Locale } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings-schema";
import { whatsappLink } from "@/lib/utils";
import { Button, Eyebrow } from "./Primitives";

/** Closing call-to-action used at the end of inner pages. */
export function CtaBand({
  locale,
  t,
  settings,
  title,
  text,
  whatsappContext,
  contactQuery,
}: {
  locale: Locale;
  t: Dictionary;
  settings: SiteSettings;
  title?: string;
  text?: string;
  /** Appended to the prefilled WhatsApp message (e.g. the solution name). */
  whatsappContext?: string;
  contactQuery?: string;
}) {
  const base = tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr);
  const wa = whatsappLink(settings.contact.whatsappNumber, whatsappContext ? `${base} — ${whatsappContext}` : base);
  const note = tr(locale, settings.cta.consultationNoteEn, settings.cta.consultationNoteAr);
  return (
    <section className="bg-ink text-paper">
      <div className="container-x py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end" data-reveal>
          <div className="lg:col-span-7">
            <Eyebrow tone="paper">{t.home.ctaEyebrow}</Eyebrow>
            <h2 className="display-2 mt-5 text-balance">{title ?? t.home.ctaTitle}</h2>
          </div>
          <div className="lg:col-span-5">
            <p className="lead text-pretty text-paper/65">{text ?? t.home.ctaText}</p>
            {note ? <p className="mt-3 text-sm text-paper/45">{note}</p> : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {wa ? (
                <Button href={wa} external variant="signal" icon="whatsapp" size="lg">
                  {tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr)}
                </Button>
              ) : null}
              <Button href={`/${locale}/contact${contactQuery ?? ""}`} variant={wa ? "ghost-paper" : "paper"} size="lg">
                {wa ? t.home.ctaSecondary : tr(locale, settings.cta.secondaryLabelEn, settings.cta.secondaryLabelAr)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
