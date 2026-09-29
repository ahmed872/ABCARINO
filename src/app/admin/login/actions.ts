"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clearFailures, failureLockRemaining, rateLimit, registerFailure } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/security/request";

export type LoginState = { error?: string };

const GENERIC = "Incorrect email or password.";
const MAX_FAILURES = 8;
/** Lockout / rate-limit window. Configurable only so automated tests can verify expiry quickly. */
const LOCK_MINUTES = Number(process.env.AUTH_LOCKOUT_MINUTES) > 0 ? Number(process.env.AUTH_LOCKOUT_MINUTES) : 15;
const WINDOW_MS = LOCK_MINUTES * 60 * 1000;

function tooManyAttempts(seconds: number): LoginState {
  // Same wording whether the account exists (locked) or not (rate limited): no account enumeration.
  return { error: `Too many attempts. Try again in ${Math.max(1, Math.ceil(seconds / 60))} minute(s).` };
}
// Used when the account doesn't exist so response timing doesn't reveal valid emails.
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!(formData instanceof FormData)) return { error: "Enter your email and password." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "Enter your email and password." };

  const ip = await getClientIp();
  const ipLimit = rateLimit("login-ip", ip, 20, WINDOW_MS);
  if (!ipLimit.ok) return tooManyAttempts(ipLimit.retryAfterSeconds);
  const lockedFor = failureLockRemaining(`login:${email}`);
  if (lockedFor > 0) return tooManyAttempts(lockedFor);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive) {
    registerFailure(`login:${email}`, MAX_FAILURES, WINDOW_MS);
    await audit({ action: "auth.login_failed", entityType: "user", summary: `Failed sign-in for ${email}`, ip });
    return { error: GENERIC };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ userId: user.id, action: "auth.login_locked", entityType: "user", entityId: user.id, summary: "Sign-in attempt on locked account", ip });
    return tooManyAttempts((user.lockedUntil.getTime() - Date.now()) / 1000);
  }
  if (!valid) {
    // In-memory lock (identical for unknown emails); mirrored to the DB so it survives restarts.
    const nowLocked = registerFailure(`login:${email}`, MAX_FAILURES, WINDOW_MS);
    await db
      .update(users)
      .set({
        failedLoginCount: user.failedLoginCount + 1,
        lockedUntil: nowLocked ? new Date(Date.now() + WINDOW_MS) : null,
      })
      .where(eq(users.id, user.id));
    await audit({ userId: user.id, action: "auth.login_failed", entityType: "user", entityId: user.id, summary: "Wrong password", ip });
    return { error: GENERIC };
  }

  await db
    .update(users)
    .set({
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      ...(needsRehash(user.passwordHash) ? { passwordHash: await hashPassword(password) } : {}),
    })
    .where(eq(users.id, user.id));
  clearFailures(`login:${email}`);
  await createSession(user.id, { ip, userAgent: await getUserAgent() });
  await audit({ userId: user.id, action: "auth.login", entityType: "user", entityId: user.id, summary: "Signed in", ip });
  redirect("/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  await destroyCurrentSession();
  if (user) await audit({ userId: user.id, action: "auth.logout", entityType: "user", entityId: user.id, summary: "Signed out" });
  redirect("/admin/login");
}
