import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

test.describe("contact & leads", () => {
  test("validation errors are shown in the visitor's language", async ({ page }) => {
    await page.goto("/ar/contact");
    await page.fill("#c-name", "م");
    await page.waitForTimeout(2800);
    await page.getByRole("button", { name: "إرسال الرسالة" }).click();
    await expect(page.getByText("يُرجى إدخال اسمك.")).toBeVisible();
    await expect(page.getByText("يُرجى إضافة رقم هاتف أو بريد إلكتروني")).toBeVisible();
  });

  test("a visitor can send an enquiry that reaches the admin", async ({ page, browser }) => {
    await page.goto("/en/contact?topic=smart-lighting");
    await expect(page.locator("#c-topic")).toHaveValue("smart-lighting");
    await page.fill("#c-name", "Karim E2E");
    await page.fill("#c-phone", "+20 100 555 0101");
    await page.fill("#c-email", "karim@example.com");
    await page.fill("#c-message", "I would like dimmable lighting in two rooms.");
    await page.getByText("Phone call").click();
    await page.waitForTimeout(2800); // minimum fill time (bot protection)
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Message received")).toBeVisible();

    const admin = await browser.newContext({ storageState: ADMIN_STATE });
    const a = await admin.newPage();
    await a.goto("/admin/leads");
    await expect(a.getByRole("link", { name: "Karim E2E" })).toBeVisible();
    await a.getByRole("link", { name: "Karim E2E" }).click();
    await expect(a.getByText("I would like dimmable lighting in two rooms.")).toBeVisible();
    await a.getByPlaceholder("Call summary").fill("Called back, site visit on Sunday.");
    await a.getByRole("button", { name: "Add note" }).click();
    await expect(a.getByText("Called back, site visit on Sunday.")).toBeVisible();
    await a.getByLabel("Status").selectOption("contacted");
    await a.waitForTimeout(800);
    await a.reload();
    await expect(a.getByLabel("Status")).toHaveValue("contacted");

    const csv = await a.request.get("/api/admin/leads/export");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain("Karim E2E");
    await admin.close();
  });

  test("honeypot submissions are silently dropped", async ({ page, browser }) => {
    await page.goto("/en/contact");
    await page.fill("#c-name", "Spam Bot");
    await page.fill("#c-email", "bot@example.com");
    await page.evaluate(() => {
      (document.querySelector('input[name="company_website"]') as HTMLInputElement).value = "http://spam.example";
    });
    await page.waitForTimeout(2800);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Message received")).toBeVisible();
    const admin = await browser.newContext({ storageState: ADMIN_STATE });
    const a = await admin.newPage();
    await a.goto("/admin/leads?q=Spam");
    await expect(a.getByText("No leads match this filter")).toBeVisible();
    await admin.close();
  });

  test("lead export requires authentication", async ({ request }) => {
    const res = await request.get("/api/admin/leads/export");
    expect(res.status()).toBe(401);
  });
});
