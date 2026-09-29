import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { StatusSelect } from "@/components/admin/RowActions";
import { Badge, EmptyState, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leads, leadStatus } from "@/lib/db/schema";
import { cn, formatDateTime } from "@/lib/utils";
import { updateLeadStatus } from "./actions";

export const metadata: Metadata = { title: "Leads" };

const STATUSES = leadStatus.enumValues;
const LABEL: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal", won: "Won", lost: "Lost" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; deleted?: string; page?: string }> }) {
  const user = await requirePageUser("leads.view");
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? (sp.status as (typeof STATUSES)[number]) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 50;

  const conds: SQL[] = [];
  if (status) conds.push(eq(leads.status, status));
  if (q) conds.push(or(ilike(leads.name, `%${q}%`), ilike(leads.email, `%${q}%`), ilike(leads.phone, `%${q}%`), ilike(leads.message, `%${q}%`))!);
  const where = conds.length ? and(...conds) : undefined;

  const [rows, totals, [{ n: filtered }]] = await Promise.all([
    db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ status: leads.status, n: count() }).from(leads).groupBy(leads.status),
    db.select({ n: count() }).from(leads).where(where),
  ]);
  const totalMap = new Map(totals.map((t) => [t.status, t.n]));
  const all = totals.reduce((s, t) => s + t.n, 0);
  const canManage = can(user.role, "leads.manage");
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || undefined, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description="Contact form submissions from the website. Update the status as conversations progress."
        actions={
          <a href={`/api/admin/leads/export${qs({})}`} className="inline-flex h-10 items-center rounded-lg border border-ink/15 bg-white px-4 text-sm font-medium hover:border-ink">
            Export CSV
          </a>
        }
      />
      {sp.deleted ? <Notice tone="success">Lead deleted.</Notice> : null}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/admin/leads${qs({ status: undefined, page: undefined }).replace(/status=[^&]*&?/, "")}`} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", !status ? "bg-ink text-paper" : "bg-white ring-1 ring-ink/10")}>
            All · {all}
          </Link>
          {STATUSES.map((s) => (
            <Link key={s} href={`/admin/leads${qs({ status: s, page: undefined })}`} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", status === s ? "bg-ink text-paper" : "bg-white ring-1 ring-ink/10")}>
              {LABEL[s]} · {totalMap.get(s) ?? 0}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="Search name, phone, email…" className="admin-input w-64" />
          <button className="rounded-lg bg-ink px-4 text-sm text-paper">Search</button>
        </form>
      </div>
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Received</Th>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Interest</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn("hover:bg-paper-2/40", r.status === "new" && "bg-signal/[0.03]")}>
                <Td className="whitespace-nowrap text-xs text-stone">{formatDateTime(r.createdAt)}</Td>
                <Td>
                  <Link href={`/admin/leads/${r.id}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                  <p className="text-xs text-stone">
                    Prefers {r.preferredContact} · {r.locale.toUpperCase()}
                  </p>
                </Td>
                <Td className="text-xs">
                  {r.phone ? <p dir="ltr">{r.phone}</p> : null}
                  {r.email ? <p className="text-stone">{r.email}</p> : null}
                </Td>
                <Td className="max-w-48 truncate text-xs text-stone">{r.projectType || "—"}</Td>
                <Td>
                  {canManage ? (
                    <StatusSelect id={r.id} value={r.status} options={STATUSES.map((s) => ({ value: s, label: LABEL[s] }))} onChange={updateLeadStatus} />
                  ) : (
                    <Badge status={r.status} />
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title={q || status ? "No leads match this filter" : "No leads yet"} text="Submissions from the website contact form will appear here." />
      )}
      {filtered > pageSize ? (
        <div className="mt-4 flex justify-between text-sm">
          {page > 1 ? <Link href={`/admin/leads${qs({ page: String(page - 1) })}`}>← Newer</Link> : <span />}
          {page * pageSize < filtered ? <Link href={`/admin/leads${qs({ page: String(page + 1) })}`}>Older →</Link> : null}
        </div>
      ) : null}
    </>
  );
}
