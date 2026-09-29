"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/admin/guard";
import { bool, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyUserSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { fieldErrors, userCreateSchema, userUpdateSchema } from "@/lib/validation/content";

async function activeSuperAdminsExcluding(id: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true), ne(users.id, id)));
  return n;
}

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("users.manage", async ({ user, ip }) => {
    const parsed = userCreateSchema.safeParse({ email: str(fd, "email"), name: str(fd, "name"), role: str(fd, "role"), password: str(fd, "password") });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const policy = checkPasswordPolicy(parsed.data.password, parsed.data.email);
    if (!policy.ok) return { ok: false, errors: { password: policy.reason } };
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (exists.length) return { ok: false, errors: { email: "A user with this email already exists." } };
    const [row] = await db
      .insert(users)
      .values({ email: parsed.data.email, name: parsed.data.name, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password), passwordChangedAt: new Date() })
      .returning({ id: users.id });
    createdId = row.id;
    await audit({ userId: user.id, action: "user.create", entityType: "user", entityId: row.id, summary: `Created ${parsed.data.email} (${parsed.data.role})`, ip });
    revalidatePath("/admin/users");
    return { ok: true };
  });
  if (createdId && result.ok) redirect(`/admin/users/${createdId}?created=1`);
  return result;
}

export async function updateUser(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction("users.manage", async ({ user, ip }) => {
    const parsed = userUpdateSchema.safeParse({ name: str(fd, "name"), role: str(fd, "role"), isActive: bool(fd, "isActive") });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const losingSuper = v.role !== "super_admin" || !v.isActive;
    if (losingSuper) {
      const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
      if (target?.role === "super_admin" && (await activeSuperAdminsExcluding(id)) === 0) {
        return { ok: false, message: "At least one active Super Admin must remain." };
      }
    }
    if (id === user.id && !v.isActive) return { ok: false, message: "You cannot deactivate your own account." };
    await db.update(users).set(v).where(eq(users.id, id));
    if (!v.isActive) await destroyUserSessions(id);
    const newPassword = str(fd, "newPassword");
    if (newPassword) {
      const [target] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
      const policy = checkPasswordPolicy(newPassword, target?.email);
      if (!policy.ok) return { ok: false, errors: { newPassword: policy.reason } };
      await db.update(users).set({ passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, id));
      await destroyUserSessions(id, id === user.id);
    }
    await audit({ userId: user.id, action: "user.update", entityType: "user", entityId: id, summary: `Updated user (${v.role}${v.isActive ? "" : ", deactivated"}${newPassword ? ", password reset" : ""})`, ip });
    revalidatePath("/admin/users");
    return { ok: true, message: "Saved." };
  });
}

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction("dashboard.view", async ({ user, ip }): Promise<FormState> => {
    const current = str(fd, "current");
    const next = str(fd, "next");
    const confirm = str(fd, "confirm");
    const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(current, row.hash))) return { ok: false, errors: { current: "Current password is incorrect." } };
    if (next !== confirm) return { ok: false, errors: { confirm: "Passwords do not match." } };
    const policy = checkPasswordPolicy(next, user.email);
    if (!policy.ok) return { ok: false, errors: { next: policy.reason } };
    await db.update(users).set({ passwordHash: await hashPassword(next), passwordChangedAt: new Date() }).where(eq(users.id, user.id));
    await destroyUserSessions(user.id, true);
    await audit({ userId: user.id, action: "user.password", entityType: "user", entityId: user.id, summary: "Changed own password (other sessions signed out)", ip });
    return { ok: true, message: "Password changed. Other devices have been signed out." };
  });
}
