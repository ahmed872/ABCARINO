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
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
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
