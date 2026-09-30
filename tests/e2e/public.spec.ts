import { expect, test } from "@playwright/test";

test.describe("public website", () => {
  test("root redirects to the browser language", async ({ page, browser }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    const ar = await browser.newContext({ locale: "ar-EG", extraHTTPHeaders: { "Accept-Language": "ar-EG,ar;q=0.9" } });
    const p2 = await ar.newPage();
    await p2.goto("/");
    await expect(p2).toHaveURL(/\/ar$/);
    await ar.close();
  });

  test("root redirect never leaks the server's own host (reverse proxy / Docker)", async ({ baseURL }) => {
    // Behind Caddy/nginx the app sees its bind address (e.g. 0.0.0.0:3000); the public
    // host arrives in the Host header. Every redirect must stay on the public host.
    const internal = new URL(baseURL!).host;
    for (const path of ["/", "/?utm_source=x", "/solutions"]) {
      const res = await fetch(`${baseURL}${path}`, {
        redirect: "manual",
        headers: { host: "abcarino.example", "x-forwarded-proto": "https", "accept-language": "ar" },
      });
      expect(res.status, path).toBe(307);
      const location = res.headers.get("location")!;
      expect(location, path).not.toContain(internal);
      const resolved = new URL(location, "https://abcarino.example");
      expect(resolved.host, path).toBe("abcarino.example");
      expect(resolved.pathname, path).toMatch(/^\/ar(\/solutions)?$/);
      if (path.includes("utm")) expect(resolved.search, path).toBe("?utm_source=x");
    }
  });

  test("locale-less paths redirect", async ({ page }) => {
    await page.goto("/solutions");
    await expect(page).toHaveURL(/\/en\/solutions$/);
  });

  test("English home communicates the brand", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The future, made comfortable.");
    await expect(page.getByRole("link", { name: /ABCARINO — Home/ })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Solutions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Packages" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    // Prepared sections are not in the navigation until activated.
    await expect(page.getByRole("link", { name: "Projects" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Partners" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Insights" })).toHaveCount(0);
  });

  test("Arabic home is right-to-left with Arabic content", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("المستقبل، بكل راحة.");
    await expect(page.getByRole("navigation", { name: "التنقل الرئيسي" }).getByRole("link", { name: "الحلول" })).toBeVisible();
    // The header logo keeps the official Latin spelling.
    await expect(page.locator("header").getByText("ABCARINO", { exact: true })).toBeVisible();
    // Logical layout: the brand sits on the right in RTL.
    const box = await page.locator("header a").first().boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThan(width / 2);
  });

  test("language switch keeps the current page", async ({ page }) => {
    await page.goto("/en/solutions/smart-lighting");
    await page.locator("header").getByRole("link", { name: "Switch to Arabic" }).click();
    await expect(page).toHaveURL(/\/ar\/solutions\/smart-lighting$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("الإضاءة الذكية");
  });

  test("solutions show available and coming-soon states", async ({ page }) => {
    await page.goto("/en/solutions");
    await expect(page.getByRole("heading", { name: "Smart Living" })).toBeVisible();
    await expect(page.getByText("Coming soon").first()).toBeVisible();
    await page.goto("/en/solutions/home-cinema");
    await expect(page.getByText("This solution is being prepared")).toBeVisible();
  });

  test("seeded packages never show invented prices", async ({ page }) => {
    // The starter content must not invent prices: every seeded package is "on request" or "coming soon".
    const seeded = ["smart-lighting-essentials", "smart-home-starter", "business-website", "media-room", "home-cinema", "gaming-room", "smart-office"];
    for (const slug of seeded) {
      await page.goto(`/en/packages/${slug}`);
      const hero = page.locator("main section").first();
      await expect(hero, slug).toContainText(/Price on request|Coming soon/);
      await expect(hero, slug).not.toContainText(/EGP|\$|€/);
    }
  });

  test("prepared sections return 404 until enabled", async ({ page }) => {
    for (const path of ["/en/projects", "/en/partners", "/en/insights", "/ar/projects"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });

  test("unknown pages render a localized 404", async ({ page }) => {
    const res = await page.goto("/ar/this-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("هذه الصفحة غير موجودة")).toBeVisible();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/en");
    const h = res.headers();
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("no console errors on key pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()}: ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
    for (const path of ["/en", "/ar", "/en/solutions", "/ar/packages", "/en/about", "/ar/contact", "/en/packages/smart-home-starter"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });
});
