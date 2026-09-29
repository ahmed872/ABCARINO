import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import type { PublicMedia } from "@/lib/content/queries";
import { tr, type Dictionary, type Locale } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings-schema";
import { whatsappLink } from "@/lib/utils";
import { LanguageSwitch } from "./LanguageSwitch";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { buildNav } from "./nav";

export function Header({
  locale,
  t,
  settings,
  logo,
}: {
  locale: Locale;
  t: Dictionary;
  settings: SiteSettings;
  logo: PublicMedia | null;
}) {
  const items = buildNav(t, settings);
  const wa = whatsappLink(
    settings.contact.whatsappNumber,
    tr(locale, settings.contact.whatsappMessageEn, settings.contact.whatsappMessageAr),
  );
  const waLabel = tr(locale, settings.cta.primaryLabelEn, settings.cta.primaryLabelAr);
  const contactLabel = tr(locale, settings.cta.secondaryLabelEn, settings.cta.secondaryLabelAr);

  return (
    <header className="sticky top-0 z-50 border-b border-paper/[0.07] bg-ink text-paper">
      <div className="container-x flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
        <Link href={`/${locale}`} aria-label={`${settings.general.companyNameEn} — ${t.nav.home}`} className="shrink-0">
          <Logo locale={locale} tone="paper" custom={logo} />
        </Link>
        <NavLinks locale={locale} items={items.filter((i) => i.key !== "contact")} label={t.nav.primary} />
        <div className="hidden items-center gap-6 lg:flex">
          <LanguageSwitch
            locale={locale}
            label={t.meta.switchTo}
            ariaLabel={t.meta.switchLabel}
            className="text-paper/60 hover:text-paper"
          />
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-signal px-4 text-sm font-medium text-white transition-colors hover:bg-signal-deep"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>{waLabel}</span>
            </a>
          ) : (
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-10 items-center rounded-full bg-paper px-4 text-sm font-medium text-ink transition-colors hover:bg-white"
            >
              {contactLabel}
            </Link>
          )}
        </div>
        <MobileMenu
          locale={locale}
          items={items}
          labels={{ menu: t.nav.menu, close: t.nav.close, home: t.nav.home }}
          whatsappHref={wa}
          whatsappLabel={waLabel}
          switchSlot={<LanguageSwitch locale={locale} label={t.meta.switchTo} ariaLabel={t.meta.switchLabel} />}
        />
      </div>
    </header>
  );
}
