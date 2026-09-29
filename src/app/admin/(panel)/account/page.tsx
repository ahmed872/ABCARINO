import type { Metadata } from "next";
import { EntityForm, Section, TextField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { changeOwnPassword } from "../users/actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title="My account" description={`${user.email} · ${ROLE_LABELS[user.role]}`} />
      <EntityForm action={changeOwnPassword} submitLabel="Change password">
        <Section title="Change password" description="Use a long, unique password — a password manager is recommended.">
          <TextField name="current" label="Current password" type="password" required />
          <TextField name="next" label="New password" type="password" required hint="At least 12 characters." />
          <TextField name="confirm" label="Confirm new password" type="password" required />
        </Section>
      </EntityForm>
    </>
  );
}
