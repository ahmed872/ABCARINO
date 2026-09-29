import { z } from "zod";
import { isHttpsProduction, siteUrl } from "./site-url";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_URL: z
    .url()
    .default("http://localhost:3000")
    .transform((v) => v.replace(/\/+$/, "")),
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),
  STORAGE_DIR: z.string().default("./storage"),
  // Vercel always sits behind its own proxy, which sets trustworthy forwarding headers.
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default(process.env.VERCEL ? "true" : "false")
    .transform((v) => v === "true"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Validated server environment. Parsed lazily so `next build` does not need secrets. */
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse({ ...process.env, APP_URL: appUrl() });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Base URL without requiring the full env (safe at build time). */
export function appUrl(): string {
  return siteUrl();
}

export function isSecureDeployment(): boolean {
  return isHttpsProduction();
}
