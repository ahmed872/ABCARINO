/* Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "../src/lib/db";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add a PostgreSQL connection string to your environment (on Vercel: Project → Settings → Environment Variables, or connect a database from the Storage tab).",
    );
  }
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
