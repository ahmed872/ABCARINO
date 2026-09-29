/* Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "../src/lib/db";

async function main() {
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
