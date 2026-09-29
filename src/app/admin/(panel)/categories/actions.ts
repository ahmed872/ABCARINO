"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction, isUuid } from "@/lib/admin/guard";
import { bool, int, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { moveRow, nextSortOrder } from "@/lib/admin/reorder";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categorySchema, fieldErrors } from "@/lib/validation/content";

export async function saveCategory(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = categorySchema.safeParse({
      scope: str(fd, "scope") || "solution",
      slug: str(fd, "slug"),
      nameEn: str(fd, "nameEn"),
      nameAr: str(fd, "nameAr"),
      descriptionEn: str(fd, "descriptionEn"),
      descriptionAr: str(fd, "descriptionAr"),
      visualKey: str(fd, "visualKey") || "living",
      sortOrder: int(fd, "sortOrder"),
      isVisible: bool(fd, "isVisible"),
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const clash = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.scope, v.scope), eq(categories.slug, v.slug)))
      .limit(1);
    if (clash.length && clash[0].id !== id) return { ok: false, errors: { slug: "This slug is already in use." } };
    if (id) {
      await db.update(categories).set(v).where(eq(categories.id, id));
    } else {
      const [row] = await db
        .insert(categories)
        .values({ ...v, sortOrder: v.sortOrder || (await nextSortOrder(categories)) })
        .returning({ id: categories.id });
      createdId = row.id;
    }
    await audit({ userId: user.id, action: id ? "category.update" : "category.create", entityType: "category", entityId: id ?? createdId, summary: `${id ? "Updated" : "Created"} category “${v.nameEn}”`, ip });
    revalidatePublicContent();
    revalidatePath("/admin/categories");
    return { ok: true, message: "Saved." };
  });
  if (createdId && result.ok) redirect(`/admin/categories/${createdId}?created=1`);
  return result;
}

export async function moveCategory(id: string, dir: "up" | "down") {
  const user = await requireUser("content.edit");
  if (!isUuid(id)) return;
  const [row] = await db.select({ scope: categories.scope }).from(categories).where(eq(categories.id, id)).limit(1);
  if (!row) return;
  await moveRow(categories, id, dir, eq(categories.scope, row.scope));
  await audit({ userId: user.id, action: "category.reorder", entityType: "category", entityId: id, summary: `Moved ${dir}` });
  revalidatePublicContent();
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  const user = await requireUser("content.delete");
  if (!isUuid(id)) return;
  const [row] = await db.delete(categories).where(eq(categories.id, id)).returning({ nameEn: categories.nameEn });
  await audit({ userId: user.id, action: "category.delete", entityType: "category", entityId: id, summary: `Deleted “${row?.nameEn}” (items keep existing without a category)` });
  revalidatePublicContent();
  revalidatePath("/admin/categories");
  redirect("/admin/categories?deleted=1");
}
