import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="text-sm text-stone hover:text-ink">
          ← {back.label}
        </Link>
      ) : null}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-stone">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function LinkButton({ href, children, variant = "ink" }: { href: string; children: ReactNode; variant?: "ink" | "ghost" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors",
        variant === "ink" ? "bg-ink text-paper hover:bg-ink-3" : "border border-ink/15 bg-white hover:border-ink",
      )}
    >
      {children}
    </Link>
  );
}

const BADGE: Record<string, string> = {
  available: "bg-ok/10 text-ok",
  published: "bg-ok/10 text-ok",
  won: "bg-ok/10 text-ok",
  coming_soon: "bg-glow/30 text-[#8a5a14]",
  scheduled: "bg-glow/30 text-[#8a5a14]",
  proposal: "bg-glow/30 text-[#8a5a14]",
  hidden: "bg-ink/5 text-stone",
  draft: "bg-ink/5 text-stone",
  lost: "bg-ink/5 text-stone",
  new: "bg-signal/15 text-signal-deep",
  contacted: "bg-[#dfe6ee] text-[#35506b]",
  qualified: "bg-[#e3def2] text-[#4f3f7a]",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  coming_soon: "Coming soon",
  hidden: "Hidden",
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", BADGE[status] ?? "bg-ink/5 text-graphite")}>
      {children ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="admin-card flex flex-col items-center px-6 py-14 text-center">
      <span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-signal" />
      <p className="mt-5 font-medium">{title}</p>
      {text ? <p className="mt-1 max-w-md text-sm text-stone">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warning"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-6 rounded-xl px-4 py-3 text-sm",
        tone === "success" && "bg-ok/10 text-ok",
        tone === "warning" && "bg-glow/25 text-[#7a4f10]",
        tone === "info" && "bg-white text-graphite ring-1 ring-ink/10",
      )}
    >
      {children}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="admin-card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("border-b border-ink/10 px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-stone", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-ink/5 px-4 py-3 align-middle", className)}>{children}</td>;
}
