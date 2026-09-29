import { expect, test } from "@playwright/test";

test("crawl: every internal link on the public site resolves", async ({ page, request }) => {
  test.setTimeout(240_000);
  const seen = new Set<string>();
  const queue = ["/en", "/ar"];
  const broken: string[] = [];
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const res = await page.goto(path);
    if (!res || res.status() >= 400) {
      broken.push(`${path} → ${res?.status()}`);
      continue;
    }
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const clean = href.split("#")[0].split("?")[0];
      if (clean && !seen.has(clean) && !clean.startsWith("/admin")) queue.push(clean);
    }
    const srcs = await page.$$eval("img[src], link[rel~=icon][href]", (els) => els.map((e) => e.getAttribute("src") ?? e.getAttribute("href") ?? ""));
    for (const src of srcs) {
      if (src.startsWith("/") && !seen.has(src)) {
        seen.add(src);
        const r = await request.get(src);
        if (r.status() >= 400) broken.push(`${src} → ${r.status()} (asset on ${path})`);
      }
    }
  }
  expect(seen.size).toBeGreaterThan(40);
  expect(broken).toEqual([]);
});
