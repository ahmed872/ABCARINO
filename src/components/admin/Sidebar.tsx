"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mark } from "@/components/brand/Mark";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "./nav";

export function Sidebar({
  items,
  user,
  logoutAction,
}: {
  items: AdminNavItem[];
  user: { name: string; email: string; roleLabel: string };
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = [...new Set(items.map((i) => i.group))];
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Mark tone="paper" className="h-7 w-7" />
          <span className="text-[0.8rem] font-semibold" style={{ letterSpacing: "0.18em" }}>
            ABCARINO
          </span>
        </Link>
        <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g}>
            <p className="px-3 pb-2 text-[0.68rem] font-medium uppercase tracking-wider text-paper/35">{g}</p>
            <ul className="space-y-0.5">
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(i.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(i.href) ? "bg-paper/10 text-paper" : "text-paper/60 hover:bg-paper/5 hover:text-paper",
                      )}
                    >
                      <span aria-hidden className={cn("h-1.5 w-1.5 rotate-45", isActive(i.href) ? "bg-signal" : "bg-paper/20")} />
                      {i.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10 p-4">
        <Link href="/admin/account" className="block rounded-lg px-2 py-1.5 hover:bg-paper/5" onClick={() => setOpen(false)}>
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-paper/45">{user.roleLabel}</p>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener" className="flex-1 rounded-lg border border-paper/15 px-3 py-1.5 text-center text-xs text-paper/70 hover:text-paper">
            View site
          </a>
          <form action={logoutAction} className="flex-1">
            <button type="submit" className="w-full rounded-lg border border-paper/15 px-3 py-1.5 text-xs text-paper/70 hover:text-paper">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-ink px-4 text-paper lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Mark tone="paper" className="h-6 w-6" />
          <span className="text-xs font-semibold" style={{ letterSpacing: "0.18em" }}>
            ABCARINO
          </span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-ink text-paper lg:block">{nav}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-ink text-paper">{nav}</aside>
        </div>
      ) : null}
    </>
  );
}
