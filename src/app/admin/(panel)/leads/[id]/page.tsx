import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DeleteButton, StatusSelect } from "@/components/admin/RowActions";
import { Badge, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leadNotes, leadStatus, leads, users } from "@/lib/db/schema";
import { formatDateTime, whatsappLink } from "@/lib/utils";
import { addLeadNote, deleteLead, updateLeadStatus } from "../actions";
import { NoteForm } from "../NoteForm";

export const metadata: Metadata = { title: "Lead" };
const LABEL: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal", won: "Won", lost: "Lost" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("leads.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) notFound();
  const notes = await db
    .select({ id: leadNotes.id, body: leadNotes.body, createdAt: leadNotes.createdAt, author: users.name })
    .from(leadNotes)
    .leftJoin(users, eq(users.id, leadNotes.authorId))
    .where(eq(leadNotes.leadId, id))
    .orderBy(asc(leadNotes.createdAt));
  const canManage = can(user.role, "leads.manage");
  const wa = whatsappLink(lead.phone);
  const row = "grid grid-cols-3 gap-4 border-b border-ink/5 py-3 text-sm last:border-0";

  return (
    <>
      <PageHeader title={lead.name} description={`Received ${formatDateTime(lead.createdAt)}`} back={{ href: "/admin/leads", label: "Leads" }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="admin-card p-6">
            <h2 className="font-semibold">Message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-graphite" dir="auto">
              {lead.message || "No message."}
            </p>
          </section>
          <section className="admin-card p-6">
            <h2 className="font-semibold">Notes</h2>
            <ol className="mt-4 space-y-4">
              {notes.map((n) => (
                <li key={n.id} className="border-s-2 border-ink/10 ps-4">
                  <p className="whitespace-pre-wrap text-sm" dir="auto">
                    {n.body}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {n.author ?? "Former user"} · {formatDateTime(n.createdAt)}
                  </p>
                </li>
              ))}
              {!notes.length ? <li className="text-sm text-stone">No notes yet.</li> : null}
            </ol>
            {canManage ? (
              <div className="mt-5 border-t border-ink/10 pt-5">
                <NoteForm action={addLeadNote.bind(null, lead.id)} />
              </div>
            ) : null}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="admin-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Status</h2>
              <Badge status={lead.status} />
            </div>
            {canManage ? (
              <div className="mt-3">
                <StatusSelect id={lead.id} value={lead.status} options={leadStatus.enumValues.map((s) => ({ value: s, label: LABEL[s] }))} onChange={updateLeadStatus} />
              </div>
            ) : null}
          </section>
          <section className="admin-card px-6 py-3">
            <div className={row}>
              <span className="text-stone">Phone</span>
              <span className="col-span-2" dir="ltr">
                {lead.phone ? <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a> : "—"}
              </span>
            </div>
            <div className={row}>
              <span className="text-stone">Email</span>
              <span className="col-span-2 break-all">{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</span>
            </div>
            <div className={row}>
              <span className="text-stone">Prefers</span>
              <span className="col-span-2 capitalize">{lead.preferredContact}</span>
            </div>
            <div className={row}>
              <span className="text-stone">Interest</span>
              <span className="col-span-2">{lead.projectType || "—"}</span>
            </div>
            <div className={row}>
              <span className="text-stone">Language</span>
              <span className="col-span-2">{lead.locale === "ar" ? "Arabic" : "English"}</span>
            </div>
            <div className={row}>
              <span className="text-stone">Page</span>
              <span className="col-span-2 break-all text-xs">{lead.sourcePath || "—"}</span>
            </div>
          </section>
          <div className="flex flex-wrap gap-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white">
                Open WhatsApp chat
              </a>
            ) : null}
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-medium">
                Email
              </a>
            ) : null}
            {canManage ? <DeleteButton id={lead.id} onDelete={deleteLead} label="Delete lead" confirmText="Delete this lead and its notes permanently?" /> : null}
          </div>
        </aside>
      </div>
    </>
  );
}
