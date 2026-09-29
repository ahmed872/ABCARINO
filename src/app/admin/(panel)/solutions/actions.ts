"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction, isUuid } from "@/lib/admin/guard";
import { bool, int, json, list, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { moveRow, nextSortOrder } from "@/lib/admin/reorder";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { packageSolutions, solutions } from "@/lib/db/schema";
import { fieldErrors, offeringStatusSchema, solutionSchema } from "@/lib/validation/content";

function readForm(fd: FormData) {
  return {
    slug: str(fd, "slug"),
    categoryId: str(fd, "categoryId"),
    titleEn: str(fd, "titleEn"),
    titleAr: str(fd, "titleAr"),
    summaryEn: str(fd, "summaryEn"),
    summaryAr: str(fd, "summaryAr"),
    descriptionEn: str(fd, "descriptionEn"),
    descriptionAr: str(fd, "descriptionAr"),
    benefits: json(fd, "benefits", []),
    features: json(fd, "features", []),
    imageId: str(fd, "imageId"),
    gallery: list(fd, "gallery"),
    visualKey: str(fd, "visualKey") || "living",
    status: str(fd, "status"),
    featured: bool(fd, "featured"),
    sortOrder: int(fd, "sortOrder"),
    ctaLabelEn: str(fd, "ctaLabelEn"),
    ctaLabelAr: str(fd, "ctaLabelAr"),
    packageIds: list(fd, "packageIds"),
    seoTitleEn: str(fd, "seoTitleEn"),
    seoTitleAr: str(fd, "seoTitleAr"),
    seoDescriptionEn: str(fd, "seoDescriptionEn"),
    seoDescriptionAr: str(fd, "seoDescriptionAr"),
  };
}

export async function saveSolution(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = solutionSchema.safeParse(readForm(fd));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const { packageIds, ...values } = parsed.data;
    await db.transaction(async (tx) => {
      let solutionId = id;
      if (solutionId) {
        await tx.update(solutions).set(values).where(eq(solutions.id, solutionId));
      } else {
        const [row] = await tx
          .insert(solutions)
          .values({ ...values, sortOrder: values.sortOrder || (await nextSortOrder(solutions)) })
          .returning({ id: solutions.id });
        solutionId = row.id;
        createdId = row.id;
      }
      await tx.delete(packageSolutions).where(eq(packageSolutions.solutionId, solutionId));
      if (packageIds.length) await tx.insert(packageSolutions).values(packageIds.map((packageId) => ({ packageId, solutionId: solutionId! })));
    });
    await audit({
      userId: user.id,
      action: id ? "solution.update" : "solution.create",
      entityType: "solution",
      entityId: id ?? createdId,
      summary: `${id ? "Updated" : "Created"} solution “${values.titleEn}” (${values.status})`,
      ip,
    });
    revalidatePublicContent();
    revalidatePath("/admin/solutions");
    return { ok: true, message: "Saved. Changes are live on the website." };
  });
  if (createdId && result.ok) redirect(`/admin/solutions/${createdId}?created=1`);
  return result;
}

export async function moveSolution(id: string, dir: "up" | "down") {
  const user = await requireUser("content.edit");
  if (!isUuid(id)) return;
  await moveRow(solutions, id, dir);
  await audit({ userId: user.id, action: "solution.reorder", entityType: "solution", entityId: id, summary: `Moved ${dir}` });
  revalidatePublicContent();
  revalidatePath("/admin/solutions");
}

export async function setSolutionStatus(id: string, status: string) {
  const user = await requireUser("content.edit");
  if (!isUuid(id)) return;
  const parsed = offeringStatusSchema.safeParse(status);
  if (!parsed.success) return;
  const [row] = await db.update(solutions).set({ status: parsed.data }).where(eq(solutions.id, id)).returning({ titleEn: solutions.titleEn });
  await audit({ userId: user.id, action: "solution.status", entityType: "solution", entityId: id, summary: `“${row?.titleEn}” → ${parsed.data}` });
  revalidatePublicContent();
  revalidatePath("/admin/solutions");
}

export async function deleteSolution(id: string) {
  const user = await requireUser("content.delete");
  if (!isUuid(id)) return;
  const [row] = await db.delete(solutions).where(eq(solutions.id, id)).returning({ titleEn: solutions.titleEn });
  await audit({ userId: user.id, action: "solution.delete", entityType: "solution", entityId: id, summary: `Deleted “${row?.titleEn}”` });
  revalidatePublicContent();
  revalidatePath("/admin/solutions");
  redirect("/admin/solutions?deleted=1");
}
