import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Single shared Postgres pool. The connection is lazy: nothing connects until
 * the first query, so importing this module during `next build` is safe.
 */
const globalForDb = globalThis as unknown as { __abcarinoSql?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }
  // Transaction-mode poolers (PgBouncer, Supabase :6543, Neon "-pooler") don't support prepared statements.
  const pooled = /pgbouncer=true|:6543\/|-pooler\./.test(url) || process.env.DATABASE_PREPARE === "false";
  try {
    return connect(url, pooled);
  } catch (err) {
    // The driver's URL error carries the full string (password included) as `input`: never log it.
    if ((err as { code?: string }).code === "ERR_INVALID_URL") {
      throw new Error(
        "DATABASE_URL is not a valid connection URL (postgres://user:password@host:5432/db). Characters such as / # @ ? % in the password must be URL-encoded.",
      );
    }
    throw err;
  }
}

function connect(url: string, pooled: boolean) {
  return postgres(url, {
    // Serverless instances each hold their own pool: keep it small there.
    max: Number(process.env.DATABASE_POOL_SIZE ?? (process.env.VERCEL ? 3 : 10)),
    prepare: !pooled,
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},
  });
}

function getClient() {
  if (!globalForDb.__abcarinoSql) globalForDb.__abcarinoSql = createClient();
  return globalForDb.__abcarinoSql;
}

type Db = ReturnType<typeof drizzle<typeof schema>>;
let instance: Db | undefined;

function getDb(): Db {
  if (!instance) instance = drizzle(getClient(), { schema, casing: "snake_case" });
  return instance;
}

/** Proxy so `db` can be imported eagerly but only instantiated on first use. */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export async function closeDb() {
  if (globalForDb.__abcarinoSql) {
    await globalForDb.__abcarinoSql.end({ timeout: 5 });
    globalForDb.__abcarinoSql = undefined;
    instance = undefined;
  }
}

export { schema };
