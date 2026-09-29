/**
 * Server-side authorization matrix.
 *
 * Every admin server action is invoked DIRECTLY over HTTP (no UI, no hidden
 * buttons) by every role, by an anonymous caller holding a forged cookie, by a
 * deactivated user and by an expired session. Each call targets a freshly
 * created object whose id the caller "knows" (IDOR), and the assertion is made
 * against the database: the effect must happen if and only if the role's
 * permission allows it.
 */
import { expect, test } from "@playwright/test";
import { can, type Permission } from "../../src/lib/auth/permissions";
import { actionManifest, callAction, form } from "./support/server-actions";
import {
  FORGED_COOKIE,
  makeArticle,
  makeCategory,
  makeLead,
  makeMedia,
  makePackage,
  makePartner,
  makeProject,
  makeSolution,
  sql,
  uniq,
  userWithSession,
  type Role,
} from "./support/db";

type Probe = {
  action: string;
  permission: Permission;
  run: (cookie: string) => Promise<boolean>; // returns true if the effect happened
};

const solutionForm = (title: string) =>
  form({ slug: uniq("s"), titleEn: title, titleAr: "عنوان", status: "hidden", visualKey: "living", sortOrder: "1", benefits: "[]", features: "[]" });

const probes: Probe[] = [
  // ── Solutions
  { action: "setSolutionStatus", permission: "content.edit", run: async (c) => { const s = await makeSolution(); await callAction("setSolutionStatus", [s.id, "hidden"], { cookie: c }); return (await sql`select status from solutions where id=${s.id}`)[0].status === "hidden"; } },
  { action: "moveSolution", permission: "content.edit", run: async (c) => { const s = await makeSolution(); await callAction("moveSolution", [s.id, "up"], { cookie: c }); return (await sql`select sort_order from solutions where id=${s.id}`)[0].sort_order !== 999999; } },
  { action: "deleteSolution", permission: "content.delete", run: async (c) => { const s = await makeSolution(); await callAction("deleteSolution", [s.id], { cookie: c }); return (await sql`select 1 from solutions where id=${s.id}`).length === 0; } },
  { action: "saveSolution", permission: "content.edit", run: async (c) => { const s = await makeSolution(); await callAction("saveSolution", [s.id, { ok: false }, solutionForm("Hijacked")], { cookie: c }); return (await sql`select title_en from solutions where id=${s.id}`)[0].title_en === "Hijacked"; } },
  { action: "saveSolution(create)", permission: "content.edit", run: async (c) => { const t = uniq("Created"); await callAction("saveSolution", [null, { ok: false }, solutionForm(t)], { cookie: c }); return (await sql`select 1 from solutions where title_en=${t}`).length === 1; } },
  // ── Packages
  { action: "setPackageStatus", permission: "content.edit", run: async (c) => { const p = await makePackage(); await callAction("setPackageStatus", [p.id, "hidden"], { cookie: c }); return (await sql`select status from packages where id=${p.id}`)[0].status === "hidden"; } },
  { action: "movePackage", permission: "content.edit", run: async (c) => { const p = await makePackage(); await sql`update packages set sort_order=999999 where id=${p.id}`; await callAction("movePackage", [p.id, "up"], { cookie: c }); return (await sql`select sort_order from packages where id=${p.id}`)[0].sort_order !== 999999; } },
  { action: "deletePackage", permission: "content.delete", run: async (c) => { const p = await makePackage(); await callAction("deletePackage", [p.id], { cookie: c }); return (await sql`select 1 from packages where id=${p.id}`).length === 0; } },
  { action: "savePackage", permission: "content.edit", run: async (c) => { const p = await makePackage(); await callAction("savePackage", [p.id, { ok: false }, form({ slug: uniq("p"), nameEn: "Hijacked", nameAr: "ب", pricingMode: "contact", currency: "EGP", status: "hidden", sortOrder: "1", includedFeatures: "[]", optionalFeatures: "[]" })], { cookie: c }); return (await sql`select name_en from packages where id=${p.id}`)[0].name_en === "Hijacked"; } },
  // ── Categories
  { action: "saveCategory", permission: "content.edit", run: async (c) => { const k = await makeCategory(); await callAction("saveCategory", [k.id, { ok: false }, form({ scope: "solution", slug: uniq("c"), nameEn: "Hijacked", nameAr: "ت", sortOrder: "1", isVisible: true })], { cookie: c }); return (await sql`select name_en from categories where id=${k.id}`)[0].name_en === "Hijacked"; } },
  { action: "moveCategory", permission: "content.edit", run: async (c) => { const k = await makeCategory(); await callAction("moveCategory", [k.id, "up"], { cookie: c }); return (await sql`select sort_order from categories where id=${k.id}`)[0].sort_order !== 999999; } },
  { action: "deleteCategory", permission: "content.delete", run: async (c) => { const k = await makeCategory(); await callAction("deleteCategory", [k.id], { cookie: c }); return (await sql`select 1 from categories where id=${k.id}`).length === 0; } },
  // ── Projects / partners / articles
  { action: "setProjectStatus", permission: "content.edit", run: async (c) => { const p = await makeProject(); await callAction("setProjectStatus", [p.id, "published"], { cookie: c }); return (await sql`select status from projects where id=${p.id}`)[0].status === "published"; } },
  { action: "moveProject", permission: "content.edit", run: async (c) => { const p = await makeProject(); await sql`update projects set sort_order=999999 where id=${p.id}`; await callAction("moveProject", [p.id, "up"], { cookie: c }); return (await sql`select sort_order from projects where id=${p.id}`)[0].sort_order !== 999999; } },
  { action: "deleteProject", permission: "content.delete", run: async (c) => { const p = await makeProject(); await callAction("deleteProject", [p.id], { cookie: c }); return (await sql`select 1 from projects where id=${p.id}`).length === 0; } },
  { action: "saveProject", permission: "content.edit", run: async (c) => { const p = await makeProject(); await callAction("saveProject", [p.id, { ok: false }, form({ slug: uniq("pr"), nameEn: "Hijacked", nameAr: "ث", status: "published", sortOrder: "1" })], { cookie: c }); return (await sql`select name_en from projects where id=${p.id}`)[0].name_en === "Hijacked"; } },
  { action: "setPartnerStatus", permission: "content.edit", run: async (c) => { const p = await makePartner(); await callAction("setPartnerStatus", [p.id, "published"], { cookie: c }); return (await sql`select status from partners where id=${p.id}`)[0].status === "published"; } },
  { action: "movePartner", permission: "content.edit", run: async (c) => { const p = await makePartner(); await sql`update partners set sort_order=999999 where id=${p.id}`; await callAction("movePartner", [p.id, "up"], { cookie: c }); return (await sql`select sort_order from partners where id=${p.id}`)[0].sort_order !== 999999; } },
  { action: "deletePartner", permission: "content.delete", run: async (c) => { const p = await makePartner(); await callAction("deletePartner", [p.id], { cookie: c }); return (await sql`select 1 from partners where id=${p.id}`).length === 0; } },
  { action: "savePartner", permission: "content.edit", run: async (c) => { const p = await makePartner(); await callAction("savePartner", [p.id, { ok: false }, form({ name: "Hijacked", relationship: "partner", status: "published", sortOrder: "1" })], { cookie: c }); return (await sql`select name from partners where id=${p.id}`)[0].name === "Hijacked"; } },
  { action: "saveArticle", permission: "content.edit", run: async (c) => { const a = await makeArticle(); await callAction("saveArticle", [a.id, { ok: false }, form({ slug: uniq("a"), titleEn: "Hijacked", status: "draft" })], { cookie: c }); return (await sql`select title_en from articles where id=${a.id}`)[0].title_en === "Hijacked"; } },
  { action: "deleteArticle", permission: "content.delete", run: async (c) => { const a = await makeArticle(); await callAction("deleteArticle", [a.id], { cookie: c }); return (await sql`select 1 from articles where id=${a.id}`).length === 0; } },
  // ── Leads
  { action: "updateLeadStatus", permission: "leads.manage", run: async (c) => { const l = await makeLead(); await callAction("updateLeadStatus", [l.id, "won"], { cookie: c }); return (await sql`select status from leads where id=${l.id}`)[0].status === "won"; } },
  { action: "addLeadNote", permission: "leads.manage", run: async (c) => { const l = await makeLead(); await callAction("addLeadNote", [l.id, { ok: false }, form({ body: "note" })], { cookie: c }); return (await sql`select 1 from lead_notes where lead_id=${l.id}`).length === 1; } },
  { action: "deleteLead", permission: "leads.manage", run: async (c) => { const l = await makeLead(); await callAction("deleteLead", [l.id], { cookie: c }); return (await sql`select 1 from leads where id=${l.id}`).length === 0; } },
  // ── Media
  { action: "updateMedia", permission: "media.manage", run: async (c) => { const m = await makeMedia(); await callAction("updateMedia", [m.id, { ok: false }, form({ altEn: "Hijacked", altAr: "" })], { cookie: c }); return (await sql`select alt_en from media where id=${m.id}`)[0].alt_en === "Hijacked"; } },
  { action: "deleteMedia", permission: "media.manage", run: async (c) => { const m = await makeMedia(); await callAction("deleteMedia", [m.id], { cookie: c }); return (await sql`select 1 from media where id=${m.id}`).length === 0; } },
  // ── Settings & users
  { action: "saveSettings", permission: "settings.manage", run: async (c) => { const v = uniq("legal"); await callAction("saveSettings", ["footer", { ok: false }, form({ statementEn: "s", statementAr: "س", legalEn: v, legalAr: "" })], { cookie: c }); return (await sql`select value->>'legalEn' as v from settings where key='footer'`)[0]?.v === v; } },
  { action: "createUser", permission: "users.manage", run: async (c) => { const email = `${uniq("new")}@abcarino.test`; await callAction("createUser", [{ ok: false }, form({ email, name: "New", role: "super_admin", password: "Tidal-Orbit-Lamp-9931" })], { cookie: c }); return (await sql`select 1 from users where email=${email}`).length === 1; } },
  { action: "updateUser(escalate)", permission: "users.manage", run: async (c) => { const victim = await userWithSession("editor"); await callAction("updateUser", [victim.id, { ok: false }, form({ name: "x", role: "super_admin", isActive: true })], { cookie: c }); return (await sql`select role from users where id=${victim.id}`)[0].role === "super_admin"; } },
];

