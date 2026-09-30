/* Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "../src/lib/db";
import { env } from "../src/lib/env";

/**
 * Deployments run this first (Vercel build, Docker entrypoint), so refuse a
 * configuration the site would silently misbehave with — e.g. a missing
 * APP_SECRET only surfaces later, as failing sign-ins and contact forms.
 * Values are never printed.
 */
function checkProductionEnv() {
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") return;
  env(); // DATABASE_URL present, APP_SECRET ≥ 32 chars, APP_URL a valid URL
  if (!process.env.VERCEL && !process.env.APP_URL) {
    throw new Error("APP_URL is not set. Set it to the public address of the site, e.g. https://abcarino.com.");
  }
  if (!env().APP_URL.startsWith("https://")) {
    console.warn("Warning: APP_URL is not https:// — secure cookies and HSTS stay off.");
  }
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("Warning: BLOB_READ_WRITE_TOKEN is not set — media uploads fail until a Vercel Blob store is connected.");
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add a PostgreSQL connection string to your environment (on Vercel: Project → Settings → Environment Variables, or connect a database from the Storage tab).",
    );
  }
  checkProductionEnv();
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
