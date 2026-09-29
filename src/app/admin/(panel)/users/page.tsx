import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { Badge, LinkButton, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  await requirePageUser("users.manage");
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return (
    <>
      <PageHeader title="Users" description="People who can sign in to this admin. Give each person the smallest role they need." actions={<LinkButton href="/admin/users/new">Invite user</LinkButton>} />
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last sign-in</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <Td>
                <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                  {u.name}
                </Link>
                <p className="text-xs text-stone">{u.email}</p>
              </Td>
              <Td>{ROLE_LABELS[u.role]}</Td>
              <Td>{u.isActive ? <Badge status="published">Active</Badge> : <Badge status="hidden">Inactive</Badge>}</Td>
              <Td className="text-stone">{formatDateTime(u.lastLoginAt) || "Never"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="admin-card mt-8 p-6 text-sm text-graphite">
        <h2 className="font-semibold text-ink">Roles</h2>
        <ul className="mt-3 space-y-1.5">
          <li><strong>Super Admin</strong> — everything, including settings and users.</li>
          <li><strong>Content Manager</strong> — all content and media, can delete, can view leads.</li>
          <li><strong>Editor</strong> — create and edit content and media, cannot delete.</li>
          <li><strong>Sales</strong> — view and manage leads.</li>
          <li><strong>Operations</strong> — manage leads and media.</li>
        </ul>
      </div>
    </>
  );
}
