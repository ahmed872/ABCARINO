"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminAction, isUuid } from "@/lib/admin/guard";
import { bool, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { mediaUsage } from "@/lib/admin/media-usage";
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

export async function deleteMedia(id: string): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser("media.manage");
  if (!isUuid(id)) return { ok: false, message: "Invalid id." };
  const uses = await mediaUsage(id);
  if (uses.length) return { ok: false, message: `This image is still used by: ${uses.join(", ")}. Remove it there first.` };
  const [row] = await db.delete(media).where(eq(media.id, id)).returning({ storageKey: media.storageKey, url: media.url, originalName: media.originalName });
  if (row) await deleteStoredFile(row.storageKey, row.url);
  await audit({ userId: user.id, action: "media.delete", entityType: "media", entityId: id, summary: `Deleted ${row?.originalName ?? id}` });
  revalidatePublicContent();
  revalidatePath("/admin/media");
  return { ok: true };
}
