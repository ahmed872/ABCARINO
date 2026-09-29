"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction, isUuid } from "@/lib/admin/guard";
import { str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leadNotes, leads } from "@/lib/db/schema";
import { leadUpdateSchema } from "@/lib/validation/content";

export async function updateLeadStatus(id: string, status: string) {
  const user = await requireUser("leads.manage");
  if (!isUuid(id)) return;
  const parsed = leadUpdateSchema.safeParse({ status });
  if (!parsed.success) return;
  const [row] = await db.update(leads).set({ status: parsed.data.status }).where(eq(leads.id, id)).returning({ name: leads.name });
  await audit({ userId: user.id, action: "lead.status", entityType: "lead", entityId: id, summary: `${row?.name} → ${parsed.data.status}` });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function addLeadNote(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction("leads.manage", async ({ user, ip }) => {
    const body = str(fd, "body").trim();
    if (!body) return { ok: false, errors: { body: "Write a note first." } };
    if (body.length > 4000) return { ok: false, errors: { body: "Notes are limited to 4,000 characters." } };
    await db.insert(leadNotes).values({ leadId: id, authorId: user.id, body });
    await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, id));
    await audit({ userId: user.id, action: "lead.note", entityType: "lead", entityId: id, summary: "Added a note", ip });
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Note added." };
  });
}

export async function deleteLead(id: string) {
  const user = await requireUser("leads.manage");
  if (!isUuid(id)) return;
  const [row] = await db.delete(leads).where(eq(leads.id, id)).returning({ name: leads.name });
  await audit({ userId: user.id, action: "lead.delete", entityType: "lead", entityId: id, summary: `Deleted lead from ${row?.name}` });
  revalidatePath("/admin/leads");
  redirect("/admin/leads?deleted=1");
}
