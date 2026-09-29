import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { savePartner } from "../actions";
import { PartnerForm } from "../PartnerForm";

export const metadata: Metadata = { title: "New partner" };

export default async function NewPartnerPage() {
  await requirePageUser("content.edit");
  return (
    <>
      <PageHeader title="New partner" back={{ href: "/admin/partners", label: "Partners" }} />
      <PartnerForm action={savePartner.bind(null, null)} />
    </>
  );
}
