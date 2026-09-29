import "server-only";
import { asc, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, packages, partners, projects, solutions } from "@/lib/db/schema";

type Sortable = typeof solutions | typeof packages | typeof categories | typeof projects | typeof partners;

/** Move a row one step up/down and renumber its list in steps of 10. */
export async function moveRow(table: Sortable, id: string, dir: "up" | "down", scope?: SQL) {
  const t = table as unknown as typeof solutions;
  const rows = await db
    .select({ id: t.id })
    .from(t)
    .where(scope)
    .orderBy(asc(t.sortOrder), asc(t.createdAt));
  const index = rows.findIndex((r) => r.id === id);
  const target = dir === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;
  [rows[index], rows[target]] = [rows[target], rows[index]];
  await db.transaction(async (tx) => {
    for (const [i, row] of rows.entries()) {
      await tx.update(t).set({ sortOrder: (i + 1) * 10 }).where(eq(t.id, row.id));
    }
  });
}

/** Next sort position at the end of a list. */
export async function nextSortOrder(table: Sortable): Promise<number> {
  const t = table as unknown as typeof solutions;
  const rows = await db.select({ s: t.sortOrder }).from(t);
  return rows.reduce((m, r) => Math.max(m, r.s), 0) + 10;
}
