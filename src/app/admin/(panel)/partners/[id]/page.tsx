import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { savePartner } from "../actions";
import { PartnerForm } from "../PartnerForm";

export const metadata: Metadata = { title: "Edit partner" };

export default async function EditPartnerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePageUser("content.edit");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [partner] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!partner) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={partner.name} back={{ href: "/admin/partners", label: "Partners" }} />
      {sp.created ? <Notice tone="success">Partner created.</Notice> : null}
      <PartnerForm partner={partner} action={savePartner.bind(null, partner.id)} />
    </>
  );
}
