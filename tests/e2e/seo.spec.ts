import { expect, test } from "@playwright/test";

test.describe("SEO", () => {
  test("pages have canonical, hreflang, OG and Twitter metadata", async ({ page }) => {
    await page.goto("/en/solutions/smart-lighting");
    await expect(page).toHaveTitle(/Smart Lighting — ABCARINO/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3100/en/solutions/smart-lighting");
    await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute("href", "http://localhost:3100/ar/solutions/smart-lighting");
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Smart Lighting/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
  });

  test("Arabic metadata is Arabic", async ({ page }) => {
    await page.goto("/ar/about");
    await expect(page).toHaveTitle(/من نحن — عبقرينو/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ar_EG");
  });

  test("structured data describes the organization honestly", async ({ page }) => {
    await page.goto("/en");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const data = blocks.flatMap((b) => JSON.parse(b));
    const org = data.find((d: { "@type": string }) => d["@type"] === "Organization");
    expect(org.name).toBe("ABCARINO");
    expect(org.alternateName).toBe("عبقرينو");
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review/i);
  });

  test("sitemap lists both languages and no hidden content", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("http://localhost:3100/en/solutions/smart-lighting");
    expect(xml).toContain("http://localhost:3100/ar/solutions/smart-lighting");
    expect(xml).toContain('hreflang="ar"');
    expect(xml).not.toContain("/projects");
    expect(xml).not.toContain("/admin");
  });

  test("robots.txt blocks the admin and points to the sitemap", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("Sitemap: http://localhost:3100/sitemap.xml");
  });

  test("admin is never indexable", async ({ request }) => {
    const res = await request.get("/admin/login");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});
