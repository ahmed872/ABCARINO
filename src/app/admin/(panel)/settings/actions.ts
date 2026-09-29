"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { adminAction } from "@/lib/admin/guard";
import { bool, str } from "@/lib/admin/form-data";
import type { FormState } from "@/lib/admin/form-state";
import { audit } from "@/lib/audit";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { groupSchemas, SETTINGS_GROUPS, type SettingsGroup } from "@/lib/settings-schema";
import { normalizePhoneForWhatsApp } from "@/lib/utils";
import { fieldErrors } from "@/lib/validation/content";

function isBoolean(schema: z.ZodType): boolean {
  let def = (schema as unknown as { _zod: { def: { type: string; innerType?: z.ZodType } } })._zod.def;
  while (def.type === "default" && def.innerType) def = (def.innerType as unknown as { _zod: { def: typeof def } })._zod.def;
  return def.type === "boolean";
}

export async function saveSettings(group: SettingsGroup, _prev: FormState, fd: FormData): Promise<FormState> {
  return adminAction("settings.manage", async ({ user, ip }) => {
    if (!SETTINGS_GROUPS.includes(group)) return { ok: false, message: "Unknown settings group." };
    const schema = groupSchemas[group];
    const raw: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(schema.unwrap().shape as Record<string, z.ZodType>)) {
      raw[key] = isBoolean(field) ? bool(fd, key) : str(fd, key);
    }
    if (group === "contact" && typeof raw.whatsappNumber === "string" && raw.whatsappNumber.trim()) {
      const normalized = normalizePhoneForWhatsApp(raw.whatsappNumber);
      if (!normalized) return { ok: false, errors: { whatsappNumber: "Use the full international number, e.g. +20 100 000 0000" } };
      raw.whatsappNumber = `+${normalized}`;
    }
    for (const urlKey of ["instagram", "facebook", "linkedin", "x", "tiktok", "youtube", "behance", "mapUrl"]) {
      const v = raw[urlKey];
      if (typeof v === "string" && v && !/^https:\/\/[^\s]+$/.test(v)) return { ok: false, errors: { [urlKey]: "Use a full https:// link" } };
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    await db
      .insert(settings)
      .values({ key: group, value: parsed.data, updatedById: user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data, updatedById: user.id, updatedAt: new Date() } });
    await audit({ userId: user.id, action: "settings.update", entityType: "settings", entityId: group, summary: `Updated ${group} settings`, ip });
    revalidatePublicContent();
    revalidatePath("/admin/settings");
    return { ok: true, message: "Saved. The website has been updated." };
  });
}
