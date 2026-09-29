import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, index, className, tone = "ink" }: { children: ReactNode; index?: string; className?: string; tone?: "ink" | "paper" }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3", tone === "paper" ? "text-paper/60" : "text-stone", className)}>
      {index ? <span className="text-signal">{index}</span> : <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-signal" />}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  index,
  title,
  intro,
  tone = "ink",
  action,
  className,
}: {
  eyebrow: string;
  index?: string;
  title: string;
  intro?: string;
  tone?: "ink" | "paper";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)} data-reveal>
      <div className="lg:col-span-7">
        <Eyebrow index={index} tone={tone}>
          {eyebrow}
        </Eyebrow>
        <h2 className={cn("display-2 mt-5 text-balance", tone === "paper" ? "text-paper" : "text-ink")}>{title}</h2>
      </div>
      <div className="lg:col-span-5">
        {intro ? <p className={cn("lead text-pretty", tone === "paper" ? "text-paper/65" : "text-graphite")}>{intro}</p> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "signal" | "ink" | "paper" | "ghost-ink" | "ghost-paper";
  external?: boolean;
  icon?: "arrow" | "whatsapp" | "none";
  className?: string;
  size?: "md" | "lg";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  signal: "bg-signal text-white hover:bg-signal-deep",
  ink: "bg-ink text-paper hover:bg-ink-3",
  paper: "bg-paper text-ink hover:bg-white",
  "ghost-ink": "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "ghost-paper": "border border-paper/25 text-paper hover:border-paper hover:bg-paper hover:text-ink",
};

export function Button({ href, children, variant = "ink", external, icon = "arrow", className, size = "md" }: ButtonProps) {
  const cls = cn(
    "group inline-flex items-center justify-center gap-2.5 rounded-full font-medium transition-colors duration-300",
    size === "lg" ? "h-13 px-7 text-[0.95rem]" : "h-11 px-5 text-sm",
    variants[variant],
    className,
  );
  const content = (
    <>
      {icon === "whatsapp" ? <WhatsAppIcon className="h-4.5 w-4.5" /> : null}
      <span>{children}</span>
      {icon === "arrow" ? <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" /> : null}
    </>
  );
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2 text-sm font-medium", className)}>
      <span className="link-underline pb-0.5">{children}</span>
      <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

export function StatusBadge({ status, labels, tone = "ink" }: { status: "available" | "coming_soon"; labels: { available: string; comingSoon: string }; tone?: "ink" | "paper" }) {
  if (status === "available") {
    return (
      <span className={cn("eyebrow inline-flex items-center gap-2 text-[0.65rem]", tone === "paper" ? "text-paper/80" : "text-ink/75")}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-signal" />
        </span>
        {labels.available}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem]",
        tone === "paper" ? "border-paper/25 text-paper/70" : "border-ink/15 text-stone",
      )}
    >
      {labels.comingSoon}
    </span>
  );
}

export function JsonLd({ data, nonce }: { data: unknown; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON-LD is data, not script; "<" is escaped to prevent breaking out of the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
