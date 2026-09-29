import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { leads, leadStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Neutralise spreadsheet formula injection and quote for CSV. */
function cell(value: unknown): string {
  let s = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.view")) return new Response("Unauthorized", { status: 401 });
  const sp = request.nextUrl.searchParams;
  const conds: SQL[] = [];
  const status = sp.get("status");
  if (status && (leadStatus.enumValues as readonly string[]).includes(status)) conds.push(eq(leads.status, status as (typeof leadStatus.enumValues)[number]));
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  if (q) conds.push(or(ilike(leads.name, `%${q}%`), ilike(leads.email, `%${q}%`), ilike(leads.phone, `%${q}%`))!);
  const rows = await db.select().from(leads).where(conds.length ? and(...conds) : undefined).orderBy(desc(leads.createdAt)).limit(10000);
  const header = ["Received", "Name", "Phone", "Email", "Interest", "Preferred contact", "Language", "Status", "Message"];
  const lines = [header.map(cell).join(","), ...rows.map((r) => [r.createdAt, r.name, r.phone, r.email, r.projectType, r.preferredContact, r.locale, r.status, r.message].map(cell).join(","))];
  await audit({ userId: user.id, action: "lead.export", entityType: "lead", summary: `Exported ${rows.length} leads` });
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abcarino-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
