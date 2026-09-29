/**
 * Business workflows end-to-end on the production build:
 * leads (public form → admin → statuses → notes → CSV) and settings
 * propagation from the admin to the public site in both languages.
 */
import { expect, test, type Browser } from "@playwright/test";
import { BASE_URL, callAction, form } from "./support/server-actions";
import { sql, uniq, userWithSession } from "./support/db";

let admin: { cookie: string };
test.beforeAll(async () => {
  admin = await userWithSession("super_admin");
});

const anon = (browser: Browser, locale = "en-US") => browser.newContext({ storageState: { cookies: [], origins: [] }, locale });

/** RFC 4180-ish CSV parser (quoted fields, doubled quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

test.describe("lead workflow", () => {
  test("public form (Arabic) → database → admin list/filter → every status → notes → CSV", async ({ browser }) => {
    const ctx = await anon(browser, "ar-EG");
    const page = await ctx.newPage();
    const name = uniq("منى");
    await page.goto("/ar/contact?topic=smart-lighting");
    await page.fill("#c-name", name);
    await page.fill("#c-phone", "+20 100 222 3344");
    await page.fill("#c-message", "أريد إضاءة ذكية لغرفتين — 2 rooms, Smart Home.");
    await page.getByText("مكالمة هاتفية").click();
    await page.waitForTimeout(2700);
    await page.getByRole("button", { name: "إرسال الرسالة" }).click();
    await expect(page.getByText("تم استلام رسالتك")).toBeVisible();
    await ctx.close();

    const [lead] = await sql`select * from leads where name = ${name}`;
    expect(lead).toMatchObject({ phone: "+20 100 222 3344", project_type: "smart-lighting", preferred_contact: "phone", locale: "ar", status: "new", source_path: "/ar/contact" });
    expect(lead.ip_hash).toMatch(/^[0-9a-f]{32}$/); // hashed, never the raw IP
    expect(lead.ip_hash).not.toContain("127.0.0.1");

    const list = await (await fetch(`${BASE_URL}/admin/leads?status=new`, { headers: { Cookie: admin.cookie } })).text();
    expect(list).toContain(name);
    const search = await (await fetch(`${BASE_URL}/admin/leads?q=${encodeURIComponent(name)}`, { headers: { Cookie: admin.cookie } })).text();
    expect(search).toContain(name);

    for (const status of ["contacted", "qualified", "proposal", "won", "lost", "new"]) {
      await callAction("updateLeadStatus", [lead.id, status], { cookie: admin.cookie, path: "/admin/leads" });
      expect((await sql`select status from leads where id=${lead.id}`)[0].status).toBe(status);
      const filtered = await (await fetch(`${BASE_URL}/admin/leads?status=${status}`, { headers: { Cookie: admin.cookie } })).text();
      expect(filtered.includes(name), `filter ${status}`).toBe(true);
    }
    const bad = await callAction("updateLeadStatus", [lead.id, "archived"], { cookie: admin.cookie, path: "/admin/leads" });
    expect(bad.status).toBe(200);
    expect((await sql`select status from leads where id=${lead.id}`)[0].status).toBe("new");

    const empty = await callAction("addLeadNote", [lead.id, { ok: false }, form({ body: "   " })], { cookie: admin.cookie, path: "/admin/leads" });
    expect((empty.result as { errors?: Record<string, string> }).errors?.body).toBeTruthy();
    await callAction("addLeadNote", [lead.id, { ok: false }, form({ body: "اتصلت — call back Sunday" })], { cookie: admin.cookie, path: "/admin/leads" });
    const detail = await (await fetch(`${BASE_URL}/admin/leads/${lead.id}`, { headers: { Cookie: admin.cookie } })).text();
    expect(detail).toContain("اتصلت — call back Sunday");

    const csv = await fetch(`${BASE_URL}/api/admin/leads/export?q=${encodeURIComponent(name)}`, { headers: { Cookie: admin.cookie } });
    expect(csv.headers.get("content-type")).toContain("text/csv");
    expect(csv.headers.get("content-disposition")).toMatch(/attachment; filename="abcarino-leads-\d{4}-\d{2}-\d{2}\.csv"/);
    const bytes = Buffer.from(await csv.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM so Excel reads Arabic correctly
    const rows = parseCsv(bytes.subarray(3).toString("utf8"));
    expect(rows[0]).toEqual(["Received", "Name", "Phone", "Email", "Interest", "Preferred contact", "Language", "Status", "Message"]);
    expect(rows[1][1]).toBe(name);
  });

  test("CSV export neutralises spreadsheet formulas", async () => {
    const tag = uniq("csv");
    const dangerous = ["=HYPERLINK(\"http://evil\",\"x\")", "+1+1", "-2+3", "@SUM(A1:A2)", "\t=1+1", "\r=1+1", `=cmd|' /C calc'!A0`];
    for (const [i, value] of dangerous.entries()) {
      await sql`insert into leads (name, phone, email, message, project_type) values (${value}, ${"+201000000" + i}, ${`${tag}-${i}@x.io`}, ${value}, ${tag})`;
    }
    await sql`insert into leads (name, phone, message, project_type) values (${'He said "hi", then left'}, '0100', ${"line1\nline2"}, ${tag})`;
    const text = await (await fetch(`${BASE_URL}/api/admin/leads/export?q=${tag}`, { headers: { Cookie: admin.cookie } })).text();
    // Search matches name/email/phone; tagged by email for the dangerous rows.
    const rows = parseCsv(text.replace(/^\uFEFF/, "")).slice(1);
    const byEmail = new Map(rows.map((r) => [r[3], r]));
    for (const [i, value] of dangerous.entries()) {
      const row = byEmail.get(`${tag}-${i}@x.io`)!;
      expect(row, value).toBeTruthy();
      for (const cell of [row[1], row[8]]) {
        expect(cell.startsWith("'"), `"${cell}" must be neutralised`).toBe(true);
        expect(cell.slice(1)).toBe(value);
      }
      expect(row[2].startsWith("'+"), "phone numbers starting with + are also prefixed").toBe(true);
    }
    const all = await (await fetch(`${BASE_URL}/api/admin/leads/export`, { headers: { Cookie: admin.cookie } })).text();
    const quoted = parseCsv(all.replace(/^\uFEFF/, "")).find((r) => r[1] === 'He said "hi", then left');
    expect(quoted?.[8]).toBe("line1\nline2");
  });

  test("malformed and abusive submissions are rejected server-side", async () => {
    const send = (values: Record<string, string>, ip: string) =>
      callAction("submitLead", [{ status: "idle" }, form({ locale: "en", sourcePath: "/en/contact", preferredContact: "whatsapp", started_at: String(Date.now() - 5000), ...values })], { path: "/en/contact", headers: { "X-Forwarded-For": ip } });
    const r1 = await send({ name: "", phone: "+201000000000" }, "198.51.100.10");
    expect((r1.result as { fields?: Record<string, boolean> }).fields?.name).toBe(true);
    const r2 = await send({ name: "Ali", phone: "", email: "" }, "198.51.100.11");
    expect((r2.result as { fields?: Record<string, boolean> }).fields?.contact).toBe(true);
    const r3 = await send({ name: "Ali", email: "not-an-email" }, "198.51.100.12");
    expect((r3.result as { fields?: Record<string, boolean> }).fields?.email).toBe(true);
    const r4 = await send({ name: "Ali", phone: "+201000000000", message: "x".repeat(3001) }, "198.51.100.13");
    expect((r4.result as { fields?: Record<string, boolean> }).fields?.message).toBe(true);
    const r5 = await send({ name: "Ali", phone: "+201000000000", preferredContact: "fax" }, "198.51.100.14");
    expect((r5.result as { error?: string }).error).toBe("generic"); // regression: used to fail silently
    // Bots filling the form in under 2.5 s are silently accepted but not stored.
    const bot = uniq("FastBot");
    await send({ name: bot, phone: "+201000000000", started_at: String(Date.now()) }, "198.51.100.15");
    expect(await sql`select 1 from leads where name=${bot}`).toHaveLength(0);
    // Rate limit: 5 per 10 minutes per client address.
    const ip = "198.51.100.99";
    const statuses: string[] = [];
    for (let i = 0; i < 6; i++) statuses.push(((await send({ name: `Flood ${i}`, phone: "+201000000000" }, ip)).result as { status: string; error?: string }).error ?? "ok");
    expect(statuses).toEqual(["ok", "ok", "ok", "ok", "ok", "rate"]);
  });
});

test.describe("settings propagation (admin → public, both languages, fresh sessions)", () => {
  test.describe.configure({ mode: "serial" });
  const save = (group: string, values: Record<string, string | boolean>) =>
    callAction("saveSettings", [group, { ok: false }, form(values)], { cookie: admin.cookie, path: "/admin/settings" }).then((r) => {
      expect((r.result as { ok: boolean }).ok, `${group}: ${JSON.stringify(r.result)}`).toBe(true);
    });
  test.afterAll(async () => {
    await sql`delete from settings`;
    await callAction("saveSettings", ["sections", { ok: false }, form({ showPackages: true, showPackagePrices: true, showComingSoon: true })], { cookie: admin.cookie, path: "/admin/settings" });
  });

  test("contact, WhatsApp, CTA and consultation wording", async ({ browser }) => {
    await save("contact", { whatsappNumber: "+20 111 222 3333", whatsappMessageEn: "Hi from EN", whatsappMessageAr: "مرحبا من AR", email: "team@abcarino.test", phone: "+20 2 1234 5678", addressEn: "New Cairo, Egypt", addressAr: "القاهرة الجديدة، مصر", mapUrl: "https://maps.example.com/abc", businessHoursEn: "Sun–Thu 10:00–18:00", businessHoursAr: "الأحد–الخميس ١٠:٠٠–١٨:٠٠" });
    await save("cta", { primaryLabelEn: "Chat on WhatsApp", primaryLabelAr: "راسلنا على واتساب", secondaryLabelEn: "Book a visit", secondaryLabelAr: "احجز زيارة", consultationNoteEn: "Site visits are paid and deducted from the project.", consultationNoteAr: "زيارة الموقع مدفوعة وتُخصم من قيمة المشروع." });
    const ctx = await anon(browser);
    const p = await ctx.newPage();
    await p.goto("/en");
    const wa = p.getByRole("banner").getByRole("link", { name: "Chat on WhatsApp" });
    await expect(wa).toHaveAttribute("href", "https://wa.me/201112223333?text=Hi%20from%20EN");
    await expect(p.getByText("Site visits are paid and deducted from the project.").first()).toBeVisible();
    await p.goto("/ar/contact");
    await expect(p.locator("main").getByRole("link", { name: "راسلنا على واتساب" })).toHaveAttribute("href", `https://wa.me/201112223333?text=${encodeURIComponent("مرحبا من AR")}`);
    for (const text of ["team@abcarino.test", "القاهرة الجديدة، مصر", "الأحد–الخميس ١٠:٠٠–١٨:٠٠", "زيارة الموقع مدفوعة وتُخصم من قيمة المشروع."]) {
      await expect(p.locator("main").getByText(text).first(), text).toBeVisible();
    }
    await expect(p.locator("main").getByRole("link", { name: "افتح الخريطة" })).toHaveAttribute("href", "https://maps.example.com/abc");
    await expect(p.getByRole("contentinfo").getByText("+20 2 1234 5678")).toBeVisible();
    await p.reload();
    await expect(p.locator("main").getByText("team@abcarino.test").first()).toBeVisible();
    await ctx.close();
  });

  test("homepage, about, footer and social copy in both languages", async ({ browser }) => {
    await save("pages", { heroTitleEn: "Comfort, engineered.", heroTitleAr: "الراحة، بهندسة دقيقة.", heroSubtitleEn: "Sub EN", heroSubtitleAr: "نص فرعي", statementEn: "Statement EN", statementAr: "البيان", aboutIntroEn: "About intro EN", aboutIntroAr: "مقدمة من نحن" });
    await save("footer", { statementEn: "Footer EN", statementAr: "تذييل", legalEn: "CR 12345", legalAr: "س.ت ١٢٣٤٥" });
    await save("social", { instagram: "https://instagram.com/abcarino", linkedin: "https://linkedin.com/company/abcarino" });
    const ctx = await anon(browser);
    const p = await ctx.newPage();
    await p.goto("/en");
    await expect(p.getByRole("heading", { level: 1 })).toHaveText("Comfort, engineered.");
    await expect(p.getByText("Statement EN")).toBeVisible();
    await expect(p.getByRole("contentinfo").getByText("Footer EN")).toBeVisible();
    await expect(p.getByRole("contentinfo").getByText("CR 12345")).toBeVisible();
    await expect(p.getByRole("contentinfo").getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", "https://instagram.com/abcarino");
    await p.goto("/ar");
    await expect(p.getByRole("heading", { level: 1 })).toHaveText("الراحة، بهندسة دقيقة.");
    await expect(p.getByRole("contentinfo").getByText("س.ت ١٢٣٤٥")).toBeVisible();
    await p.goto("/ar/about");
    await expect(p.getByText("مقدمة من نحن")).toBeVisible();
    await ctx.close();
  });

  test("SEO defaults and the indexing switch", async ({ browser }) => {
    await save("seo", { titleEn: "ABCARINO | Smart spaces", titleAr: "عبقرينو | مساحات ذكية", descriptionEn: "Desc EN", descriptionAr: "وصف", allowIndexing: true, googleVerification: "gv-token-123" });
    const ctx = await anon(browser);
    const p = await ctx.newPage();
    await p.goto("/en");
    await expect(p).toHaveTitle("ABCARINO | Smart spaces");
    await expect(p.locator('meta[name="description"]')).toHaveAttribute("content", "Desc EN");
    await expect(p.locator('meta[name="google-site-verification"]')).toHaveAttribute("content", "gv-token-123");
    await p.goto("/ar");
    await expect(p).toHaveTitle("عبقرينو | مساحات ذكية");
    await save("seo", { titleEn: "ABCARINO | Smart spaces", titleAr: "عبقرينو", descriptionEn: "Desc EN", descriptionAr: "وصف", allowIndexing: false });
    await p.goto("/en/solutions");
    await expect(p.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await (await fetch(`${BASE_URL}/robots.txt`)).text()).toContain("Disallow: /");
    expect(await (await fetch(`${BASE_URL}/sitemap.xml`)).text()).not.toContain("<loc>");
    await save("seo", { titleEn: "ABCARINO — Intelligent Technology Solutions", titleAr: "عبقرينو — حلول تقنية ذكية", descriptionEn: "d", descriptionAr: "و", allowIndexing: true });
    await p.goto("/en/solutions");
    await expect(p.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
    await ctx.close();
  });

  test("section visibility and price display", async ({ browser }) => {
    await sql`update packages set pricing_mode='fixed', price=12345 where slug='smart-lighting-essentials'`;
    await save("sections", { showPackages: true, showPackagePrices: true, showComingSoon: true });
    const ctx = await anon(browser);
    const p = await ctx.newPage();
    await p.goto("/en/packages/smart-lighting-essentials");
    await expect(p.getByText(/12,345/).first()).toBeVisible();
    await save("sections", { showPackages: true, showPackagePrices: false, showComingSoon: true });
    await p.reload();
    await expect(p.locator("main")).not.toContainText("12,345");
    await save("sections", { showPackages: false, showPackagePrices: false, showComingSoon: false });
    await p.goto("/en");
    await expect(p.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Packages" })).toHaveCount(0);
    expect((await p.goto("/en/packages"))?.status()).toBe(404);
    expect((await p.goto("/ar/solutions/home-cinema"))?.status()).toBe(404); // coming soon hidden
    const sitemap = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
    expect(sitemap).not.toContain("/packages");
    expect(sitemap).not.toContain("home-cinema");
    await p.goto("/en/solutions");
    await expect(p.getByText("Home Cinema")).toHaveCount(0);
    await save("sections", { showPackages: true, showPackagePrices: true, showComingSoon: true });
    await sql`update packages set pricing_mode='contact', price=null where slug='smart-lighting-essentials'`;
    await ctx.close();
  });

  test("default language applies only when the browser prefers neither English nor Arabic", async ({ browser }) => {
    await save("localization", { defaultLocale: "ar" });
    const go = async (acceptLanguage: string) => {
      const res = await fetch(`${BASE_URL}/`, { headers: { "Accept-Language": acceptLanguage }, redirect: "manual" });
      return res.headers.get("location");
    };
    expect(await go("fr-FR,fr;q=0.9")).toMatch(/\/ar$/);
    expect(await go("en-GB,en;q=0.9")).toMatch(/\/en$/);
    const ctx = await anon(browser);
    const p = await ctx.newPage();
    await p.goto("/en/about");
    await expect(p.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", `${BASE_URL}/ar/about`);
    await save("localization", { defaultLocale: "en" });
    expect(await go("fr-FR")).toMatch(/\/en$/);
    await ctx.close();
  });

  test("maintenance page in both languages", async ({ browser }) => {
    await save("maintenance", { enabled: true, messageEn: "Back at 9pm", messageAr: "نعود الساعة ٩ مساءً" });
    try {
      const ctx = await anon(browser);
      const p = await ctx.newPage();
      await p.goto("/en/solutions");
      await expect(p.getByText("Back at 9pm")).toBeVisible();
      await p.goto("/ar");
      await expect(p.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(p.getByText("نعود الساعة ٩ مساءً")).toBeVisible();
      await ctx.close();
    } finally {
      await save("maintenance", { enabled: false, messageEn: "x", messageAr: "x" });
    }
  });
});