type Caller = { label: string; role: Role | null; cookie: () => Promise<string> };
const callers: Caller[] = [
  { label: "anonymous (forged cookie)", role: null, cookie: async () => FORGED_COOKIE },
  { label: "deactivated super_admin", role: null, cookie: async () => (await userWithSession("super_admin", { active: false })).cookie },
  { label: "expired super_admin session", role: null, cookie: async () => (await userWithSession("super_admin", { expired: true })).cookie },
  { label: "idle (25h) super_admin session", role: null, cookie: async () => (await userWithSession("super_admin", { idleHours: 25 })).cookie },
  ...(["super_admin", "content_manager", "editor", "sales", "operations"] as Role[]).map((role) => ({
    label: role,
    role,
    cookie: async () => (await userWithSession(role)).cookie,
  })),
];

test.describe("server-side authorization matrix (direct action invocation + IDOR)", () => {
  test.describe.configure({ mode: "serial" });

  for (const caller of callers) {
    test(`${caller.label}`, async () => {
      test.setTimeout(120_000);
      const cookie = await caller.cookie();
      const mismatches: string[] = [];
      for (const probe of probes) {
        const expected = caller.role !== null && can(caller.role, probe.permission);
        const happened = await probe.run(cookie);
        if (happened !== expected) mismatches.push(`${probe.action}: expected ${expected ? "ALLOWED" : "DENIED"}, got ${happened ? "ALLOWED" : "DENIED"}`);
      }
      expect(mismatches).toEqual([]);
    });
  }

  test("every server action in the build is covered or explicitly public", () => {
    const names = new Set(Object.values(actionManifest()).map((e) => e.exportedName));
    const covered = new Set(probes.map((p) => p.action.replace(/\(.*\)$/, "")));
    // Public by design, or covered by the auth-lifecycle spec (changeOwnPassword has no target id).
    const publicActions = new Set(["submitLead", "login", "logout", "changeOwnPassword"]);
    const uncovered = [...names].filter((n) => !covered.has(n) && !publicActions.has(n));
    expect(uncovered).toEqual([]);
  });

  test("internal helpers are not exposed as callable server actions", async () => {
    const names = Object.values(actionManifest()).map((e) => e.exportedName);
    expect(names).not.toContain("mediaUsage");
  });
});

