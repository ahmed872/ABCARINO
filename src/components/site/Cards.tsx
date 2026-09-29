import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import type { PublicCategory, PublicPackage, PublicSolution } from "@/lib/content/queries";
import { tf, tr, type Dictionary, type Locale } from "@/lib/i18n";
import { cn, formatPrice } from "@/lib/utils";
import { StatusBadge } from "./Primitives";
import { Visual } from "./Visual";

export function SolutionCard({
  solution,
  category,
  locale,
  t,
  uid,
  size = "md",
}: {
  solution: PublicSolution;
  category?: PublicCategory;
  locale: Locale;
  t: Dictionary;
  uid: string;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={`/${locale}/solutions/${solution.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ink/[0.06] transition-shadow duration-500 hover:shadow-[0_24px_60px_-30px_rgba(14,15,17,0.45)]"
    >
      <Visual
        media={solution.image}
        visualKey={solution.visualKey}
        uid={uid}
        locale={locale}
        className={cn("aspect-[4/3] w-full", size === "lg" && "lg:aspect-[16/10]")}
        sizes={size === "lg" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
      />
      <div className="flex flex-1 flex-col p-6 lg:p-7">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-stone">{category ? tf(locale, category, "name") : " "}</p>
          <StatusBadge status={solution.status} labels={{ available: t.common.available, comingSoon: t.common.comingSoon }} />
        </div>
        <h3 className="mt-4 text-xl font-medium tracking-tight text-ink lg:text-2xl">{tf(locale, solution, "title")}</h3>
        <p className="mt-3 line-clamp-3 text-pretty text-[0.95rem] leading-relaxed text-graphite">{tf(locale, solution, "summary")}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-ink">
          {t.common.viewSolution}
          <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function PriceTag({
  pkg,
  locale,
  t,
  showPrices,
  tone = "ink",
}: {
  pkg: Pick<PublicPackage, "pricingMode" | "price" | "currency" | "status" | "priceNoteEn" | "priceNoteAr">;
  locale: Locale;
  t: Dictionary;
  showPrices: boolean;
  tone?: "ink" | "paper";
}) {
  const muted = tone === "paper" ? "text-paper/55" : "text-stone";
  const strong = tone === "paper" ? "text-paper" : "text-ink";
  const note = tr(locale, pkg.priceNoteEn, pkg.priceNoteAr);
  let label: string;
  let amount = "";
  if (pkg.status === "coming_soon" || pkg.pricingMode === "coming_soon") {
    label = t.packages.pricing.coming_soon;
  } else if (!showPrices || pkg.pricingMode === "contact" || !pkg.price) {
    label = t.packages.pricing.contact;
  } else {
    label = t.packages.pricing[pkg.pricingMode];
    amount = formatPrice(pkg.price, pkg.currency, locale);
  }
  return (
    <div>
      <p className={cn("eyebrow", muted)}>{amount ? label : " "}</p>
      <p className={cn("mt-1 text-lg font-medium tracking-tight", strong)}>{amount || label}</p>
      {note && amount ? <p className={cn("mt-1 text-xs", muted)}>{note}</p> : null}
    </div>
  );
}

export function PackageCard({
  pkg,
  locale,
  t,
  uid,
  showPrices,
}: {
  pkg: PublicPackage;
  locale: Locale;
  t: Dictionary;
  uid: string;
  showPrices: boolean;
}) {
  const features = pkg.includedFeatures.slice(0, 4);
  return (
    <Link
      href={`/${locale}/packages/${pkg.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-ink-2 text-paper ring-1 ring-paper/[0.06] transition-colors duration-500 hover:bg-ink-3"
    >
      <Visual
        media={pkg.image}
        visualKey={pkg.visualKey}
        uid={uid}
        locale={locale}
        className="aspect-[16/10] w-full"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-medium tracking-tight lg:text-2xl">{tf(locale, pkg, "name")}</h3>
          {pkg.status === "coming_soon" ? (
            <StatusBadge status="coming_soon" labels={{ available: t.common.available, comingSoon: t.common.comingSoon }} tone="paper" />
          ) : null}
        </div>
        <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed text-paper/60">{tf(locale, pkg, "tagline")}</p>
        {features.length ? (
          <ul className="mt-6 space-y-2.5 border-t border-paper/10 pt-6 text-sm text-paper/75">
            {features.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-signal" />
                <span>{tr(locale, f.en, f.ar)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <PriceTag pkg={pkg} locale={locale} t={t} showPrices={showPrices} tone="paper" />
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/20 transition-colors group-hover:border-signal group-hover:bg-signal">
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
