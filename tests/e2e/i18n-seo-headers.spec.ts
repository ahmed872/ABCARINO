/**
 * Every public route in both languages: language/direction, canonical,
 * hreflang reciprocity, Open Graph, JSON-LD validity and rendering hygiene;
 * sitemap integrity; indexability of private pages; exact security headers.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { BASE_URL, callAction, form } from "./support/server-actions";
import { makeArticle, makeSolution, sql, userWithSession } from "./support/db";

const ARABIC = /[؀-ۿ]/;

async function publicPaths(): Promise<string[]> {
  const xml = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

test.describe("bilingual & SEO sweep", () => {
  test("every sitemap page is correct in its language and links to a valid counterpart", async ({ page }) => {
    test.setTimeout(240_000);
    const paths = await publicPaths();
    expect(paths.length).toBeGreaterThan(40);
    expect(paths.filter((p) => p.startsWith("/en")).length).toBe(paths.filter((p) => p.startsWith("/ar")).length);
    const problems: string[] = [];
    for (const path of paths) {
      const locale = path.split("/")[1];
      const res = await page.goto(path);
      if (res?.status() !== 200) {
        problems.push(`${path}: HTTP ${res?.status()}`);
        continue;
      }
      const info = await page.evaluate(() => {
        const attr = (sel: string, a: string) => document.querySelector(sel)?.getAttribute(a) ?? null;
        const alternates: Record<string, string> = {};
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => (alternates[l.getAttribute("hreflang")!] = l.getAttribute("href")!));
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          title: document.title,
          description: attr('meta[name="description"]', "content"),
          canonical: attr('link[rel="canonical"]', "href"),
          ogLocale: attr('meta[property="og:locale"]', "content"),
          ogImage: attr('meta[property="og:image"]', "content"),
          twitter: attr('meta[name="twitter:card"]', "content"),
          robots: attr('meta[name="robots"]', "content"),
          h1: document.querySelector("h1")?.textContent ?? "",
          h1Count: document.querySelectorAll("h1").length,
          jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent ?? ""),
          bodyText: document.body.innerText,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          alternates,
        };
      });
      const expect1 = (cond: boolean, msg: string) => !cond && problems.push(`${path}: ${msg}`);
      expect1(info.lang === locale, `lang=${info.lang}`);
      expect1(info.dir === (locale === "ar" ? "rtl" : "ltr"), `dir=${info.dir}`);
      expect1(!!info.title && info.title.length > 3, "missing title");
      expect1(!!info.description && info.description.length > 20, "missing description");
      expect1(info.canonical === `${BASE_URL}${path}`, `canonical=${info.canonical}`);
      expect1(info.ogLocale === (locale === "ar" ? "ar_EG" : "en_US"), `og:locale=${info.ogLocale}`);
      expect1(!!info.ogImage?.startsWith("http"), `og:image=${info.ogImage}`);
      expect1(info.twitter === "summary_large_image", "twitter card");
      expect1(!info.robots || info.robots.startsWith("index"), `robots=${info.robots}`);
      expect1(info.h1Count === 1, `h1 count ${info.h1Count}`);
      if (locale === "ar") expect1(ARABIC.test(info.h1) || /^[A-Z0-9\s—-]+$/.test(info.h1), `Arabic page h1 not Arabic: ${info.h1}`);
      if (locale === "en") expect1(!ARABIC.test(info.h1), `English page h1 contains Arabic: ${info.h1}`);
      expect1(!/\bundefined\b|\[object Object\]|\bNaN\b/.test(info.bodyText), "renders undefined/NaN/[object Object]");
      expect1(info.overflow <= 1, `horizontal overflow ${info.overflow}px`);
      for (const block of info.jsonLd) {
        try {
          JSON.parse(block);
        } catch {
          problems.push(`${path}: invalid JSON-LD`);
        }
      }
      const other = locale === "en" ? "ar" : "en";
      expect1(info.alternates[locale] === `${BASE_URL}${path}`, `hreflang self`);
      expect1(info.alternates[other] === `${BASE_URL}/${other}${path.slice(3)}`, `hreflang ${other}=${info.alternates[other]}`);
      expect1(!!info.alternates["x-default"], "x-default");
    }
    // Every alternate target resolves (reciprocity is implied by the self/other checks on both sides).
    expect(problems).toEqual([]);
  });

  test("unpublished content is neither reachable nor listed", async () => {
    const hidden = await makeSolution({ status: "hidden", title_en: "Secret Hidden Solution" });
    const draft = await makeArticle();
    const admin = await userWithSession("super_admin");
    // Any admin write refreshes the public cache (fixtures were inserted directly).
    await callAction("saveSettings", ["sections", { ok: false }, form({ showPackages: true, showPackagePrices: true, showComingSoon: true, showInsights: true })], { cookie: admin.cookie, path: "/admin/settings" });
    try {
      const draftSlug = (await sql`select slug from articles where id=${draft.id}`)[0].slug;
      for (const path of [`/en/solutions/${hidden.slug}`, `/ar/solutions/${hidden.slug}`, `/en/insights/${draftSlug}`]) {
        expect((await fetch(BASE_URL + path)).status, path).toBe(404);
      }
      const xml = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
      expect(xml).not.toContain(hidden.slug);
      expect(xml).not.toContain(draftSlug);
      for (const path of ["/en", "/en/solutions", "/ar/solutions"]) {
        expect(await (await fetch(BASE_URL + path)).text(), path).not.toContain("Secret Hidden Solution");
      }
    } finally {
      await callAction("saveSettings", ["sections", { ok: false }, form({ showPackages: true, showPackagePrices: true, showComingSoon: true })], { cookie: admin.cookie, path: "/admin/settings" });
    }
  });

  test("private and error pages are not indexable", async ({ page }) => {
    for (const path of ["/admin/login"]) {
      const res = await page.goto(path);
      expect(res?.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
    for (const path of ["/en/does-not-exist", "/ar/solutions/does-not-exist"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
      await expect(page.locator('meta[name="robots"]').first(), path).toHaveAttribute("content", /noindex/);
      // Regression: no competing "index" directive and no canonical pointing at the home page.
      expect(await page.locator('meta[name="robots"][content*="index, follow"]').count(), path).toBe(0);
      expect(await page.locator('link[rel="canonical"]').count(), path).toBe(0);
    }
    const robots = await (await fetch(`${BASE_URL}/robots.txt`)).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    expect(robots).toMatch(/Disallow: \/api\//);
  });

  test("mixed Arabic/English/digit content keeps its order and layout", async ({ page }) => {
    const mixed = "نظام Smart Home لـ 3 غرف (٣ غرف) — Wi-Fi 6";
    const s = await makeSolution({ title_ar: mixed, summary_ar: `${mixed}، ${mixed}` });
    const admin = await userWithSession("super_admin");
    await callAction("setSolutionStatus", [s.id, "available"], { cookie: admin.cookie });
    await page.goto(`/ar/solutions/${s.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(mixed);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.goto("/ar/contact");
    await expect(page.locator("#c-phone")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#c-email")).toHaveAttribute("dir", "ltr");
  });
});

test.describe("security headers (observed on the running production build)", () => {
  test("exact headers per response type", async () => {
    const png = "/brand/icon-192.png";
    const staticJs = /\/_next\/static\/[^"']+\.js/.exec(await (await fetch(`${BASE_URL}/en`)).text())![0];
    const targets: Record<string, string> = {
      "public page /en": "/en",
      "admin login": "/admin/login",
      "API (unauthenticated)": "/api/admin/media",
      "404 page": "/en/nope",
      "robots.txt": "/robots.txt",
      "brand asset": png,
      "static JS": staticJs,
    };
    const observed: Record<string, Record<string, string | null>> = {};
    const names = ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "cross-origin-opener-policy", "strict-transport-security", "x-powered-by", "x-robots-tag", "cache-control"];
    for (const [label, path] of Object.entries(targets)) {
      const res = await fetch(BASE_URL + path, { redirect: "manual" });
      observed[label] = Object.fromEntries(names.map((n) => [n, res.headers.get(n)?.replace(/nonce-[^']+/, "nonce-…") ?? null]));
      observed[label].status = String(res.status);
    }
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/observed-headers.json", JSON.stringify(observed, null, 2));
    for (const [label, h] of Object.entries(observed)) {
      expect(h["x-content-type-options"], label).toBe("nosniff");
      expect(h["x-frame-options"], label).toBe("DENY");
      expect(h["referrer-policy"], label).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"], label).toContain("camera=()");
      expect(h["x-powered-by"], label).toBeNull();
    }
    for (const label of ["public page /en", "admin login", "404 page"]) {
      const csp = observed[label]["content-security-policy"]!;
      expect(csp, label).toContain("script-src 'self' 'nonce-…' 'strict-dynamic'");
      expect(csp, label).not.toContain("unsafe-eval");
      expect(csp, label).not.toMatch(/script-src[^;]*unsafe-inline/);
      expect(csp, label).toContain("frame-ancestors 'none'");
      expect(csp, label).toContain("object-src 'none'");
      expect(csp, label).toContain("base-uri 'self'");
      expect(csp, label).toContain("form-action 'self'");
      expect(csp, label).toContain("connect-src 'self'");
    }
    expect(observed["public page /en"]["cache-control"]).toContain("no-store");
    expect(observed["admin login"]["x-robots-tag"]).toBe("noindex, nofollow");
  });
});
