/**
 * The scripts every deployment runs (Vercel build: migrate + seed; Docker entrypoint: migrate)
 * must never damage production data and must fail loudly — without printing secrets — when
 * the environment is wrong.
 */
import { spawnSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db";
import { resetTestDatabase, TEST_DATABASE_URL } from "../support/test-db";

type Db = Awaited<ReturnType<typeof resetTestDatabase>>;
let db: Db;

const SECRET = "integration-secret-0123456789abcdef-0123456789";
const BASE_ENV = { PATH: process.env.PATH, HOME: process.env.HOME, TZ: "UTC" };

function run(script: string, env: Record<string, string | undefined>) {
  const res = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", `scripts/${script}.ts`], {
    env: { ...BASE_ENV, ...env } as unknown as NodeJS.ProcessEnv,
    encoding: "utf8",
    timeout: 60_000,
  });
  return { code: res.status, out: `${res.stdout}\n${res.stderr}` };
}

const deployEnv = { DATABASE_URL: TEST_DATABASE_URL, ADMIN_EMAIL: "founder@abcarino.test", ADMIN_PASSWORD: "" };
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Record<string, unknown>[];

beforeAll(async () => {
  db = await resetTestDatabase();
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
});
afterAll(() => closeDb());

describe("deployment scripts", () => {
  it("first deploy: migrate + seed create the schema, starter catalogue and one admin", async () => {
    expect(run("migrate", deployEnv).code).toBe(0);
    const seed = run("seed", deployEnv);
    expect(seed.code).toBe(0);
    expect(seed.out).toContain("Generated password");
    const [c] = await rows(sql`select (select count(*)::int from solutions) s, (select count(*)::int from packages) p, (select count(*)::int from users) u`);
    expect(c.s).toBeGreaterThan(0);
    expect(c.p).toBeGreaterThan(0);
    expect(c.u).toBe(1);
  });

  it("redeploy never resurrects deleted content, never overwrites edits, never adds an admin", async () => {
    const [first] = await rows(sql`select id, slug from solutions order by sort_order limit 1`);
    const [second] = await rows(sql`select id, slug from solutions order by sort_order offset 1 limit 1`);
    await db.execute(sql`delete from package_solutions where solution_id = ${first.id}`);
    await db.execute(sql`delete from solutions where id = ${first.id}`);
    await db.execute(sql`update solutions set title_en = 'Edited by admin', status = 'hidden' where id = ${second.id}`);
    // The founder changes their sign-in email in the admin; ADMIN_EMAIL on the host still has the old one.
    await db.execute(sql`update users set email = 'new-address@abcarino.test'`);
    const [before] = await rows(sql`select count(*)::int n from solutions`);

    expect(run("migrate", deployEnv).code).toBe(0);
    const seed = run("seed", deployEnv);
    expect(seed.code).toBe(0);
    expect(seed.out).not.toContain("Generated password");

    expect(await rows(sql`select 1 from solutions where slug = ${first.slug}`)).toHaveLength(0);
    const [edited] = await rows(sql`select title_en, status from solutions where id = ${second.id}`);
    expect(edited).toEqual({ title_en: "Edited by admin", status: "hidden" });
    const [after] = await rows(sql`select count(*)::int n from solutions`);
    expect(after.n).toBe(before.n);
    const [u] = await rows(sql`select count(*)::int n from users`);
    expect(u.n).toBe(1);
  });

  it("migrations are idempotent (re-running applies nothing)", async () => {
    const [before] = await rows(sql`select count(*)::int n from drizzle.__drizzle_migrations`);
    expect(run("migrate", deployEnv).code).toBe(0);
    const [after] = await rows(sql`select count(*)::int n from drizzle.__drizzle_migrations`);
    expect(after.n).toBe(before.n);
  });

  it("fails clearly without DATABASE_URL", () => {
    const r = run("migrate", {});
    expect(r.code).not.toBe(0);
    expect(r.out).toContain("DATABASE_URL is not set");
  });

  it("never prints the password of a malformed or rejected DATABASE_URL", () => {
    // Typical: an unencoded "/" from `openssl rand -base64` in the password.
    const malformed = run("migrate", { DATABASE_URL: "postgres://abcarino:pa#ss/Leaky-Pw-1@localhost:5432/abcarino_test" });
    expect(malformed.code).not.toBe(0);
    expect(malformed.out).toContain("DATABASE_URL is not a valid connection URL");
    expect(malformed.out).not.toContain("Leaky-Pw-1");
    const wrongPassword = run("migrate", { DATABASE_URL: TEST_DATABASE_URL.replace(/:([^:@/]+)@/, ":Leaky-Pw-2@") });
    expect(wrongPassword.code).not.toBe(0);
    expect(wrongPassword.out).toMatch(/password authentication failed/);
    expect(wrongPassword.out).not.toContain("Leaky-Pw-2");
  });

  it("production deploys refuse a missing/weak APP_SECRET or missing APP_URL instead of half-working", () => {
    const prod = { DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: "production" };
    const noSecret = run("migrate", { ...prod, APP_URL: "https://abcarino.com" });
    expect(noSecret.code).not.toBe(0);
    expect(noSecret.out).toContain("APP_SECRET");
    const weak = run("migrate", { ...prod, APP_URL: "https://abcarino.com", APP_SECRET: "short-secret" });
    expect(weak.code).not.toBe(0);
    expect(weak.out).toContain("APP_SECRET must be at least 32 characters");
    expect(weak.out).not.toContain("short-secret");
    const noUrl = run("migrate", { ...prod, APP_SECRET: SECRET });
    expect(noUrl.code).not.toBe(0);
    expect(noUrl.out).toContain("APP_URL is not set");
    const badUrl = run("migrate", { ...prod, APP_SECRET: SECRET, APP_URL: "abcarino.com" });
    expect(badUrl.code).not.toBe(0);
    expect(badUrl.out).toContain("APP_URL");
    // Vercel: APP_URL may be omitted (the production domain is used) but a missing Blob store is flagged.
    const vercel = run("migrate", { ...prod, VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "abcarino.vercel.app", APP_SECRET: SECRET });
    expect(vercel.code).toBe(0);
    expect(vercel.out).toContain("no Vercel Blob store is connected");
    const vercelBlob = run("migrate", { ...prod, VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "abcarino.vercel.app", APP_SECRET: SECRET, BLOB_STORE_ID: "store_test123" });
    expect(vercelBlob.code).toBe(0);
    expect(vercelBlob.out).not.toContain("no Vercel Blob store");
    const ok = run("migrate", { ...prod, APP_SECRET: SECRET, APP_URL: "https://abcarino.com" });
    expect(ok.code).toBe(0);
    expect(ok.out).not.toContain(SECRET);
  });
});
