/**
 * Adversarial tests against the production build: uploads, stored XSS,
 * malformed input at the server boundary, database integrity and races.
 * All writes go through the real server actions / API routes; assertions
 * are made on HTTP responses, rendered DOM and the database.
 */
import { crc32 } from "node:zlib";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, callAction, form } from "./support/server-actions";
import { makeCategory, makeLead, makeMedia, makePackage, makeSolution, sql, uniq, userWithSession } from "./support/db";

let admin: { id: string; cookie: string };
test.beforeAll(async () => {
  admin = await userWithSession("super_admin");
});

async function upload(buf: Buffer, name: string, type = "image/png", cookie = admin.cookie) {
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(buf)], { type }), name);
  const res = await fetch(`${BASE_URL}/api/admin/media`, { method: "POST", headers: { Cookie: cookie, Origin: BASE_URL }, body: fd });
  const text = await res.text();
  return { status: res.status, json: (() => { try { return JSON.parse(text); } catch { return null; } })(), text };
}

const solutionFields = (over: Record<string, string | string[] | boolean> = {}) =>
  form({ slug: uniq("x"), titleEn: "Title", titleAr: "عنوان", status: "available", visualKey: "living", sortOrder: "5", benefits: "[]", features: "[]", ...over });

/* ───────────────────────────────── uploads */
test.describe("upload security (HTTP level)", () => {
  test("hostile files are rejected with 4xx and never stored", async () => {
    const before = (await sql`select count(*)::int as n from media`)[0].n;
    const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#f00" } }).png().toBuffer();
    const bomb = Buffer.from(png);
    bomb.writeUInt32BE(30000, 16);
    bomb.writeUInt32BE(30000, 20);
    bomb.writeUInt32BE(crc32(bomb.subarray(12, 29)) >>> 0, 29);
    const cases: Array<[string, Buffer, string, string]> = [
      ["svg with script", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "a.svg", "image/svg+xml"],
      ["svg renamed png", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"/>'), "a.png", "image/png"],
      ["exe renamed png", Buffer.concat([Buffer.from("MZ\x90\x00"), Buffer.alloc(512, 1)]), "setup.png", "image/png"],
      ["html as png", Buffer.from("<html><script>alert(1)</script></html>"), "p.png", "image/png"],
      ["php/gif polyglot", Buffer.from("GIF89a<?php system($_GET[1]); ?>"), "s.gif", "image/gif"],
      ["pdf", Buffer.from("%PDF-1.4\n%%EOF"), "d.pdf", "application/pdf"],
      ["truncated png", png.subarray(0, 40), "t.png", "image/png"],
      ["900MP bomb", bomb, "b.png", "image/png"],
      ["empty", Buffer.alloc(0), "e.png", "image/png"],
    ];
    for (const [label, buf, name, type] of cases) {
      const r = await upload(buf, name, type);
      expect(r.status, label).toBe(422);
      expect(r.text, label).not.toMatch(/node_modules|\/home\/|at [\w.]+ \(|sharp|vips/i);
    }
    const tooBig = await upload(Buffer.alloc(15 * 1024 * 1024 + 10, 0), "big.png");
    expect(tooBig.status).toBe(413);
    expect((await sql`select count(*)::int as n from media`)[0].n).toBe(before);
  });

  test("accepted images are re-encoded WebP with random names and safe serving headers", async () => {
    const jpg = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#123456" } })
      .withExif({ IFD0: { Make: "PhoneCo" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "30/1 2/1 0/1" } })
      .jpeg()
      .toBuffer();
    const r = await upload(jpg, "../../etc/صورة ‮gnp.exe.jpg", "image/jpeg");
    expect(r.status).toBe(201);
    expect(r.json.item.url).toMatch(/^\/media\/[0-9a-f-]{36}\.webp$/);
    expect(r.json.item.originalName).toBe(".etcصورة gnp.exe.jpg");
    const res = await fetch(BASE_URL + r.json.item.url);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain("sandbox");
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    expect(Math.max(meta.width!, meta.height!)).toBe(2400);
    for (const bad of ["/media/..%2F..%2Fpackage.json", "/media/x.webp", "/media/%00.webp", `${r.json.item.url.replace(".webp", ".html")}`]) {
      expect((await fetch(BASE_URL + bad)).status, bad).toBe(404);
    }
  });
});

/* ───────────────────────────────── media delete */
test.describe("media deletion", () => {
  test("invalid, missing, referenced and repeated deletes are all safe", async () => {
    for (const id of ["not-a-uuid", "00000000-0000-4000-8000-000000000000", "'; drop table media; --"]) {
      const r = await callAction("deleteMedia", [id], { cookie: admin.cookie, path: "/admin/media" });
      expect(r.status, id).toBe(200);
    }
    const png = await sharp({ create: { width: 50, height: 50, channels: 3, background: "#0f0" } }).png().toBuffer();
    const up = await upload(png, "ref.png");
    const mediaId = up.json.item.id;
    const s = await makeSolution({ image_id: mediaId });
    const refused = await callAction("deleteMedia", [mediaId], { cookie: admin.cookie, path: "/admin/media" });
    expect((refused.result as { ok: boolean; message: string }).ok).toBe(false);
    expect((refused.result as { message: string }).message).toContain("still used by");
    expect((await sql`select image_id from solutions where id=${s.id}`)[0].image_id).toBe(mediaId);
    expect((await fetch(BASE_URL + up.json.item.url)).status).toBe(200);

    await sql`update solutions set image_id = null where id = ${s.id}`;
    const [a, b] = await Promise.all([
      callAction("deleteMedia", [mediaId], { cookie: admin.cookie, path: "/admin/media" }),
      callAction("deleteMedia", [mediaId], { cookie: admin.cookie, path: "/admin/media" }),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(await sql`select 1 from media where id=${mediaId}`).toHaveLength(0);
    expect((await fetch(BASE_URL + up.json.item.url)).status).toBe(404); // file removed too
  });
});

/* ───────────────────────────────── stored XSS */
const PAYLOADS = [
  `<script>window.__xss="script"</script>`,
  `<img src=x onerror="window.__xss='img'">`,
  `"><svg onload="window.__xss='svg'">`,
  `</script><script>window.__xss='breakout'</script>`,
  `javascript:window.__xss='href'`,
];
const P = PAYLOADS.join(" ");
const MD = `${P}\n\n[a](javascript:window.__xss='md1') [b](JaVaScRiPt:window.__xss='md2') [c](data:text/html,<script>alert(1)</script>) [d](  javascript:alert(1)) <a href="javascript:alert(1)">e</a>`;

async function assertNoXss(page: Page, path: string) {
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  const res = await page.goto(path);
  expect(res?.status(), path).toBeLessThan(400);
  await page.waitForLoadState("networkidle");
  const found = await page.evaluate(() => ({
    flag: (window as unknown as { __xss?: string }).__xss ?? null,
    handlers: document.querySelectorAll("[onerror],[onload],[onclick]").length,
    jsLinks: [...document.querySelectorAll("a[href]")].filter((a) => /^\s*(javascript|data):/i.test(a.getAttribute("href") ?? "")).length,
    // Next.js streams page data in nonce'd `self.__next_f.push(...)` scripts: payload text may
    // appear there as escaped string data, which is fine as long as it cannot close the tag.
    injectedScripts: [...document.querySelectorAll("script")].filter((s) => {
      const t = s.textContent ?? "";
      return t.includes("__xss") && s.type !== "application/ld+json" && !t.startsWith("self.__next_f.push(");
    }).length,
    unescapedData: [...document.querySelectorAll("script")].filter((s) => /<\/?script/i.test(s.textContent ?? "")).length,
  }));
  expect({ path, ...found, dialogs }).toEqual({ path, flag: null, handlers: 0, jsLinks: 0, injectedScripts: 0, unescapedData: 0, dialogs: [] });
}

test.describe("stored XSS", () => {
  test("hostile content in every CMS field renders inert on public and admin pages", async ({ browser }) => {
    test.setTimeout(180_000);
    const slug = uniq("xss");
    const cat = await makeCategory();
    await sql`update categories set name_en=${P}, name_ar=${P}, description_en=${P} where id=${cat.id}`;
    const pkg = await makePackage();
    const save = await callAction(
      "saveSolution",
      [null, { ok: false }, solutionFields({ slug, titleEn: `Title ${PAYLOADS[1]}`.slice(0, 120), titleAr: `عنوان ${PAYLOADS[0]}`.slice(0, 120), categoryId: cat.id, summaryEn: P, summaryAr: P, descriptionEn: MD, descriptionAr: MD, features: JSON.stringify([{ en: P, ar: P }]), benefits: JSON.stringify([{ titleEn: P.slice(0, 120), titleAr: P.slice(0, 120), textEn: P, textAr: P }]), ctaLabelEn: PAYLOADS[0].slice(0, 60), seoTitleEn: PAYLOADS[3].slice(0, 120), seoDescriptionEn: P, packageIds: [pkg.id] })],
      { cookie: admin.cookie, path: "/admin/solutions/new" },
    );
    expect(save.redirect ?? JSON.stringify(save.result)).toContain("/admin/solutions/");
    await callAction("savePackage", [pkg.id, { ok: false }, form({ slug: uniq("xp"), nameEn: `Pkg ${PAYLOADS[1]}`.slice(0, 120), nameAr: "ب", taglineEn: P, descriptionEn: MD, includedFeatures: JSON.stringify([{ en: P, ar: P }]), optionalFeatures: "[]", pricingMode: "fixed", price: "100", currency: "EGP", priceNoteEn: PAYLOADS[1].slice(0, 200), status: "available", sortOrder: "1" })], { cookie: admin.cookie, path: "/admin/packages/new" });
    const pkgSlug = (await sql`select slug from packages where id=${pkg.id}`)[0].slug;
    await callAction("saveSettings", ["pages", { ok: false }, form({ heroTitleEn: `Future ${PAYLOADS[1]}`.slice(0, 140), heroTitleAr: "المستقبل", heroSubtitleEn: P, heroSubtitleAr: P, statementEn: P, statementAr: P, aboutIntroEn: P, aboutIntroAr: P })], { cookie: admin.cookie, path: "/admin/settings" });
    await callAction("saveSettings", ["contact", { ok: false }, form({ whatsappNumber: "+201000000001", whatsappMessageEn: P.slice(0, 300), whatsappMessageAr: P.slice(0, 300), email: "", phone: PAYLOADS[1].slice(0, 40), addressEn: P, addressAr: P, mapUrl: "", businessHoursEn: PAYLOADS[1], businessHoursAr: "" })], { cookie: admin.cookie, path: "/admin/settings" });
    await callAction("saveSettings", ["cta", { ok: false }, form({ primaryLabelEn: "Talk", primaryLabelAr: "تحدث", secondaryLabelEn: "Ask", secondaryLabelAr: "اسأل", consultationNoteEn: P, consultationNoteAr: P })], { cookie: admin.cookie, path: "/admin/settings" });
    await callAction("saveSettings", ["footer", { ok: false }, form({ statementEn: P.slice(0, 300), statementAr: P.slice(0, 300), legalEn: PAYLOADS[1], legalAr: "" })], { cookie: admin.cookie, path: "/admin/settings" });
    const mediaUp = await upload(await sharp({ create: { width: 20, height: 20, channels: 3, background: "#00f" } }).png().toBuffer(), `${PAYLOADS[1]}.png`);
    await callAction("updateMedia", [mediaUp.json.item.id, { ok: false }, form({ altEn: PAYLOADS[2], altAr: PAYLOADS[1] })], { cookie: admin.cookie, path: "/admin/media" });
    await sql`update solutions set image_id=${mediaUp.json.item.id} where slug=${slug}`;
    const lead = await makeLead({ name: PAYLOADS[1], message: MD, project_type: PAYLOADS[0], source_path: PAYLOADS[2] });
    await callAction("addLeadNote", [lead.id, { ok: false }, form({ body: MD })], { cookie: admin.cookie, path: "/admin/leads" });
    const art = uniq("xa");
    await callAction("saveArticle", [null, { ok: false }, form({ slug: art, titleEn: `Guide ${PAYLOADS[1]}`, titleAr: "دليل", excerptEn: P, bodyEn: MD, bodyAr: MD, status: "published" })], { cookie: admin.cookie, path: "/admin/articles/new" });
    await callAction("saveSettings", ["sections", { ok: false }, form({ showPackages: true, showPackagePrices: true, showComingSoon: true, showInsights: true })], { cookie: admin.cookie, path: "/admin/settings" });

    const solId = (await sql`select id from solutions where slug=${slug}`)[0].id;
    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    for (const path of ["/en", "/ar", "/en/solutions", `/en/solutions/${slug}`, `/ar/solutions/${slug}`, `/en/packages/${pkgSlug}`, "/en/about", "/ar/contact", `/en/insights/${art}`, `/ar/insights/${art}`]) {
      await assertNoXss(v, path);
    }
    // JSON-LD still parses and cannot break out of its <script> element.
    await v.goto(`/en/solutions/${slug}`);
    for (const block of await v.locator('script[type="application/ld+json"]').allTextContents()) expect(() => JSON.parse(block)).not.toThrow();
    // Markdown produced no clickable unsafe links, and the payload text is shown literally.
    await expect(v.locator("main").getByText(PAYLOADS[0]).first()).toBeVisible();
    await visitor.close();

    const adminCtx = await browser.newContext();
    const [name, value] = admin.cookie.split("=");
    await adminCtx.addCookies([{ name, value, domain: "localhost", path: "/" }]);
    const a = await adminCtx.newPage();
    for (const path of ["/admin", "/admin/solutions", `/admin/solutions/${solId}`, "/admin/leads", `/admin/leads/${lead.id}`, "/admin/media", "/admin/settings", "/admin/activity", "/admin/categories"]) {
      await assertNoXss(a, path);
    }
    await adminCtx.close();
    // Restore defaults for later specs.
    await sql`delete from settings where key in ('pages','contact','cta','footer','sections')`;
    await callAction("saveSettings", ["sections", { ok: false }, form({ showPackages: true, showPackagePrices: true, showComingSoon: true })], { cookie: admin.cookie, path: "/admin/settings" });
  });
});

/* ───────────────────────────────── input validation at the server boundary */
test.describe("input validation (direct action calls)", () => {
  test("solution form rejects invalid values and ignores unexpected fields", async () => {
    const s = await makeSolution();
    const call = (fd: FormData) => callAction("saveSolution", [s.id, { ok: false }, fd], { cookie: admin.cookie, path: "/admin/solutions/new" });
    const bad: Array<[string, FormData, string]> = [
      ["empty title", solutionFields({ titleEn: "" }), "titleEn"],
      ["whitespace title", solutionFields({ titleEn: "   " }), "titleEn"],
      ["title too long", solutionFields({ titleEn: "x".repeat(121) }), "titleEn"],
      ["invalid status enum", solutionFields({ status: "published" }), "status"],
      ["path traversal slug", solutionFields({ slug: "../admin" }), "slug"],
      ["unicode slug", solutionFields({ slug: "حلول" }), "slug"],
      ["non-uuid category", solutionFields({ categoryId: "1 OR 1=1" }), "categoryId"],
      ["non-uuid gallery", solutionFields({ gallery: ["x"] }), "gallery.0"],
      ["features as object", solutionFields({ features: '{"en":"a"}' }), "features"],
      ["features with numbers", solutionFields({ features: '[{"en":1,"ar":2}]' }), "features.0.en"],
    ];
    for (const [label, fd, field] of bad) {
      const r = await call(fd);
      const res = r.result as { ok: boolean; errors?: Record<string, string> };
      expect(res.ok, label).toBe(false);
      expect(Object.keys(res.errors ?? {}), label).toContain(field);
    }
    // Unexpected fields cannot set columns (id, timestamps, sort order text).
    const fd = solutionFields({ titleEn: "Clean", id: "00000000-0000-4000-8000-000000000000", createdAt: "1999-01-01", sortOrder: "abc", passwordHash: "x" });
    const ok = await call(fd);
    expect((ok.result as { ok: boolean }).ok).toBe(true);
    const [row] = await sql`select id, title_en, sort_order, created_at from solutions where id=${s.id}`;
    expect(row.id).toBe(s.id);
    expect(row.title_en).toBe("Clean");
    expect(new Date(row.created_at).getFullYear()).toBeGreaterThan(2000);
    // Arabic, digits, English terms, emoji and RTL marks round-trip unchanged.
    const mixed = "نظام Smart Home ٣ غرف — 3 rooms ✓";
    await call(solutionFields({ titleAr: mixed }));
    expect((await sql`select title_ar from solutions where id=${s.id}`)[0].title_ar).toBe(mixed);
  });

  test("malformed arguments never crash into a 500 with internals, and never write", async () => {
    const s = await makeSolution();
    const weird: unknown[][] = [
      [s.id, ["available"]],
      [{ id: s.id }, "hidden"],
      [null, null],
      [s.id, "hidden; drop table solutions"],
      [123, true],
    ];
    for (const args of weird) {
      const r = await callAction("setSolutionStatus", args, { cookie: admin.cookie });
      expect(r.body).not.toMatch(/node_modules|\/home\/|at [\w.]+ \(|postgres|drizzle/i);
    }
    expect((await sql`select status from solutions where id=${s.id}`)[0].status).toBe("available");
    const r2 = await callAction("saveSolution", [s.id, { ok: false }, null], { cookie: admin.cookie, path: "/admin/solutions/new" });
    expect((r2.result as { ok: boolean }).ok).toBe(false);
    const first = await makeSolution({ sort_order: -1000 });
    const r3 = await callAction("moveSolution", [first.id, "sideways"], { cookie: admin.cookie });
    expect(r3.status).toBe(200);
    expect((await sql`select sort_order from solutions where id=${first.id}`)[0].sort_order).toBe(-1000);
  });

  test("settings: unknown groups, prototype keys and extra fields are rejected or ignored", async () => {
    for (const group of ["__proto__", "constructor", "users", "general "]) {
      const r = await callAction("saveSettings", [group, { ok: false }, form({ companyNameEn: "Hacked" })], { cookie: admin.cookie, path: "/admin/settings" });
      expect((r.result as { ok: boolean }).ok, group).toBe(false);
    }
    const r = await callAction("saveSettings", ["social", { ok: false }, form({ instagram: "javascript:alert(1)" })], { cookie: admin.cookie, path: "/admin/settings" });
    expect((r.result as { errors?: Record<string, string> }).errors?.instagram).toBeTruthy();
    const r2 = await callAction("saveSettings", ["contact", { ok: false }, form({ whatsappNumber: "+20 100 000 0002", email: "not-an-email" })], { cookie: admin.cookie, path: "/admin/settings" });
    expect((r2.result as { errors?: Record<string, string> }).errors?.email).toBeTruthy();
    const r3 = await callAction("saveSettings", ["general", { ok: false }, form({ companyNameEn: "ABCARINO", companyNameAr: "عبقرينو", isAdmin: "true", logoMediaId: "" })], { cookie: admin.cookie, path: "/admin/settings" });
    expect((r3.result as { ok: boolean }).ok).toBe(true);
    const stored = (await sql`select value from settings where key='general'`)[0].value;
    expect(stored).not.toHaveProperty("isAdmin");
  });

  test("users: invalid roles, emails and weak passwords are rejected server-side", async () => {
    const cases: Array<[Record<string, string>, string]> = [
      [{ email: "a@b.co", name: "x", role: "god", password: "Tidal-Orbit-Lamp-9931" }, "role"],
      [{ email: "not-an-email", name: "x", role: "editor", password: "Tidal-Orbit-Lamp-9931" }, "email"],
      [{ email: `${uniq("w")}@abcarino.test`, name: "x", role: "editor", password: "short" }, "password"],
      [{ email: `${uniq("w")}@abcarino.test`, name: "", role: "editor", password: "Tidal-Orbit-Lamp-9931" }, "name"],
    ];
    for (const [values, field] of cases) {
      const r = await callAction("createUser", [{ ok: false }, form(values)], { cookie: admin.cookie, path: "/admin/users/new" });
      expect(Object.keys((r.result as { errors?: Record<string, string> }).errors ?? {}), field).toContain(field);
    }
    const email = `${uniq("dup")}@abcarino.test`;
    await callAction("createUser", [{ ok: false }, form({ email, name: "One", role: "editor", password: "Tidal-Orbit-Lamp-9931" })], { cookie: admin.cookie, path: "/admin/users/new" });
    const dup = await callAction("createUser", [{ ok: false }, form({ email: email.toUpperCase(), name: "Two", role: "editor", password: "Tidal-Orbit-Lamp-9931" })], { cookie: admin.cookie, path: "/admin/users/new" });
    expect((dup.result as { errors?: Record<string, string> }).errors?.email).toMatch(/already exists/);
    expect(await sql`select 1 from users where lower(email)=lower(${email})`).toHaveLength(1);
  });

  test("the last active Super Admin cannot be demoted or deactivated", async () => {
    // Isolate: temporarily demote every other super admin.
    const others = await sql`select id from users where role='super_admin' and is_active and id <> ${admin.id}`;
    await sql`update users set role='editor' where id in ${sql(others.map((o) => o.id))}`;
    try {
      const r = await callAction("updateUser", [admin.id, { ok: false }, form({ name: "Me", role: "editor", isActive: true })], { cookie: admin.cookie, path: "/admin/users/new" });
      expect((r.result as { message?: string }).message).toMatch(/At least one active Super Admin/);
      const r2 = await callAction("updateUser", [admin.id, { ok: false }, form({ name: "Me", role: "super_admin" })], { cookie: admin.cookie, path: "/admin/users/new" });
      expect((r2.result as { ok: boolean }).ok).toBe(false);
      expect((await sql`select role, is_active from users where id=${admin.id}`)[0]).toEqual({ role: "super_admin", is_active: true });
    } finally {
      if (others.length) await sql`update users set role='super_admin' where id in ${sql(others.map((o) => o.id))}`;
    }
  });
});

/* ───────────────────────────────── database integrity */
test.describe("database integrity through the application", () => {
  test("invalid references fail safely and roll back", async () => {
    const s = await makeSolution();
    const ghost = "00000000-0000-4000-8000-00000000abcd";
    const r1 = await callAction("saveSolution", [s.id, { ok: false }, solutionFields({ titleEn: "Should not persist", categoryId: ghost })], { cookie: admin.cookie, path: "/admin/solutions/new" });
    expect((r1.result as { ok: boolean; message?: string }).ok).toBe(false);
    expect((r1.result as { message?: string }).message).toBe("Something went wrong. Please try again.");
    const r2 = await callAction("saveSolution", [s.id, { ok: false }, solutionFields({ titleEn: "Should not persist", packageIds: [ghost] })], { cookie: admin.cookie, path: "/admin/solutions/new" });
    expect((r2.result as { ok: boolean }).ok).toBe(false);
    // Transaction rolled back: the solution update did not persist either.
    expect((await sql`select title_en from solutions where id=${s.id}`)[0].title_en).toBe("Probe");
  });

  test("deletes cascade or detach exactly as designed and pages keep rendering", async ({ page }) => {
    const cat = await makeCategory();
    const s = await makeSolution({ category_id: cat.id });
    const p = await makePackage();
    await sql`insert into package_solutions (package_id, solution_id) values (${p.id}, ${s.id})`;
    await callAction("deleteCategory", [cat.id], { cookie: admin.cookie, path: "/admin/categories" });
    expect((await sql`select category_id from solutions where id=${s.id}`)[0].category_id).toBeNull();
    expect((await page.goto("/en/solutions"))?.status()).toBe(200);
    await callAction("deleteSolution", [s.id], { cookie: admin.cookie });
    expect(await sql`select 1 from package_solutions where solution_id=${s.id}`).toHaveLength(0);
    expect(await sql`select 1 from packages where id=${p.id}`).toHaveLength(1);
    const lead = await makeLead();
    await callAction("addLeadNote", [lead.id, { ok: false }, form({ body: "n" })], { cookie: admin.cookie, path: "/admin/leads" });
    await callAction("deleteLead", [lead.id], { cookie: admin.cookie, path: "/admin/leads" });
    expect(await sql`select 1 from lead_notes where lead_id=${lead.id}`).toHaveLength(0);
    // A gallery entry pointing at a media row removed out-of-band is skipped, not crashed on.
    const m = await makeMedia();
    const s2 = await makeSolution({ gallery: sql.json([m.id]), image_id: m.id });
    await sql`delete from media where id=${m.id}`;
    expect((await sql`select image_id from solutions where id=${s2.id}`)[0].image_id).toBeNull();
    // Out-of-band SQL edits bypass cache invalidation by design; any admin write refreshes it.
    await callAction("setSolutionStatus", [s2.id, "available"], { cookie: admin.cookie });
    const slug = (await sql`select slug from solutions where id=${s2.id}`)[0].slug;
    expect((await page.goto(`/en/solutions/${slug}`))?.status()).toBe(200);
    // Audit entries survive their author (user_id set null) and the log still renders.
    const temp = await userWithSession("editor");
    await sql`insert into audit_log (user_id, action, entity_type, summary) values (${temp.id}, 'test.event', 'test', 'orphan check')`;
    await sql`delete from users where id=${temp.id}`;
    expect((await sql`select user_id from audit_log where summary='orphan check'`)[0].user_id).toBeNull();
    const act = await fetch(`${BASE_URL}/admin/activity`, { headers: { Cookie: admin.cookie } });
    expect(act.status).toBe(200);
  });
});

/* ───────────────────────────────── concurrency */
test.describe("concurrency", () => {
  test("simultaneous creates with the same slug produce exactly one record and a clean error", async () => {
    const slug = uniq("race");
    const fd = () => form({ slug, nameEn: "Race", nameAr: "سباق", pricingMode: "contact", currency: "EGP", status: "hidden", sortOrder: "1", includedFeatures: "[]", optionalFeatures: "[]" });
    const results = await Promise.all([1, 2, 3].map(() => callAction("savePackage", [null, { ok: false }, fd()], { cookie: admin.cookie, path: "/admin/packages/new" })));
    expect(await sql`select 1 from packages where slug=${slug}`).toHaveLength(1);
    const errors = results.map((r) => (r.result as { errors?: Record<string, string> } | undefined)?.errors?.slug).filter(Boolean);
    expect(errors).toHaveLength(2);
    expect(results.every((r) => r.status === 200)).toBe(true);
  });

  test("rapid status flips and concurrent reorders leave a consistent state", async () => {
    const s = await makeSolution();
    const flips = ["hidden", "available", "coming_soon", "hidden", "available"];
    await Promise.all(flips.map((st) => callAction("setSolutionStatus", [s.id, st], { cookie: admin.cookie })));
    expect(flips).toContain((await sql`select status from solutions where id=${s.id}`)[0].status);
    const ids = [(await makeSolution()).id, (await makeSolution()).id];
    const moves = await Promise.all([...ids, ...ids].map((id, i) => callAction("moveSolution", [id, i % 2 ? "up" : "down"], { cookie: admin.cookie })));
    expect(moves.every((m) => m.status === 200)).toBe(true);
    const count = (await sql`select count(*)::int as n from solutions`)[0].n;
    expect(count).toBeGreaterThan(0);
  });

  test("double-submitted contact form creates two leads (no idempotency — documented)", async () => {
    const name = uniq("Double");
    const payload = () => form({ name, phone: "+20 100 000 0099", email: "", projectType: "", message: "", preferredContact: "whatsapp", locale: "en", sourcePath: "/en/contact", started_at: String(Date.now() - 5000) });
    await Promise.all([1, 2].map(() => callAction("submitLead", [{ status: "idle" }, payload()], { path: "/en/contact", headers: { "X-Forwarded-For": "198.51.100.200" } })));
    expect(await sql`select 1 from leads where name=${name}`).toHaveLength(2);
  });
});
