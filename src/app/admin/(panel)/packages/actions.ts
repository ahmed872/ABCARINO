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
import { packageSolutions, packages } from "@/lib/db/schema";
import { fieldErrors, offeringStatusSchema, packageSchema } from "@/lib/validation/content";

function readForm(fd: FormData) {
  return {
    slug: str(fd, "slug"),
    categoryId: str(fd, "categoryId"),
    nameEn: str(fd, "nameEn"),
    nameAr: str(fd, "nameAr"),
    taglineEn: str(fd, "taglineEn"),
    taglineAr: str(fd, "taglineAr"),
    descriptionEn: str(fd, "descriptionEn"),
    descriptionAr: str(fd, "descriptionAr"),
    includedFeatures: json(fd, "includedFeatures", []),
    optionalFeatures: json(fd, "optionalFeatures", []),
    imageId: str(fd, "imageId"),
    gallery: list(fd, "gallery"),
    visualKey: str(fd, "visualKey") || "living",
    pricingMode: str(fd, "pricingMode"),
    price: str(fd, "price"),
    currency: str(fd, "currency") || "EGP",
    priceNoteEn: str(fd, "priceNoteEn"),
    priceNoteAr: str(fd, "priceNoteAr"),
    status: str(fd, "status"),
    featured: bool(fd, "featured"),
    sortOrder: int(fd, "sortOrder"),
    ctaLabelEn: str(fd, "ctaLabelEn"),
    ctaLabelAr: str(fd, "ctaLabelAr"),
    solutionIds: list(fd, "solutionIds"),
    seoTitleEn: str(fd, "seoTitleEn"),
    seoTitleAr: str(fd, "seoTitleAr"),
    seoDescriptionEn: str(fd, "seoDescriptionEn"),
    seoDescriptionAr: str(fd, "seoDescriptionAr"),
  };
}

export async function savePackage(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = packageSchema.safeParse(readForm(fd));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const { solutionIds, ...values } = parsed.data;
    await db.transaction(async (tx) => {
      let packageId = id;
      if (packageId) {
        await tx.update(packages).set(values).where(eq(packages.id, packageId));
      } else {
        const [row] = await tx
          .insert(packages)
          .values({ ...values, sortOrder: values.sortOrder || (await nextSortOrder(packages)) })
          .returning({ id: packages.id });
        packageId = row.id;
        createdId = row.id;
      }
      await tx.delete(packageSolutions).where(eq(packageSolutions.packageId, packageId));
      if (solutionIds.length) await tx.insert(packageSolutions).values(solutionIds.map((solutionId) => ({ packageId: packageId!, solutionId })));
    });
    await audit({
      userId: user.id,
      action: id ? "package.update" : "package.create",
      entityType: "package",
      entityId: id ?? createdId,
      summary: `${id ? "Updated" : "Created"} package “${values.nameEn}” (${values.status}, ${values.pricingMode})`,
      ip,
    });
    revalidatePublicContent();
    revalidatePath("/admin/packages");
    return { ok: true, message: "Saved. Changes are live on the website." };
  });
  if (createdId && result.ok) redirect(`/admin/packages/${createdId}?created=1`);
  return result;
}

export async function movePackage(id: string, dir: "up" | "down") {
  const user = await requireUser("content.edit");
  if (!isUuid(id)) return;
  await moveRow(packages, id, dir);
  await audit({ userId: user.id, action: "package.reorder", entityType: "package", entityId: id, summary: `Moved ${dir}` });
  revalidatePublicContent();
  revalidatePath("/admin/packages");
}

export async function setPackageStatus(id: string, status: string) {
  const user = await requireUser("content.edit");
  if (!isUuid(id)) return;
  const parsed = offeringStatusSchema.safeParse(status);
  if (!parsed.success) return;
  const [row] = await db.update(packages).set({ status: parsed.data }).where(eq(packages.id, id)).returning({ nameEn: packages.nameEn });
  await audit({ userId: user.id, action: "package.status", entityType: "package", entityId: id, summary: `“${row?.nameEn}” → ${parsed.data}` });
  revalidatePublicContent();
  revalidatePath("/admin/packages");
}

export async function deletePackage(id: string) {
  const user = await requireUser("content.delete");
  if (!isUuid(id)) return;
  const [row] = await db.delete(packages).where(eq(packages.id, id)).returning({ nameEn: packages.nameEn });
  await audit({ userId: user.id, action: "package.delete", entityType: "package", entityId: id, summary: `Deleted “${row?.nameEn}”` });
  revalidatePublicContent();
  revalidatePath("/admin/packages");
  redirect("/admin/packages?deleted=1");
}
