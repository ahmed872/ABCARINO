import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

test.use({ storageState: ADMIN_STATE });

/** Visitor contexts must opt out of the admin storage state applied by test.use. */
const ANON = { storageState: { cookies: [], origins: [] } };

test.describe("content management", () => {
  test("create a hidden solution, publish it, and see it in both languages", async ({ page, browser }) => {
    await page.goto("/admin/solutions/new");
    await page.fill('input[name="titleEn"]', "Smart Garden");
    await page.fill('input[name="titleAr"]', "الحديقة الذكية");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator('input[name="slug"]')).toHaveValue("smart-garden");
    await page.fill('textarea[name="summaryEn"]', "Irrigation and garden lighting that look after themselves.");
    await page.fill('textarea[name="summaryAr"]', "ري وإضاءة للحديقة تعتني بنفسها.");
    await page.getByText("Hidden", { exact: true }).click();
    await page.getByRole("button", { name: "+ Add item" }).click();
    await page.getByPlaceholder("English").first().fill("Smart irrigation schedules");
    await page.getByPlaceholder("العربية").first().fill("جداول ري ذكية");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Solution created.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    expect((await v.goto("/en/solutions/smart-garden"))?.status()).toBe(404);

    await page.goto("/admin/solutions");
    const row = page.getByRole("row", { name: /Smart Garden/ });
    await row.getByLabel("Status").selectOption("available");
    await page.waitForTimeout(800);

    expect((await v.goto("/en/solutions/smart-garden"))?.status()).toBe(200);
    await expect(v.getByRole("heading", { level: 1 })).toHaveText("Smart Garden");
    await expect(v.getByText("Smart irrigation schedules")).toBeVisible();
    await v.goto("/ar/solutions/smart-garden");
    await expect(v.getByRole("heading", { level: 1 })).toHaveText("الحديقة الذكية");
    await expect(v.getByText("جداول ري ذكية")).toBeVisible();

    // Coming soon → Available without code: switch back and forth.
    await row.getByLabel("Status").selectOption("coming_soon");
    await page.waitForTimeout(800);
    await v.goto("/en/solutions/smart-garden");
    await expect(v.getByText("This solution is being prepared")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Solution deleted.")).toBeVisible();
    expect((await v.goto("/en/solutions/smart-garden"))?.status()).toBe(404);
    await visitor.close();
  });

  test("slug validation and uniqueness", async ({ page }) => {
    await page.goto("/admin/solutions/new");
    await page.fill('input[name="titleEn"]', "Duplicate");
    await page.fill('input[name="titleAr"]', "مكرر");
    await page.fill('input[name="slug"]', "smart-lighting");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("This slug is already in use.").first()).toBeVisible();
    await page.fill('input[name="slug"]', "Bad Slug!");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Use lowercase letters, numbers and single hyphens").first()).toBeVisible();
  });

  test("package pricing modes", async ({ page, browser }) => {
    await page.goto("/admin/packages");
    await page.getByRole("link", { name: "Smart Home Starter" }).click();
    await page.getByText("Fixed price", { exact: true }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("A price is required for this pricing mode").first()).toBeVisible();
    await page.getByText("Starting from", { exact: true }).click();
    await page.fill('input[name="price"]', "45000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved. Changes are live on the website.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    await v.goto("/en/packages/smart-home-starter");
    await expect(v.getByText("Starting from").first()).toBeVisible();
    await expect(v.getByText(/EGP\s?45,000/).first()).toBeVisible();

    await page.getByText("Price on request", { exact: true }).click();
    await page.fill('input[name="price"]', "");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved. Changes are live on the website.")).toBeVisible();
    await v.reload();
    await expect(v.locator("main")).not.toContainText("45,000");
    await visitor.close();
  });

  test("reorder solutions", async ({ page }) => {
    await page.goto("/admin/solutions");
    const titles = () => page.locator("tbody tr td:nth-child(2) a").allTextContents();
    const before = await titles();
    await page.locator("tbody tr").nth(1).getByLabel("Move up").click();
    await page.waitForTimeout(800);
    await page.reload();
    const after = await titles();
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    await page.locator("tbody tr").nth(1).getByLabel("Move up").click();
    await page.waitForTimeout(800);
  });

  test("projects, partners and articles can be prepared and activated", async ({ page, browser }) => {
    await page.goto("/admin/articles/new");
    await page.fill('input[name="titleEn"]', "Planning smart lighting");
    await page.fill('input[name="titleAr"]', "التخطيط للإضاءة الذكية");
    await page.getByRole("button", { name: "Generate" }).click();
    await page.fill('textarea[name="bodyEn"]', "## Start with rooms\n\nThink about **scenes**, not switches.\n\n- Living\n- Bedroom");
    await page.getByText("Published", { exact: true }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Article created.")).toBeVisible();

    await page.goto("/admin/settings");
    const sections = page.locator("#sections");
    await sections.getByLabel("Show Insights (articles)").check();
    await sections.getByRole("button", { name: "Save changes" }).click();
    await expect(sections.getByText("Saved. The website has been updated.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    await v.goto("/en");
    await expect(v.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Insights" })).toBeVisible();
    await v.goto("/en/insights/planning-smart-lighting");
    await expect(v.getByRole("heading", { name: "Start with rooms" })).toBeVisible();
    await expect(v.locator("strong", { hasText: "scenes" })).toBeVisible();
    await v.goto("/ar/insights/planning-smart-lighting");
    await expect(v.getByRole("heading", { level: 1 })).toHaveText("التخطيط للإضاءة الذكية");

    await sections.getByLabel("Show Insights (articles)").uncheck();
    await sections.getByRole("button", { name: "Save changes" }).click();
    await expect(sections.getByText("Saved. The website has been updated.")).toBeVisible();
    expect((await v.goto("/en/insights"))?.status()).toBe(404);
    await visitor.close();
  });
});
