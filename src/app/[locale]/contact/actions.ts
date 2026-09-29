"use server";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent, hashIp } from "@/lib/security/request";
import { leadInputSchema } from "@/lib/validation/lead";

export type ContactState = {
  status: "idle" | "success" | "error";
  error?: "generic" | "rate";
  fields?: Partial<Record<"name" | "phone" | "email" | "message" | "contact", true>>;
};

export async function submitLead(_prev: ContactState, formData: FormData): Promise<ContactState> {
  if (!(formData instanceof FormData)) return { status: "error", error: "generic" };
  // Honeypot + minimum fill time: silently accept bots without storing anything.
  if (String(formData.get("company_website") ?? "") !== "") return { status: "success" };
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (startedAt && Date.now() - startedAt < 2500) return { status: "success" };

  const ip = await getClientIp();
  const limit = rateLimit("lead", ip, 5, 10 * 60 * 1000);
  if (!limit.ok) return { status: "error", error: "rate" };

  const parsed = leadInputSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    projectType: formData.get("projectType") ?? "",
    message: formData.get("message") ?? "",
    preferredContact: formData.get("preferredContact") ?? "whatsapp",
    locale: formData.get("locale") ?? "en",
    sourcePath: formData.get("sourcePath") ?? "",
  });
  if (!parsed.success) {
    const fields: ContactState["fields"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.message as keyof NonNullable<ContactState["fields"]>;
      if (["name", "phone", "email", "message", "contact"].includes(key)) fields[key] = true;
    }
    // A failure on a field the visitor can't see (tampered request) still gets a visible message.
    return Object.keys(fields).length ? { status: "error", fields } : { status: "error", error: "generic" };
  }

  try {
    await db.insert(leads).values({
      ...parsed.data,
      ipHash: hashIp(ip),
      userAgent: await getUserAgent(),
    });
  } catch (err) {
    console.error("[lead] insert failed", err);
    return { status: "error", error: "generic" };
  }
  return { status: "success" };
}
