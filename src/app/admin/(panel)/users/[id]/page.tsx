import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckboxField, EntityForm, Section, SelectField, TextField } from "@/components/admin/fields";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { updateUser } from "../actions";
import { ROLE_OPTIONS } from "../roles";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePageUser("users.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={u.name} description={`${u.email} · last sign-in ${formatDateTime(u.lastLoginAt) || "never"}`} back={{ href: "/admin/users", label: "Users" }} />
      {sp.created ? <Notice tone="success">User created.</Notice> : null}
      {u.lockedUntil && u.lockedUntil > new Date() ? <Notice tone="warning">This account is temporarily locked after repeated failed sign-ins. Resetting the password unlocks it.</Notice> : null}
      <EntityForm action={updateUser.bind(null, u.id)}>
        <Section title="Account">
          <TextField name="name" label="Full name" defaultValue={u.name} required />
          <SelectField name="role" label="Role" options={ROLE_OPTIONS} defaultValue={u.role} />
          <CheckboxField name="isActive" label="Active" defaultChecked={u.isActive} hint="Inactive users cannot sign in and are signed out immediately." />
        </Section>
        <Section title="Reset password" description="Optional. Leave empty to keep the current password.">
          <TextField name="newPassword" label="New password" type="password" hint="At least 12 characters. Signs the user out of all devices." />
        </Section>
      </EntityForm>
    </>
  );
}
