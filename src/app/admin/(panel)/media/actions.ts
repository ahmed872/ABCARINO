"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/guard";
import { bool, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { articles, media, packages, partners, projects, settings, solutions } from "@/lib/db/schema";
import { deleteStoredFile } from "@/lib/storage";

export async function updateMedia(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction("media.manage", async ({ user, ip }) => {
    await db
      .update(media)
      .set({
        altEn: str(fd, "altEn").trim().slice(0, 200),
        altAr: str(fd, "altAr").trim().slice(0, 200),
        isInspiration: bool(fd, "isInspiration"),
      })
      .where(eq(media.id, id));
    await audit({ userId: user.id, action: "media.update", entityType: "media", entityId: id, summary: "Updated alt text / flags", ip });
    revalidatePublicContent();
    revalidatePath("/admin/media");
    return { ok: true, message: "Saved." };
  });
}

/** Where is a media item referenced? Prevents deleting images still in use. */
export async function mediaUsage(id: string): Promise<string[]> {
  const uses: string[] = [];
  const inGallery = (col: unknown) => sql`${col} @> ${JSON.stringify([id])}::jsonb`;
  const [s, p, pr, pa, a, st] = await Promise.all([
    db.select({ n: solutions.titleEn }).from(solutions).where(sql`${solutions.imageId} = ${id} OR ${inGallery(solutions.gallery)}`),
    db.select({ n: packages.nameEn }).from(packages).where(sql`${packages.imageId} = ${id} OR ${inGallery(packages.gallery)}`),
    db.select({ n: projects.nameEn }).from(projects).where(sql`${projects.imageId} = ${id} OR ${inGallery(projects.gallery)}`),
    db.select({ n: partners.name }).from(partners).where(eq(partners.logoId, id)),
    db.select({ n: articles.titleEn }).from(articles).where(eq(articles.imageId, id)),
    db.select({ n: settings.key }).from(settings).where(sql`${settings.value}::text LIKE ${"%" + id + "%"}`),
  ]);
  s.forEach((r) => uses.push(`Solution: ${r.n}`));
  p.forEach((r) => uses.push(`Package: ${r.n}`));
  pr.forEach((r) => uses.push(`Project: ${r.n}`));
  pa.forEach((r) => uses.push(`Partner: ${r.n}`));
  a.forEach((r) => uses.push(`Article: ${r.n}`));
  st.forEach((r) => uses.push(`Settings: ${r.n}`));
  return uses;
}

export async function deleteMedia(id: string): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser("media.manage");
  const uses = await mediaUsage(id);
  if (uses.length) return { ok: false, message: `This image is still used by: ${uses.join(", ")}. Remove it there first.` };
  const [row] = await db.delete(media).where(eq(media.id, id)).returning({ storageKey: media.storageKey, originalName: media.originalName });
  if (row) await deleteStoredFile(row.storageKey);
  await audit({ userId: user.id, action: "media.delete", entityType: "media", entityId: id, summary: `Deleted ${row?.originalName ?? id}` });
  revalidatePublicContent();
  revalidatePath("/admin/media");
  return { ok: true };
}
