"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav";

export function NavLinks({ locale, items, label }: { locale: string; items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="hidden lg:block">
      <ul className="flex items-center gap-8">
        {items.map((item) => {
          const href = `/${locale}${item.path}`;
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={item.key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative text-sm transition-colors",
                  active ? "text-paper" : "text-paper/60 hover:text-paper",
                )}
              >
                {item.label}
                {active ? <span aria-hidden className="absolute -bottom-2 start-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-signal rtl:translate-x-1/2" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
