import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

test.use({ storageState: ADMIN_STATE });

/** Visitor contexts must opt out of the admin storage state applied by test.use. */
const ANON = { storageState: { cookies: [], origins: [] } };

async function pngFile() {
  const buffer = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#d9d4c9" } }).png().toBuffer();
  return { name: "living-room.png", mimeType: "image/png", buffer };
}

test.describe("media & settings", () => {
  test("upload an image, attach it to a solution, and it replaces the illustration", async ({ page, browser }) => {
    await page.goto("/admin/media");
    await page.locator('input[type="file"]').setInputFiles(await pngFile());
    await expect(page.getByText("living-room.png")).toBeVisible({ timeout: 15_000 });

    await page.getByText("living-room.png").click();
    await page.fill("#altEn", "Warm living room lighting");
    await page.fill("#altAr", "إضاءة دافئة لغرفة المعيشة");
    await page.getByLabel(/Inspiration \/ stock image/).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    const url = await page.getByLabel("Public URL").inputValue();
    expect(url).toMatch(/^\/media\/[0-9a-f-]{36}\.webp$/);
    await page.getByRole("button", { name: "Close" }).click();

    const res = await page.request.get(url);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/webp");
    expect(res.headers()["cache-control"]).toContain("immutable");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");

    await page.goto("/admin/solutions");
    await page.getByRole("link", { name: "Home Automation" }).click();
    await page.getByRole("button", { name: "Choose image" }).click();
    await page.getByRole("dialog").getByRole("button").filter({ has: page.locator('img[alt="Warm living room lighting"]') }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved. Changes are live on the website.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    await v.goto("/en/solutions/home-automation");
    await expect(v.locator('img[alt="Warm living room lighting"]').first()).toBeVisible();
    await expect(v.getByText("Inspiration").first()).toBeVisible();
    await v.goto("/ar/solutions/home-automation");
    await expect(v.locator('img[alt="إضاءة دافئة لغرفة المعيشة"]').first()).toBeVisible();
    await visitor.close();

    // An image in use cannot be deleted.
    await page.goto("/admin/media");
    await page.getByText("living-room.png").click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/still used by: Solution: Home Automation/)).toBeVisible();
  });

  test("upload endpoint rejects non-images and unauthenticated requests", async ({ page, playwright }) => {
    const bad = await page.request.post("/api/admin/media", {
      headers: { origin: "http://localhost:3100" },
      multipart: { file: { name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<?php system($_GET['c']); ?>") } },
    });
    expect(bad.status()).toBe(422);

    const crossSite = await page.request.post("/api/admin/media", {
      headers: { origin: "https://evil.example" },
      multipart: { file: await pngFile() },
    });
    expect(crossSite.status()).toBe(403);

    const anon = await playwright.request.newContext({ baseURL: "http://localhost:3100", ...ANON });
    const r = await anon.post("/api/admin/media", { headers: { origin: "http://localhost:3100" }, multipart: { file: await pngFile() } });
    expect(r.status()).toBe(403);
    expect((await anon.get("/api/admin/media")).status()).toBe(401);
    expect((await anon.get("/media/../../etc/passwd")).status()).toBe(404);
    await anon.dispose();
  });

  test("WhatsApp number from settings powers every CTA", async ({ page, browser }) => {
    await page.goto("/admin/settings");
    const contact = page.locator("#contact");
    await contact.locator('input[name="whatsappNumber"]').fill("abc");
    await contact.getByRole("button", { name: "Save changes" }).click();
    await expect(contact.getByText("Use the full international number").first()).toBeVisible();
    await contact.locator('input[name="whatsappNumber"]').fill("+20 100 000 0000");
    await contact.locator('input[name="email"]').fill("hello@abcarino.test");
    await contact.getByRole("button", { name: "Save changes" }).click();
    await expect(contact.getByText("Saved. The website has been updated.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    await v.goto("/en");
    const wa = v.getByRole("banner").getByRole("link", { name: "Talk to us on WhatsApp" });
    await expect(wa).toBeVisible();
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/201000000000\?text=/);
    await expect(wa).toHaveAttribute("rel", /noopener/);
    await v.goto("/ar/contact");
    await expect(v.locator("main").getByRole("link", { name: "hello@abcarino.test" })).toBeVisible();
    await expect(v.getByRole("contentinfo").getByRole("link", { name: "hello@abcarino.test" })).toBeVisible();
    await visitor.close();
  });

  test("maintenance mode hides the site from visitors but not from admins", async ({ page, browser }) => {
    await page.goto("/admin/settings");
    const m = page.locator("#maintenance");
    await m.getByLabel("Enable maintenance mode").check();
    await m.getByRole("button", { name: "Save changes" }).click();
    await expect(m.getByText("Saved. The website has been updated.")).toBeVisible();

    const visitor = await browser.newContext(ANON);
    const v = await visitor.newPage();
    try {
      await v.goto("/en");
      await expect(v.getByRole("heading", { name: "We’ll be right back." })).toBeVisible();
      expect(await (await v.request.get("/robots.txt")).text()).toContain("Disallow: /");

      await page.goto("/en");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("The future, made comfortable.");
    } finally {
      await page.goto("/admin/settings");
      await m.getByLabel("Enable maintenance mode").uncheck();
      await m.getByRole("button", { name: "Save changes" }).click();
      await expect(m.getByText("Saved. The website has been updated.")).toBeVisible();
    }
    await v.goto("/en");
    await expect(v.getByRole("heading", { level: 1 })).toHaveText("The future, made comfortable.");
    await visitor.close();
  });

  test("activity log records changes", async ({ page }) => {
    await page.goto("/admin/activity");
    await expect(page.getByText("settings.update").first()).toBeVisible();
    await expect(page.getByText("auth.login").first()).toBeVisible();
  });
});
