"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/admin/guard";
import { str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { articleSchema, fieldErrors } from "@/lib/validation/content";

export async function saveArticle(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = await adminAction("content.edit", async ({ user, ip }) => {
    const parsed = articleSchema.safeParse({
      slug: str(fd, "slug"),
      categoryId: str(fd, "categoryId"),
      titleEn: str(fd, "titleEn"),
      titleAr: str(fd, "titleAr"),
      excerptEn: str(fd, "excerptEn"),
      excerptAr: str(fd, "excerptAr"),
      bodyEn: str(fd, "bodyEn"),
      bodyAr: str(fd, "bodyAr"),
      imageId: str(fd, "imageId"),
      status: str(fd, "status") || "draft",
      publishedAt: str(fd, "publishedAt"),
      seoTitleEn: str(fd, "seoTitleEn"),
      seoTitleAr: str(fd, "seoTitleAr"),
      seoDescriptionEn: str(fd, "seoDescriptionEn"),
      seoDescriptionAr: str(fd, "seoDescriptionAr"),
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    // Publishing without a date publishes now.
    const publishedAt = v.status === "published" && !v.publishedAt ? new Date() : v.publishedAt;
    if (id) {
      await db.update(articles).set({ ...v, publishedAt }).where(eq(articles.id, id));
    } else {
      const [row] = await db
        .insert(articles)
        .values({ ...v, publishedAt, authorId: user.id })
        .returning({ id: articles.id });
      createdId = row.id;
    }
    await audit({ userId: user.id, action: id ? "article.update" : "article.create", entityType: "article", entityId: id ?? createdId, summary: `${id ? "Updated" : "Created"} article “${v.titleEn || v.titleAr}” (${v.status})`, ip });
    revalidatePublicContent();
    revalidatePath("/admin/articles");
    return { ok: true, message: "Saved." };
  });
  if (createdId && result.ok) redirect(`/admin/articles/${createdId}?created=1`);
  return result;
}

export async function deleteArticle(id: string) {
  const user = await requireUser("content.delete");
  const [row] = await db.delete(articles).where(eq(articles.id, id)).returning({ titleEn: articles.titleEn });
  await audit({ userId: user.id, action: "article.delete", entityType: "article", entityId: id, summary: `Deleted “${row?.titleEn}”` });
  revalidatePublicContent();
  revalidatePath("/admin/articles");
  redirect("/admin/articles?deleted=1");
}
