import "server-only";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export type AuditInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
};

/** Append-only activity trail. Never throws: auditing must not break the action. */
export async function audit(input: AuditInput) {
  try {
    await db.insert(auditLog).values({
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: (input.summary ?? "").slice(0, 500),
      meta: input.meta ?? null,
      ip: input.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write entry", err);
  }
}
