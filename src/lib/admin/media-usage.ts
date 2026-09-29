import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, packages, partners, projects, settings, solutions } from "@/lib/db/schema";

// Kept out of the "use server" actions file on purpose: every export of such a
// file becomes a publicly callable endpoint. Only reachable via deleteMedia.
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

