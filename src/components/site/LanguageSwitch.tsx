"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitch({
  locale,
  label,
  ariaLabel,
  className,
}: {
  locale: Locale;
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  const pathname = usePathname() || `/${locale}`;
  const target: Locale = locale === "ar" ? "en" : "ar";
  const parts = pathname.split("/");
  parts[1] = target;
  const href = parts.join("/") || `/${target}`;
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={ariaLabel}
      prefetch={false}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cn("text-sm font-medium transition-opacity hover:opacity-100", className)}
    >
      {label}
    </Link>
  );
}
