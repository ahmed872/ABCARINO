import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { Badge, Notice, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { querySettings } from "@/lib/content/queries";
import { db } from "@/lib/db";
import { articles, auditLog, leads, media, packages, projects, solutions, users } from "@/lib/db/schema";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const inner = (
    <div className="admin-card h-full p-5 transition-colors hover:border-ink/30">
      <p className="text-xs font-medium uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {sub ? <p className="mt-1 text-xs text-stone">{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePageUser("dashboard.view");
  const sp = await searchParams;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [settings, solStats, pkgStats, leadStats, [{ recentLeads }], [{ mediaCount }], [{ articleCount }], [{ projectCount }], latestLeads, activity] = await Promise.all([
    querySettings(),
    db.select({ status: solutions.status, n: count() }).from(solutions).groupBy(solutions.status),
    db.select({ status: packages.status, n: count() }).from(packages).groupBy(packages.status),
    db.select({ status: leads.status, n: count() }).from(leads).groupBy(leads.status),
    db.select({ recentLeads: count() }).from(leads).where(gte(leads.createdAt, since)),
    db.select({ mediaCount: count() }).from(media),
    db.select({ articleCount: count() }).from(articles),
    db.select({ projectCount: count() }).from(projects),
    can(user.role, "leads.view") ? db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6) : Promise.resolve([]),
    can(user.role, "audit.view")
      ? db
          .select({ id: auditLog.id, summary: auditLog.summary, action: auditLog.action, createdAt: auditLog.createdAt, user: users.name })
          .from(auditLog)
          .leftJoin(users, eq(users.id, auditLog.userId))
          .where(sql`${auditLog.action} NOT LIKE 'auth.%'`)
          .orderBy(desc(auditLog.createdAt))
          .limit(8)
      : Promise.resolve([]),
  ]);
  const by = (rows: Array<{ status: string; n: number }>, s: string) => rows.find((r) => r.status === s)?.n ?? 0;
  const newLeads = by(leadStats, "new");

  const checklist = [
    { done: !!settings.contact.whatsappNumber, label: "Add the WhatsApp number", href: "/admin/settings#contact" },
    { done: !!settings.contact.email, label: "Add a contact email", href: "/admin/settings#contact" },
    { done: !!(settings.contact.businessHoursEn || settings.contact.businessHoursAr), label: "Set business hours", href: "/admin/settings#contact" },
    { done: Object.values(settings.social).some(Boolean), label: "Link at least one social profile", href: "/admin/settings#social" },
    { done: !!(settings.cta.consultationNoteEn || settings.cta.consultationNoteAr), label: "Describe how consultations work (free or paid)", href: "/admin/settings#cta" },
    { done: mediaCount > 0, label: "Upload real photography when available", href: "/admin/media" },
    { done: !!settings.seo.googleVerification, label: "Verify the site in Google Search Console", href: "/admin/settings#seo" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="An overview of the website and incoming enquiries." />
      {sp.denied ? <Notice tone="warning">Your role doesn't have access to that page.</Notice> : null}

      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium", settings.maintenance.enabled ? "bg-glow/30 text-[#7a4f10]" : "bg-ok/10 text-ok")}>
          <span className={cn("h-2 w-2 rounded-full", settings.maintenance.enabled ? "bg-[#c07a1a]" : "bg-ok")} />
          {settings.maintenance.enabled ? "Maintenance mode is ON" : "Website is live"}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10">{settings.seo.allowIndexing ? "Search indexing: allowed" : "Search indexing: blocked"}</span>
        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10">WhatsApp: {settings.contact.whatsappNumber ? "configured" : "not set"}</span>
        <a href="/" target="_blank" rel="noopener" className="rounded-full bg-ink px-3 py-1.5 text-paper">
          Open website ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="New leads" value={newLeads} sub={`${recentLeads} in the last 30 days`} href={can(user.role, "leads.view") ? "/admin/leads?status=new" : undefined} />
        <Stat label="Published solutions" value={by(solStats, "available")} sub={`${by(solStats, "coming_soon")} coming soon · ${by(solStats, "hidden")} hidden`} href={can(user.role, "content.edit") ? "/admin/solutions" : undefined} />
        <Stat label="Packages" value={by(pkgStats, "available") + by(pkgStats, "coming_soon")} sub={`${by(pkgStats, "available")} available · ${by(pkgStats, "coming_soon")} coming soon`} href={can(user.role, "content.edit") ? "/admin/packages" : undefined} />
        <Stat label="Media & content" value={mediaCount} sub={`images · ${projectCount} projects · ${articleCount} articles`} href={can(user.role, "media.manage") ? "/admin/media" : undefined} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="admin-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Latest leads</h2>
            {can(user.role, "leads.view") ? (
              <Link href="/admin/leads" className="text-sm text-stone hover:text-ink">
                View all →
              </Link>
            ) : null}
          </div>
          {latestLeads.length ? (
            <ul className="mt-4 divide-y divide-ink/5">
              {latestLeads.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-paper-2/40">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="truncate text-xs text-stone">{l.projectType || l.message.slice(0, 60) || "—"}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <Badge status={l.status} />
                      <p className="mt-1 text-xs text-stone">{formatDateTime(l.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone">No leads yet. They'll appear here as soon as someone uses the contact form.</p>
          )}
        </section>

        <section className="admin-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Launch checklist</h2>
            <span className="text-xs text-stone">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/5">
            <div className="h-full bg-signal" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.6rem]", c.done ? "bg-ok text-white" : "ring-1 ring-ink/25")}>{c.done ? "✓" : ""}</span>
                {can(user.role, "settings.manage") || c.href === "/admin/media" ? (
                  <Link href={c.href} className={cn("hover:underline", c.done && "text-stone line-through")}>
                    {c.label}
                  </Link>
                ) : (
                  <span className={cn(c.done && "text-stone line-through")}>{c.label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {activity.length ? (
        <section className="admin-card mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href="/admin/activity" className="text-sm text-stone hover:text-ink">
              Full log →
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <span className="w-36 shrink-0 text-xs text-stone">{formatDateTime(a.createdAt)}</span>
                <span>
                  <span className="font-medium">{a.user ?? "System"}</span> <span className="text-graphite">— {a.summary}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