/* ───────────── Pages and API routes: GET access per role (server-side) ───────────── */
const PAGES: Array<[string, Permission | null]> = [
  ["/admin", "dashboard.view"],
  ["/admin/account", null],
  ["/admin/leads", "leads.view"],
  ["/admin/solutions", "content.edit"],
  ["/admin/solutions/new", "content.edit"],
  ["/admin/packages", "content.edit"],
  ["/admin/categories", "content.edit"],
  ["/admin/media", "media.manage"],
  ["/admin/projects", "content.edit"],
  ["/admin/partners", "content.edit"],
  ["/admin/articles", "content.edit"],
  ["/admin/settings", "settings.manage"],
  ["/admin/users", "users.manage"],
  ["/admin/users/new", "users.manage"],
  ["/admin/activity", "audit.view"],
];

test.describe("admin pages & APIs per role", () => {
  for (const caller of callers) {
    test(`pages: ${caller.label}`, async () => {
      const cookie = await caller.cookie();
      const lead = await makeLead({ name: "Secret Customer" });
      const pages: Array<[string, Permission | null]> = [...PAGES, [`/admin/leads/${lead.id}`, "leads.view"]];
      const wrong: string[] = [];
      for (const [path, perm] of pages) {
        const res = await fetch(`http://localhost:3100${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
        const location = res.headers.get("location") ?? "";
        const allowed = caller.role !== null && (perm === null || can(caller.role, perm));
        const body = res.status === 200 ? await res.text() : "";
        if (allowed && res.status !== 200) wrong.push(`${path}: expected 200, got ${res.status} → ${location}`);
        if (!allowed) {
          const expectedTarget = caller.role === null ? "/admin/login" : "/admin?denied=1";
          if (!(res.status >= 300 && res.status < 400 && location.endsWith(expectedTarget))) wrong.push(`${path}: expected redirect to ${expectedTarget}, got ${res.status} ${location}`);
          if (body.includes("Secret Customer")) wrong.push(`${path}: leaked lead data`);
        }
      }
      expect(wrong).toEqual([]);
    });

    test(`APIs: ${caller.label}`, async () => {
      const cookie = await caller.cookie();
      await makeLead({ name: "Export Target" });
      const role = caller.role;
      const list = await fetch("http://localhost:3100/api/admin/media", { headers: { Cookie: cookie } });
      const canList = role !== null && (can(role, "media.manage") || can(role, "content.edit"));
      expect(list.status, "GET /api/admin/media").toBe(canList ? 200 : 401);

      const exp = await fetch("http://localhost:3100/api/admin/leads/export", { headers: { Cookie: cookie } });
      const canExport = role !== null && can(role, "leads.view");
      expect(exp.status, "GET leads export").toBe(canExport ? 200 : 401);
      if (!canExport) expect(await exp.text()).not.toContain("Export Target");

      const fd = new FormData();
      fd.append("file", new Blob([Buffer.from("not an image")], { type: "image/png" }), "x.png");
      const up = await fetch("http://localhost:3100/api/admin/media", { method: "POST", headers: { Cookie: cookie, Origin: "http://localhost:3100" }, body: fd });
      // Authorized callers get past auth and hit content validation (422); others are refused (403).
      expect(up.status, "POST upload").toBe(role !== null && can(role, "media.manage") ? 422 : 403);
    });
  }
});
