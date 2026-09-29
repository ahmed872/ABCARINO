import { expect, test } from "@playwright/test";

const PAGES = ["/en", "/ar", "/en/solutions", "/ar/solutions/smart-homes", "/en/packages", "/ar/packages/smart-lighting-essentials", "/en/about", "/ar/contact"];

test.describe("mobile layout", () => {
  for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("mobile menu opens, navigates and closes", async ({ page }) => {
    await page.goto("/ar");
    await page.getByRole("button", { name: "القائمة" }).click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "الباقات" }).click();
    await expect(page).toHaveURL(/\/ar\/packages$/);
    await expect(menu).toBeHidden();
  });

  test("desktop navigation is replaced by the menu button", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
  });
});
