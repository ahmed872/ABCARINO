import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { checkPasswordPolicy, generatePassword, hashPassword } from "../src/lib/auth/password";

/**
 * Create (or reset) a Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
 * If ADMIN_PASSWORD is empty a strong password is generated and printed once.
 */
export async function ensureSuperAdmin({ reset = false }: { reset?: boolean } = {}) {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = (process.env.ADMIN_NAME ?? "ABCARINO Admin").trim();
  if (!email || !email.includes("@")) {
    throw new Error("Set ADMIN_EMAIL in your environment before creating the admin account.");
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length && !reset) {
    console.log(`Admin ${email} already exists — leaving it unchanged (use "npm run admin:create -- --reset" to reset the password).`);
    return;
  }
  let password = process.env.ADMIN_PASSWORD ?? "";
  let generated = false;
  if (!password) {
    password = generatePassword(20);
    generated = true;
  } else {
    const check = checkPasswordPolicy(password, email);
    if (!check.ok) throw new Error(`ADMIN_PASSWORD rejected: ${check.reason}`);
  }
  const passwordHash = await hashPassword(password);
  if (existing.length) {
    await db
      .update(users)
      .set({ passwordHash, role: "super_admin", isActive: true, failedLoginCount: 0, lockedUntil: null, passwordChangedAt: new Date() })
      .where(eq(users.id, existing[0].id));
    console.log(`Reset password for super admin ${email}.`);
  } else {
    await db.insert(users).values({ email, name, passwordHash, role: "super_admin" });
    console.log(`Created super admin ${email}.`);
  }
  if (generated) {
    console.log("\n  ┌──────────────────────────────────────────────────────────");
    console.log(`  │ Generated password: ${password}`);
    console.log("  │ Store it in a password manager now — it will not be shown again.");
    console.log("  └──────────────────────────────────────────────────────────\n");
  }
}
