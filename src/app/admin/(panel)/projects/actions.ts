"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/admin/guard";
import { bool, int, list, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { moveRow, nextSortOrder } from "@/lib/admin/reorder";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { fieldErrors, projectSchema } from "@/lib/validation/content";

export async function saveProject(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = projectSchema.safeParse({
      slug: str(fd, "slug"),
      categoryId: str(fd, "categoryId"),
      nameEn: str(fd, "nameEn"),
      nameAr: str(fd, "nameAr"),
      locationEn: str(fd, "locationEn"),
      locationAr: str(fd, "locationAr"),
      descriptionEn: str(fd, "descriptionEn"),
      descriptionAr: str(fd, "descriptionAr"),
      imageId: str(fd, "imageId"),
      gallery: list(fd, "gallery"),
      videoUrl: str(fd, "videoUrl"),
      servicesUsed: list(fd, "servicesUsed"),
      completedAt: str(fd, "completedAt"),
      status: str(fd, "status") || "hidden",
      featured: bool(fd, "featured"),
      sortOrder: int(fd, "sortOrder"),
      seoTitleEn: str(fd, "seoTitleEn"),
      seoTitleAr: str(fd, "seoTitleAr"),
      seoDescriptionEn: str(fd, "seoDescriptionEn"),
      seoDescriptionAr: str(fd, "seoDescriptionAr"),
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    if (id) {
      await db.update(projects).set(v).where(eq(projects.id, id));
    } else {
      const [row] = await db
        .insert(projects)
        .values({ ...v, sortOrder: v.sortOrder || (await nextSortOrder(projects)) })
        .returning({ id: projects.id });
      createdId = row.id;
    }
    await audit({ userId: user.id, action: id ? "project.update" : "project.create", entityType: "project", entityId: id ?? createdId, summary: `${id ? "Updated" : "Created"} project “${v.nameEn}” (${v.status})`, ip });
    revalidatePublicContent();
    revalidatePath("/admin/projects");
    return { ok: true, message: "Saved." };
  });
  if (createdId && result.ok) redirect(`/admin/projects/${createdId}?created=1`);
  return result;
}

export async function moveProject(id: string, dir: "up" | "down") {
  await requireUser("content.edit");
  await moveRow(projects, id, dir);
  revalidatePublicContent();
  revalidatePath("/admin/projects");
}

export async function setProjectStatus(id: string, status: string) {
  const user = await requireUser("content.edit");
  if (status !== "published" && status !== "hidden") return;
  await db.update(projects).set({ status }).where(eq(projects.id, id));
  await audit({ userId: user.id, action: "project.status", entityType: "project", entityId: id, summary: `→ ${status}` });
  revalidatePublicContent();
  revalidatePath("/admin/projects");
}

export async function deleteProject(id: string) {
  const user = await requireUser("content.delete");
  const [row] = await db.delete(projects).where(eq(projects.id, id)).returning({ nameEn: projects.nameEn });
  await audit({ userId: user.id, action: "project.delete", entityType: "project", entityId: id, summary: `Deleted “${row?.nameEn}”` });
  revalidatePublicContent();
  revalidatePath("/admin/projects");
  redirect("/admin/projects?deleted=1");
}
