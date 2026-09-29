import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Activity log" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePageUser("audit.view");
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  const pageSize = 100;
  const rows = await db
    .select({ id: auditLog.id, action: auditLog.action, summary: auditLog.summary, createdAt: auditLog.createdAt, ip: auditLog.ip, user: users.name })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId))
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize);
  return (
    <>
      <PageHeader title="Activity log" description="An append-only record of sign-ins and every change made in the admin." />
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>Details</Th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, pageSize).map((r) => (
            <tr key={r.id}>
              <Td className="whitespace-nowrap text-xs text-stone">{formatDateTime(r.createdAt)}</Td>
              <Td>{r.user ?? <span className="text-stone">—</span>}</Td>
              <Td className="font-mono text-xs">{r.action}</Td>
              <Td className="text-stone">{r.summary}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="mt-4 flex justify-between text-sm">
        {page > 1 ? <Link href={`/admin/activity?page=${page - 1}`}>← Newer</Link> : <span />}
        {rows.length > pageSize ? <Link href={`/admin/activity?page=${page + 1}`}>Older →</Link> : null}
      </div>
    </>
  );
}
