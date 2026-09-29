"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { rateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/security/request";

export type LoginState = { error?: string };

const GENERIC = "Incorrect email or password.";
const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;
// Used when the account doesn't exist so response timing doesn't reveal valid emails.
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "Enter your email and password." };

  const ip = await getClientIp();
  const ipLimit = rateLimit("login-ip", ip, 20, 15 * 60 * 1000);
  const emailLimit = rateLimit("login-email", email, 8, 15 * 60 * 1000);
  if (!ipLimit.ok || !emailLimit.ok) {
    const wait = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
    return { error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).` };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive) {
    await audit({ action: "auth.login_failed", entityType: "user", summary: `Failed sign-in for ${email}`, ip });
    return { error: GENERIC };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ userId: user.id, action: "auth.login_locked", entityType: "user", entityId: user.id, summary: "Sign-in attempt on locked account", ip });
    return { error: `This account is temporarily locked. Try again after ${LOCK_MINUTES} minutes.` };
  }
  if (!valid) {
    const failures = user.failedLoginCount + 1;
    await db
      .update(users)
      .set({
        failedLoginCount: failures,
        lockedUntil: failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
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
  resetRateLimit("login-email", email);
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
