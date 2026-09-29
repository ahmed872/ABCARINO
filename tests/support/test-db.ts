import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/** Points the app at an isolated test database and rebuilds its schema. */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://abcarino:abcarino@localhost:5432/abcarino_test";

export async function resetTestDatabase() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  const { db } = await import("@/lib/db");
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}
