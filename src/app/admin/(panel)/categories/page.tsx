import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { DeleteButton, MoveButtons } from "@/components/admin/RowActions";
import { Badge, LinkButton, Notice, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { can } from "@/lib/auth/permissions";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories, solutions } from "@/lib/db/schema";
import { deleteCategory, moveCategory } from "./actions";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const user = await requirePageUser("content.edit");
  const sp = await searchParams;
  const [rows, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.scope), asc(categories.sortOrder)),
    db.select({ categoryId: solutions.categoryId, n: count() }).from(solutions).groupBy(solutions.categoryId),
  ]);
  const countMap = new Map(counts.map((c) => [c.categoryId, c.n]));
  const canDelete = can(user.role, "content.delete");
  const groups = [
    { scope: "solution", title: "Solution categories", hint: "Group solutions, packages and projects. Shown on the website." },
    { scope: "article", title: "Article categories", hint: "Used by the Insights section once activated." },
  ] as const;
  return (
    <>
      <PageHeader title="Categories" description="Add new areas of business at any time — no code changes needed." actions={<LinkButton href="/admin/categories/new">New category</LinkButton>} />
      {sp.deleted ? <Notice tone="success">Category deleted.</Notice> : null}
      <div className="space-y-10">
        {groups.map((g) => (
          <div key={g.scope}>
            <h2 className="font-semibold">{g.title}</h2>
            <p className="mb-3 text-sm text-stone">{g.hint}</p>
            <Table>
              <thead>
                <tr>
                  <Th className="w-20">Order</Th>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  {g.scope === "solution" ? <Th>Solutions</Th> : null}
                  <Th>Visibility</Th>
                  <Th className="text-end">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.scope === g.scope)
                  .map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <MoveButtons id={r.id} onMove={moveCategory} />
                      </Td>
                      <Td>
                        <Link href={`/admin/categories/${r.id}`} className="font-medium hover:underline">
                          {r.nameEn}
                        </Link>
                        <p className="text-xs text-stone" lang="ar">
                          {r.nameAr}
                        </p>
                      </Td>
                      <Td className="font-mono text-xs text-stone">{r.slug}</Td>
                      {g.scope === "solution" ? <Td className="text-stone">{countMap.get(r.id) ?? 0}</Td> : null}
                      <Td>{r.isVisible ? <Badge status="published">Visible</Badge> : <Badge status="hidden" />}</Td>
                      <Td className="whitespace-nowrap text-end">
                        <Link href={`/admin/categories/${r.id}`} className="rounded-md px-2 py-1 text-xs font-medium hover:bg-paper-2">
                          Edit
                        </Link>
                        {canDelete ? <DeleteButton id={r.id} onDelete={deleteCategory} confirmText={`Delete “${r.nameEn}”? Items in it are kept but become uncategorised.`} /> : null}
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>
        ))}
      </div>
    </>
  );
}
