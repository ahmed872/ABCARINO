import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { DeleteButton, MoveButtons, StatusSelect } from "@/components/admin/RowActions";
import { EmptyState, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories, solutions } from "@/lib/db/schema";
import { deleteSolution, moveSolution, setSolutionStatus } from "./actions";

export const metadata: Metadata = { title: "Solutions" };

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "hidden", label: "Hidden" },
];

export default async function SolutionsAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const rows = await db
    .select({
      id: solutions.id,
      slug: solutions.slug,
      titleEn: solutions.titleEn,
      titleAr: solutions.titleAr,
      status: solutions.status,
      featured: solutions.featured,
      category: categories.nameEn,
      updatedAt: solutions.updatedAt,
    })
    .from(solutions)
    .leftJoin(categories, eq(categories.id, solutions.categoryId))
    .orderBy(asc(solutions.sortOrder), asc(solutions.createdAt));
  const canDelete = can(user.role, "content.delete");

  return (
    <>
      <PageHeader
        title="Solutions"
        description="Everything ABCARINO offers. Change a status to publish (Available), announce (Coming soon) or hide a solution — the website updates instantly."
        actions={<LinkButton href="/admin/solutions/new">New solution</LinkButton>}
      />
      {sp.deleted ? <Notice tone="success">Solution deleted.</Notice> : null}
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <Th className="w-20">Order</Th>
              <Th>Solution</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th className="text-end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2/40">
                <Td>
                  <MoveButtons id={r.id} onMove={moveSolution} />
                </Td>
                <Td>
                  <Link href={`/admin/solutions/${r.id}`} className="font-medium hover:underline">
                    {r.titleEn}
                  </Link>
                  {r.featured ? <span className="ms-2 text-xs text-signal">★ Featured</span> : null}
                  <p className="text-xs text-stone" lang="ar">
                    {r.titleAr}
                  </p>
                </Td>
                <Td className="text-stone">{r.category ?? "—"}</Td>
                <Td>
                  <StatusSelect id={r.id} value={r.status} options={STATUS_OPTIONS} onChange={setSolutionStatus} />
                </Td>
                <Td className="whitespace-nowrap text-end">
                  <Link href={`/admin/solutions/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                    Edit
                  </Link>
                  {r.status !== "hidden" ? (
                    <a href={`/en/solutions/${r.slug}`} target="_blank" rel="noopener" className="rounded-md px-2 py-1 text-xs font-medium text-stone hover:bg-paper-2">
                      View
                    </a>
                  ) : null}
                  {canDelete ? <DeleteButton id={r.id} onDelete={deleteSolution} confirmText={`Delete “${r.titleEn}” permanently? Consider setting it to Hidden instead.`} /> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No solutions yet" text="Create your first solution to show it on the website." action={<LinkButton href="/admin/solutions/new">New solution</LinkButton>} />
      )}
    </>
  );
}
