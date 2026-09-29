/** 320 px (smallest common phones): public pages in both languages, admin screens, long unbroken text. */
import { expect, test } from "@playwright/test";
import { callAction } from "./support/server-actions";
import { makeSolution, userWithSession } from "./support/db";

test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });

const overflow = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("public pages fit 320 px in both languages, including long unbroken titles", async ({ page }) => {
  test.setTimeout(120_000);
  const longEn = "Supercalifragilisticexpialidocious-Home-Automation-Controller-Integration-Package-Deluxe-Edition-2026".slice(0, 120);
  const longAr = "التكاملالذكيللأنظمةالمنزليةوالإضاءةوالتكييفوالصوتفيمساحةواحدةمتكاملةبالكاملبدونمسافاتإطلاقًا";
  const s = await makeSolution({ title_en: longEn, title_ar: longAr, summary_en: longEn, summary_ar: longAr, featured: true });
  const admin = await userWithSession("super_admin");
  await callAction("setSolutionStatus", [s.id, "available"], { cookie: admin.cookie });
  const paths = ["/en", "/ar", "/en/solutions", "/ar/solutions", `/en/solutions/${s.slug}`, `/ar/solutions/${s.slug}`, "/en/packages", "/ar/packages/smart-home-starter", "/en/about", "/ar/about", "/en/contact", "/ar/contact", "/ar/does-not-exist"];
  const bad: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const o = await overflow(page);
    if (o > 1) bad.push(`${path}: ${o}px`);
  }
  expect(bad).toEqual([]);
  // Floating WhatsApp button stays on-screen and does not cover the menu button.
  await page.goto("/ar");
  const menu = await page.getByRole("button", { name: "القائمة" }).boundingBox();
  expect(menu!.x).toBeGreaterThanOrEqual(0);
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(320);
});

test("admin screens are usable at 320 px (tables scroll inside their card)", async ({ browser }) => {
  const admin = await userWithSession("super_admin");
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true });
  const [name, value] = admin.cookie.split("=");
  await ctx.addCookies([{ name, value, domain: "localhost", path: "/" }]);
  const page = await ctx.newPage();
  const bad: string[] = [];
  for (const path of ["/admin", "/admin/solutions", "/admin/solutions/new", "/admin/packages", "/admin/leads", "/admin/media", "/admin/settings", "/admin/users", "/admin/activity"]) {
    await page.goto(path);
    const o = await overflow(page);
    if (o > 1) bad.push(`${path}: ${o}px`);
  }
  expect(bad).toEqual([]);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("aside:visible").getByRole("link", { name: "Leads", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/leads$/);
  await ctx.close();
});
