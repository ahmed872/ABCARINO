import type { Metadata } from "next";
import { EntityForm, Section, SelectField, TextField } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { createUser } from "../actions";
import { ROLE_OPTIONS } from "../roles";

export const metadata: Metadata = { title: "New user" };

export default async function NewUserPage() {
  await requirePageUser("users.manage");
  return (
    <>
      <PageHeader title="New user" back={{ href: "/admin/users", label: "Users" }} />
      <EntityForm action={createUser} submitLabel="Create user">
        <Section title="Account" description="Share the temporary password privately and ask them to change it from their Account page.">
          <TextField name="name" label="Full name" required />
          <TextField name="email" label="Email" type="email" required />
          <SelectField name="role" label="Role" options={ROLE_OPTIONS} defaultValue="editor" />
          <TextField name="password" label="Temporary password" type="password" required hint="At least 12 characters." />
        </Section>
      </EntityForm>
    </>
  );
}
