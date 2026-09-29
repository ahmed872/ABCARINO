"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/admin/guard";
import { bool, int, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { moveRow, nextSortOrder } from "@/lib/admin/reorder";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { fieldErrors, partnerSchema } from "@/lib/validation/content";

export async function savePartner(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = partnerSchema.safeParse({
      name: str(fd, "name"),
      logoId: str(fd, "logoId"),
      descriptionEn: str(fd, "descriptionEn"),
      descriptionAr: str(fd, "descriptionAr"),
      websiteUrl: str(fd, "websiteUrl"),
      category: str(fd, "category"),
      relationship: str(fd, "relationship") || "partner",
      status: str(fd, "status") || "hidden",
      featured: bool(fd, "featured"),
      sortOrder: int(fd, "sortOrder"),
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    if (id) {
      await db.update(partners).set(v).where(eq(partners.id, id));
    } else {
      const [row] = await db
        .insert(partners)
        .values({ ...v, sortOrder: v.sortOrder || (await nextSortOrder(partners)) })
        .returning({ id: partners.id });
      createdId = row.id;
    }
    await audit({ userId: user.id, action: id ? "partner.update" : "partner.create", entityType: "partner", entityId: id ?? createdId, summary: `${id ? "Updated" : "Created"} partner “${v.name}” (${v.status})`, ip });
    revalidatePublicContent();
    revalidatePath("/admin/partners");
    return { ok: true, message: "Saved." };
  });
  if (createdId && result.ok) redirect(`/admin/partners/${createdId}?created=1`);
  return result;
}

export async function movePartner(id: string, dir: "up" | "down") {
  await requireUser("content.edit");
  await moveRow(partners, id, dir);
  revalidatePublicContent();
  revalidatePath("/admin/partners");
}

export async function setPartnerStatus(id: string, status: string) {
  const user = await requireUser("content.edit");
  if (status !== "published" && status !== "hidden") return;
  await db.update(partners).set({ status }).where(eq(partners.id, id));
  await audit({ userId: user.id, action: "partner.status", entityType: "partner", entityId: id, summary: `→ ${status}` });
  revalidatePublicContent();
  revalidatePath("/admin/partners");
}

export async function deletePartner(id: string) {
  const user = await requireUser("content.delete");
  const [row] = await db.delete(partners).where(eq(partners.id, id)).returning({ name: partners.name });
  await audit({ userId: user.id, action: "partner.delete", entityType: "partner", entityId: id, summary: `Deleted “${row?.name}”` });
  revalidatePublicContent();
  revalidatePath("/admin/partners");
  redirect("/admin/partners?deleted=1");
}
