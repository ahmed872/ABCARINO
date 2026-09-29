"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";
import type { NavItem } from "./nav";

export function MobileMenu({
  locale,
  items,
  labels,
  whatsappHref,
  whatsappLabel,
  switchSlot,
}: {
  locale: string;
  items: NavItem[];
  labels: { menu: string; close: string; home: string };
  whatsappHref: string | null;
  whatsappLabel: string;
  switchSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the panel when the route changes.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="-me-2 inline-flex h-11 w-11 items-center justify-center text-paper"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? labels.close : labels.menu}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-ink text-paper"
      >
        <nav className="container-x flex min-h-full flex-col pb-10 pt-6" aria-label={labels.menu}>
          <ul className="border-t border-paper/10">
            {[{ key: "home", label: labels.home, path: "" }, ...items].map((item, i) => {
              const href = `/${locale}${item.path}`;
              const active = item.path ? pathname?.startsWith(href) : pathname === href;
              return (
                <li key={item.key} className="border-b border-paper/10">
                  <Link
                    href={href}
                    className="flex items-baseline justify-between py-5 text-2xl font-medium"
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={active ? "text-paper" : "text-paper/75"}>{item.label}</span>
                    <span className="mono text-xs text-paper/30">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex flex-col gap-5 pt-10">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-signal font-medium text-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {whatsappLabel}
              </a>
            ) : null}
            <div className="text-center text-paper/70">{switchSlot}</div>
          </div>
        </nav>
      </div>
    </div>
  );
}
