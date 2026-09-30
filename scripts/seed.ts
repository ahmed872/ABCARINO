/**
 * First-install seed. Starter categories, solutions and packages are inserted
 * (atomically) only into an empty catalogue, and the first super admin only
 * when no user exists. Safe to run on every deploy (Vercel's build does): it
 * never overwrites admin edits, never re-creates content an admin deleted, and
 * never creates a second admin after the first account's email was changed.
 */
import { and, eq, sql } from "drizzle-orm";
import { closeDb, db } from "../src/lib/db";
import { categories, packageSolutions, packages, solutions, users } from "../src/lib/db/schema";
import { ensureSuperAdmin } from "./admin-lib";
import { seedArticleCategories, seedCategories, seedPackages, seedSolutions } from "./seed-data";

async function count(table: typeof categories | typeof solutions | typeof packages | typeof users): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
  return row.n;
}

async function main() {
  const existing = (await count(categories)) + (await count(solutions)) + (await count(packages));
  if (existing > 0) {
    console.log("Catalogue already initialised — starter content skipped (existing and deleted rows stay as the admins left them).");
  } else {
    await db.transaction(seedCatalogue);
  }

  if ((await count(users)) > 0) {
    console.log("Admin accounts already exist — skipping admin creation (use `npm run admin:create` to add or reset one).");
  } else if (process.env.ADMIN_EMAIL) {
    await ensureSuperAdmin();
  } else {
    console.warn("ADMIN_EMAIL is not set — skipping admin creation. Set it and run `npm run admin:create`.");
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function seedCatalogue(db: Tx) {
  const catIds = new Map<string, string>();

  for (const [scope, list] of [
    ["solution", seedCategories],
    ["article", seedArticleCategories],
  ] as const) {
    for (const [i, c] of list.entries()) {
      const found = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.scope, scope), eq(categories.slug, c.slug)))
        .limit(1);
      if (found.length) {
        if (scope === "solution") catIds.set(c.slug, found[0].id);
        continue;
      }
      const [row] = await db
        .insert(categories)
        .values({ ...c, scope, sortOrder: (i + 1) * 10 })
        .returning({ id: categories.id });
      if (scope === "solution") catIds.set(c.slug, row.id);
    }
  }

  const solIds = new Map<string, string>();
  for (const [i, s] of seedSolutions.entries()) {
    const found = await db.select({ id: solutions.id }).from(solutions).where(eq(solutions.slug, s.slug)).limit(1);
    if (found.length) {
      solIds.set(s.slug, found[0].id);
      continue;
    }
    const { category, benefits, features, featured, ...rest } = s;
    const [row] = await db
      .insert(solutions)
      .values({
        ...rest,
        categoryId: catIds.get(category) ?? null,
        benefits: benefits ?? [],
        features: features ?? [],
        featured: featured ?? false,
        sortOrder: (i + 1) * 10,
      })
      .returning({ id: solutions.id });
    solIds.set(s.slug, row.id);
  }

  for (const [i, p] of seedPackages.entries()) {
    const found = await db.select({ id: packages.id }).from(packages).where(eq(packages.slug, p.slug)).limit(1);
    if (found.length) continue;
    const { category, included, optional, solutions: linked, featured, ...rest } = p;
    const [row] = await db
      .insert(packages)
      .values({
        ...rest,
        categoryId: catIds.get(category) ?? null,
        includedFeatures: included,
        optionalFeatures: optional ?? [],
        featured: featured ?? false,
        sortOrder: (i + 1) * 10,
      })
      .returning({ id: packages.id });
    const links = linked.map((slug) => solIds.get(slug)).filter((x): x is string => !!x);
    if (links.length) {
      await db.insert(packageSolutions).values(links.map((solutionId) => ({ packageId: row.id, solutionId })));
    }
  }

  console.log(`Seeded ${catIds.size} categories, ${solIds.size} solutions, ${seedPackages.length} packages.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
