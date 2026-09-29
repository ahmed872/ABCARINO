import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { DeleteButton, MoveButtons, StatusSelect } from "@/components/admin/RowActions";
import { EmptyState, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories, packages } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";
import { deletePackage, movePackage, setPackageStatus } from "./actions";

export const metadata: Metadata = { title: "Packages" };

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "hidden", label: "Hidden" },
];
const PRICING: Record<string, string> = {
  contact: "Price on request",
  starting_from: "Starting from",
  fixed: "Fixed price",
  coming_soon: "Coming soon",
};

export default async function PackagesAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const rows = await db
    .select({
      id: packages.id,
      slug: packages.slug,
      nameEn: packages.nameEn,
      nameAr: packages.nameAr,
      status: packages.status,
      featured: packages.featured,
      pricingMode: packages.pricingMode,
      price: packages.price,
      currency: packages.currency,
      category: categories.nameEn,
    })
    .from(packages)
    .leftJoin(categories, eq(categories.id, packages.categoryId))
    .orderBy(asc(packages.sortOrder), asc(packages.createdAt));
  const canDelete = can(user.role, "content.delete");
  return (
    <>
      <PageHeader
        title="Packages"
        description="Clear starting points with flexible pricing: price on request, starting from, fixed, or coming soon."
        actions={<LinkButton href="/admin/packages/new">New package</LinkButton>}
      />
      {sp.deleted ? <Notice tone="success">Package deleted.</Notice> : null}
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th className="w-20">Order</Th>
              <Th>Package</Th>
              <Th>Pricing</Th>
              <Th>Status</Th>
              <Th className="text-end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2/40">
                <Td>
                  <MoveButtons id={r.id} onMove={movePackage} />
                </Td>
                <Td>
                  <Link href={`/admin/packages/${r.id}`} className="font-medium hover:underline">
                    {r.nameEn}
                  </Link>
                  {r.featured ? <span className="ms-2 text-xs text-signal">★ Featured</span> : null}
                  <p className="text-xs text-stone">
                    {r.category ?? "No category"} · <span lang="ar">{r.nameAr}</span>
                  </p>
                </Td>
                <Td className="text-stone">
                  {PRICING[r.pricingMode]}
                  {r.price && (r.pricingMode === "fixed" || r.pricingMode === "starting_from") ? ` · ${formatPrice(r.price, r.currency, "en")}` : ""}
                </Td>
                <Td>
                  <StatusSelect id={r.id} value={r.status} options={STATUS_OPTIONS} onChange={setPackageStatus} />
                </Td>
                <Td className="whitespace-nowrap text-end">
                  <Link href={`/admin/packages/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                    Edit
                  </Link>
                  {r.status !== "hidden" ? (
                    <a href={`/en/packages/${r.slug}`} target="_blank" rel="noopener" className="rounded-md px-2 py-1 text-xs font-medium text-stone hover:bg-paper-2">
                      View
                    </a>
                  ) : null}
                  {canDelete ? <DeleteButton id={r.id} onDelete={deletePackage} confirmText={`Delete “${r.nameEn}” permanently? Consider setting it to Hidden instead.`} /> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No packages yet" action={<LinkButton href="/admin/packages/new">New package</LinkButton>} />
      )}
    </>
  );
}
