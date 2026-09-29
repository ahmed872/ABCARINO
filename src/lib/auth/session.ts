import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type User } from "@/lib/db/schema";
import { isSecureDeployment } from "@/lib/env";
import { can, type Permission } from "./permissions";
import { SESSION_IDLE_MS, SESSION_TTL_MS, sessionCookieName } from "./cookie";

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    ip: meta.ip ?? null,
    userAgent: meta.userAgent ?? null,
  });
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: isSecureDeployment(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/** Resolves the signed-in admin for this request (deduplicated per render). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token || token.length > 100) return null;
  const id = hashToken(token);
  const now = new Date();
  const rows = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isActive) return null;
  if (now.getTime() - row.lastSeenAt.getTime() > SESSION_IDLE_MS) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  // Touch at most every 5 minutes to avoid a write per request.
  if (now.getTime() - row.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, id));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(sessionCookieName());
}

export async function destroyUserSessions(userId: string, exceptCurrent = false) {
  if (!exceptCurrent) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return;
  }
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  const all = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const keep = token ? hashToken(token) : "";
  for (const s of all) if (s.id !== keep) await db.delete(sessions).where(eq(sessions.id, s.id));
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** For pages: redirect to login when signed out, to the dashboard when unauthorized. */
export async function requirePageUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

/** For server actions / route handlers: throw instead of redirecting. */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Your session has expired. Please sign in again.");
  if (permission && !can(user.role, permission)) throw new AuthorizationError();
  return user;
}
