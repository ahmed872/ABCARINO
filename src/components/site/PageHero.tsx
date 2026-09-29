import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "./Primitives";

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  crumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(244,242,237,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,242,237,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 0%, black 30%, transparent 75%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 end-[-10%] h-[36rem] w-[36rem] rounded-full bg-glow/10 blur-[120px]" />
      <div className="container-x relative pb-16 pt-14 lg:pb-24 lg:pt-20">
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-paper/45">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 ? <span aria-hidden>/</span> : null}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-paper">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-paper/70">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <Eyebrow tone="paper">{eyebrow}</Eyebrow>
        <h1 className="display-1 mt-6 max-w-5xl text-balance">{title}</h1>
        {intro ? <p className="lead mt-8 max-w-2xl text-pretty text-paper/65">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
