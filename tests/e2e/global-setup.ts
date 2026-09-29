import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { chromium, type FullConfig } from "@playwright/test";
import postgres from "postgres";
import { e2eEnv } from "../../playwright.config";

export const ADMIN_STATE = "tests/e2e/.auth/admin.json";

export default async function globalSetup(config: FullConfig) {
  const sql = postgres(e2eEnv.DATABASE_URL, { onnotice: () => {} });
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql.end();
  rmSync(e2eEnv.STORAGE_DIR, { recursive: true, force: true });

  const env = { ...process.env, ...e2eEnv };
  execSync("npx tsx scripts/migrate.ts", { env, stdio: "inherit" });
  execSync("npx tsx scripts/seed.ts", { env, stdio: "inherit" });

  mkdirSync("tests/e2e/.auth", { recursive: true });
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto("/admin/login");
  await page.fill("#email", e2eEnv.ADMIN_EMAIL);
  await page.fill("#password", e2eEnv.ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");
  await page.context().storageState({ path: ADMIN_STATE });
  await browser.close();
}
