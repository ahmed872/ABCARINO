import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { ArrowUpRightIcon, WhatsAppIcon } from "@/components/ui/icons";
import { tr, type Dictionary, type Locale } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings-schema";
import { safeExternalUrl, whatsappLink } from "@/lib/utils";
import { LanguageSwitch } from "./LanguageSwitch";
import { buildNav } from "./nav";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  behance: "Behance",
};

export function Footer({ locale, t, settings }: { locale: Locale; t: Dictionary; settings: SiteSettings }) {
  const items = buildNav(t, settings);
  const c = settings.contact;
  const wa = whatsappLink(c.whatsappNumber, tr(locale, c.whatsappMessageEn, c.whatsappMessageAr));
  const socials = Object.entries(settings.social)
    .map(([k, v]) => [k, safeExternalUrl(v)] as const)
    .filter((e): e is readonly [string, string] => !!e[1]);
  const address = tr(locale, c.addressEn, c.addressAr);
  const hours = tr(locale, c.businessHoursEn, c.businessHoursAr);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      <div className="container-x pb-10 pt-20 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <Mark tone="paper" className="h-12 w-12" />
              <div className="leading-tight">
                <p dir="ltr" className="text-lg font-semibold" style={{ letterSpacing: "0.18em" }}>
                  ABCARINO
                </p>
                <p lang="ar" className="text-sm text-paper/60">
                  عبقرينو
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-md text-pretty text-paper/60">
              {tr(locale, settings.footer.statementEn, settings.footer.statementAr)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="eyebrow text-paper/40">{t.footer.explore}</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href={`/${locale}`} className="text-paper/75 transition-colors hover:text-paper">
                    {t.nav.home}
                  </Link>
                </li>
                {items.map((item) => (
                  <li key={item.key}>
                    <Link href={`/${locale}${item.path}`} className="text-paper/75 transition-colors hover:text-paper">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-paper/40">{t.footer.contact}</p>
              <ul className="mt-5 space-y-3 text-paper/75">
                {wa ? (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-paper">
                      <WhatsAppIcon className="h-4 w-4" /> {t.common.whatsapp}
                    </a>
                  </li>
                ) : null}
                {c.email ? (
                  <li>
                    <a href={`mailto:${c.email}`} className="break-all hover:text-paper">
                      {c.email}
                    </a>
                  </li>
                ) : null}
                {c.phone ? (
                  <li>
                    <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} dir="ltr" className="hover:text-paper">
                      {c.phone}
                    </a>
                  </li>
                ) : null}
                {address ? <li className="text-paper/55">{address}</li> : null}
                {hours ? <li className="text-paper/55">{hours}</li> : null}
                {!wa && !c.email && !c.phone ? (
                  <li>
                    <Link href={`/${locale}/contact`} className="hover:text-paper">
                      {t.nav.contact}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
            {socials.length ? (
              <div>
                <p className="eyebrow text-paper/40">{t.footer.follow}</p>
                <ul className="mt-5 space-y-3">
                  {socials.map(([key, url]) => (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-paper/75 hover:text-paper"
                      >
                        {SOCIAL_LABELS[key] ?? key}
                        <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div
          aria-hidden
          dir="ltr"
          className="pointer-events-none mt-20 select-none text-center text-[17vw] font-semibold leading-[0.8] tracking-[-0.04em] text-paper/[0.035] lg:text-[15.5rem]"
        >
          ABCARINO
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-paper/10 pt-8 text-xs text-paper/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {tr(locale, settings.general.companyNameEn, settings.general.companyNameAr)}. {t.footer.rights}
            {tr(locale, settings.footer.legalEn, settings.footer.legalAr) ? (
              <span className="ms-2">{tr(locale, settings.footer.legalEn, settings.footer.legalAr)}</span>
            ) : null}
          </p>
          <p>{t.footer.conceptNote}</p>
          <LanguageSwitch locale={locale} label={t.meta.switchTo} ariaLabel={t.meta.switchLabel} className="text-paper/60 hover:text-paper" />
        </div>
      </div>
    </footer>
  );
}
