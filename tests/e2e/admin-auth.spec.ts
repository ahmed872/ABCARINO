import { expect, test } from "@playwright/test";
import { e2eEnv } from "../../playwright.config";
import { ADMIN_STATE } from "./global-setup";

test.describe("admin authentication & authorization", () => {
  test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/solutions");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("a forged session cookie is rejected server-side", async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "abc_session", value: "forged-token-value", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await ctx.close();
  });

  test("wrong credentials show a generic error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", e2eEnv.ADMIN_EMAIL);
    await page.fill("#password", "definitely-wrong-password");
    await page.click("button[type=submit]");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await page.fill("#email", "nobody@abcarino.test");
    await page.fill("#password", "definitely-wrong-password");
    await page.click("button[type=submit]");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("session cookie is HttpOnly and SameSite", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: ADMIN_STATE });
    const cookie = (await ctx.cookies()).find((c) => c.name === "abc_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    await ctx.close();
  });

  test("roles restrict access: an editor cannot reach settings, users or leads", async ({ browser }) => {
    const admin = await browser.newContext({ storageState: ADMIN_STATE });
    const a = await admin.newPage();
    await a.goto("/admin/users/new");
    await a.fill('input[name="name"]', "Eddie Editor");
    await a.fill('input[name="email"]', "editor@abcarino.test");
    await a.selectOption('select[name="role"]', "editor");
    await a.fill('input[name="password"]', "Tidal-Orbit-Lamp-77");
    await a.getByRole("button", { name: "Create user" }).click();
    await expect(a.getByText("User created.")).toBeVisible();
    await admin.close();

    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto("/admin/login");
    await p.fill("#email", "editor@abcarino.test");
    await p.fill("#password", "Tidal-Orbit-Lamp-77");
    await p.click("button[type=submit]");
    await p.waitForURL("**/admin");
    const nav = p.getByRole("navigation", { name: "Admin" }).first();
    await expect(nav.getByRole("link", { name: "Solutions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Settings" })).toHaveCount(0);
    for (const path of ["/admin/settings", "/admin/users", "/admin/leads", "/admin/activity"]) {
      await p.goto(path);
      await expect(p, path).toHaveURL(/\/admin\?denied=1$/);
    }
    // Editors cannot delete content.
    await p.goto("/admin/solutions");
    await expect(p.getByRole("button", { name: "Delete" })).toHaveCount(0);
    // API is protected too.
    expect((await p.request.get("/api/admin/leads/export")).status()).toBe(401);
    await ctx.close();
  });

  test("sign out ends the session", async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto("/admin/login");
    await p.fill("#email", "editor@abcarino.test");
    await p.fill("#password", "Tidal-Orbit-Lamp-77");
    await p.click("button[type=submit]");
    await p.waitForURL("**/admin");
    const cookieBefore = (await ctx.cookies()).find((c) => c.name === "abc_session")!;
    await p.getByRole("button", { name: "Sign out" }).first().click();
    await expect(p).toHaveURL(/\/admin\/login$/);
    // Replaying the old cookie no longer works.
    const replay = await browser.newContext();
    await replay.addCookies([cookieBefore]);
    const r = await replay.newPage();
    await r.goto("/admin");
    await expect(r).toHaveURL(/\/admin\/login$/);
    await replay.close();
    await ctx.close();
  });
});
