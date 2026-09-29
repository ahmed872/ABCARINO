import "server-only";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, media } from "@/lib/db/schema";

export type MediaSummary = { id: string; url: string; width: number; height: number; altEn: string };

/** Resolve media ids to picker-friendly summaries, preserving the given order. */
export async function mediaSummaries(ids: Array<string | null | undefined>): Promise<Map<string, MediaSummary>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map();
  const rows = await db
    .select({ id: media.id, url: media.url, width: media.width, height: media.height, altEn: media.altEn })
    .from(media)
    .where(inArray(media.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function categoryOptions(scope: "solution" | "article") {
  const rows = await db
    .select({ id: categories.id, nameEn: categories.nameEn, scope: categories.scope })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.nameEn));
  return [{ value: "", label: "— No category —" }, ...rows.filter((r) => r.scope === scope).map((r) => ({ value: r.id, label: r.nameEn }))];
}
