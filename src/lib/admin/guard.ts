import "server-only";
import { unstable_rethrow } from "next/navigation";
import { AuthorizationError, requireUser, type SessionUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { getClientIp } from "@/lib/security/request";
import type { FormState } from "./form-state";

export type ActionContext = { user: SessionUser; ip: string };

/**
 * Wraps every admin mutation: authenticates, authorizes, and converts failures
 * into form-friendly messages without leaking internals. Next.js control-flow
 * errors (redirect/notFound) are re-thrown.
 */
export async function adminAction(
  permission: Permission,
  fn: (ctx: ActionContext) => Promise<FormState>,
): Promise<FormState> {
  try {
    const user = await requireUser(permission);
    const ip = await getClientIp();
    return await fn({ user, ip });
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof AuthorizationError) return { ok: false, message: err.message };
    if (isUniqueViolation(err)) return { ok: false, errors: { slug: "This slug is already in use." }, message: "Please fix the highlighted fields." };
    console.error("[admin action]", describeError(err));
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server actions receive ids from the client: validate before touching the database. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/**
 * Log-safe error summary: database errors carry the SQL *and bound parameters*
 * (which may include password hashes or personal data), so only the error
 * class, database code and message are logged.
 */
export function describeError(err: unknown): string {
  const e = err as { name?: string; message?: string; code?: string; cause?: { code?: string; message?: string } } | null;
  if (e?.cause?.code || e?.code) {
    return `${e?.name ?? "Error"}: database error ${e?.cause?.code ?? e?.code} (${(e?.cause?.message ?? "").slice(0, 200)})`;
  }
  return `${e?.name ?? "Error"}: ${(e?.message ?? String(err)).split("\n")[0].slice(0, 300)}`;
}
