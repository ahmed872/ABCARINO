import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { DeleteButton, MoveButtons, StatusSelect } from "@/components/admin/RowActions";
import { EmptyState, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { deletePartner, movePartner, setPartnerStatus } from "./actions";

export const metadata: Metadata = { title: "Partners" };

const REL: Record<string, string> = { partner: "Partner", supplier: "Supplier", technology_brand: "Technology brand", strategic_partner: "Strategic partner", company: "Company" };

export default async function PartnersAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const [rows, settings] = await Promise.all([db.select().from(partners).orderBy(asc(partners.sortOrder)), getSettings()]);
  const canDelete = can(user.role, "content.delete");
  return (
    <>
      <PageHeader title="Partners" description="Only list partners, suppliers and brands you have a real, confirmed relationship with." actions={<LinkButton href="/admin/partners/new">New partner</LinkButton>} />
      <Notice tone={settings.sections.showPartners ? "success" : "warning"}>
        The public Partners page is currently <strong>{settings.sections.showPartners ? "enabled" : "disabled"}</strong>.{" "}
        <Link href="/admin/settings#sections" className="underline">
          Change in Settings → Sections
        </Link>
        .
      </Notice>
      {sp.deleted ? <Notice tone="success">Partner deleted.</Notice> : null}
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th className="w-20">Order</Th>
              <Th>Name</Th>
              <Th>Relationship</Th>
              <Th>Status</Th>
              <Th className="text-end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <MoveButtons id={r.id} onMove={movePartner} />
                </Td>
                <Td>
                  <Link href={`/admin/partners/${r.id}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                  <p className="text-xs text-stone">{r.category}</p>
                </Td>
                <Td className="text-stone">{REL[r.relationship]}</Td>
                <Td>
                  <StatusSelect id={r.id} value={r.status} options={[{ value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }]} onChange={setPartnerStatus} />
                </Td>
                <Td className="whitespace-nowrap text-end">
                  <Link href={`/admin/partners/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                    Edit
                  </Link>
                  {canDelete ? <DeleteButton id={r.id} onDelete={deletePartner} confirmText={`Delete “${r.name}”?`} /> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No partners yet" text="Add partners, suppliers or technology brands once relationships are confirmed." action={<LinkButton href="/admin/partners/new">Add partner</LinkButton>} />
      )}
    </>
  );
}
