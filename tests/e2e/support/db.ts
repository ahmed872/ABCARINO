/** Direct access to the E2E database: create fixtures and assert real state. */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import postgres from "postgres";
import { e2eEnv } from "../../../playwright.config";

export const sql = postgres(e2eEnv.DATABASE_URL, { max: 2, onnotice: () => {} });

export type Role = "super_admin" | "content_manager" | "editor" | "sales" | "operations";

/** Create an active user with a live session (bypasses the login form on purpose). */
export async function userWithSession(role: Role, opts: { active?: boolean; expired?: boolean; idleHours?: number } = {}) {
  const email = `${role}-${randomUUID().slice(0, 8)}@abcarino.test`;
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, name, password_hash, role, is_active)
    values (${email}, ${`Test ${role}`}, 'disabled', ${role}, ${opts.active ?? true})
    returning id`;
  const token = randomBytes(32).toString("base64url");
  const expires = opts.expired ? new Date(Date.now() - 60_000) : new Date(Date.now() + 86_400_000);
  const lastSeen = new Date(Date.now() - (opts.idleHours ?? 0) * 3_600_000);
  await sql`insert into sessions (id, user_id, expires_at, last_seen_at)
            values (${createHash("sha256").update(token).digest("hex")}, ${user.id}, ${expires}, ${lastSeen})`;
  return { id: user.id, email, cookie: `abc_session=${token}` };
}

export const FORGED_COOKIE = "abc_session=forged-session-token";

let n = 0;
const uniq = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

export async function makeSolution(extra: Record<string, unknown> = {}) {
  const [r] = await sql<{ id: string; slug: string; sort_order: number }[]>`
    insert into solutions ${sql({ slug: uniq("sol"), title_en: "Probe", title_ar: "اختبار", status: "available", sort_order: 999999, ...extra })}
    returning id, slug, sort_order`;
  return r;
}
export async function makePackage() {
  const [r] = await sql<{ id: string }[]>`insert into packages ${sql({ slug: uniq("pkg"), name_en: "Probe", name_ar: "اختبار", status: "available" })} returning id`;
  return r;
}
export async function makeCategory() {
  const [r] = await sql<{ id: string }[]>`insert into categories ${sql({ slug: uniq("cat"), name_en: "Probe", name_ar: "اختبار", sort_order: 999999 })} returning id`;
  return r;
}
export async function makeProject() {
  const [r] = await sql<{ id: string }[]>`insert into projects ${sql({ slug: uniq("prj"), name_en: "Probe", name_ar: "اختبار", status: "hidden" })} returning id`;
  return r;
}
export async function makePartner() {
  const [r] = await sql<{ id: string }[]>`insert into partners ${sql({ name: uniq("Partner"), status: "hidden" })} returning id`;
  return r;
}
export async function makeArticle() {
  const [r] = await sql<{ id: string }[]>`insert into articles ${sql({ slug: uniq("art"), title_en: "Probe", status: "draft" })} returning id`;
  return r;
}
export async function makeLead(extra: Record<string, unknown> = {}) {
  const [r] = await sql<{ id: string }[]>`insert into leads ${sql({ name: "Probe Lead", phone: "+201000000000", ...extra })} returning id`;
  return r;
}
export async function makeMedia() {
  const key = `${randomUUID()}.webp`;
  const [r] = await sql<{ id: string }[]>`
    insert into media ${sql({ storage_key: key, url: `/media/${key}`, mime_type: "image/webp", size_bytes: 1, width: 1, height: 1 })}
    returning id`;
  return r;
}
export { uniq };
