import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetTestDatabase } from "../support/test-db";
import { closeDb } from "@/lib/db";
import { articles, categories, packageSolutions, packages, solutions } from "@/lib/db/schema";
import { queryArticles, queryCatalog, querySettings } from "@/lib/content/queries";

let ids: Record<string, string> = {};

beforeAll(async () => {
  const db = await resetTestDatabase();
  const [cat] = await db.insert(categories).values({ slug: "smart-living", nameEn: "Smart Living", nameAr: "المعيشة الذكية" }).returning();
  const sol = await db
    .insert(solutions)
    .values([
      { slug: "lit", titleEn: "Lighting", titleAr: "إضاءة", status: "available", categoryId: cat.id, sortOrder: 20 },
      { slug: "soon", titleEn: "Cinema", titleAr: "سينما", status: "coming_soon", categoryId: cat.id, sortOrder: 10 },
      { slug: "secret", titleEn: "Secret", titleAr: "سري", status: "hidden", categoryId: cat.id },
    ])
    .returning();
  const pkg = await db
    .insert(packages)
    .values([
      { slug: "visible-pkg", nameEn: "Visible", nameAr: "ظاهر", status: "available", pricingMode: "fixed", price: "1000" },
      { slug: "hidden-pkg", nameEn: "Hidden", nameAr: "مخفي", status: "hidden" },
    ])
    .returning();
  await db.insert(packageSolutions).values([
    { packageId: pkg[0].id, solutionId: sol[0].id },
    { packageId: pkg[1].id, solutionId: sol[0].id },
    { packageId: pkg[0].id, solutionId: sol[2].id },
  ]);
  const past = new Date(Date.now() - 60_000);
  const future = new Date(Date.now() + 86_400_000);
  await db.insert(articles).values([
    { slug: "published", titleEn: "Published", status: "published", publishedAt: past },
    { slug: "scheduled-past", titleEn: "Due", status: "scheduled", publishedAt: past },
    { slug: "scheduled-future", titleEn: "Later", status: "scheduled", publishedAt: future },
    { slug: "draft", titleEn: "Draft", status: "draft", publishedAt: past },
    { slug: "hidden", titleEn: "Hidden", status: "hidden", publishedAt: past },
  ]);
  ids = { lit: sol[0].id, secret: sol[2].id, visible: pkg[0].id, hidden: pkg[1].id };
});

afterAll(async () => {
  await closeDb();
});

describe("public catalog", () => {
  it("never exposes hidden solutions or packages", async () => {
    const c = await queryCatalog();
    expect(c.solutions.map((s) => s.slug)).toEqual(["soon", "lit"]);
    expect(c.packages.map((p) => p.slug)).toEqual(["visible-pkg"]);
  });
  it("only links visible packages/solutions to each other", async () => {
    const c = await queryCatalog();
    const lit = c.solutions.find((s) => s.slug === "lit")!;
    expect(lit.packageIds).toEqual([ids.visible]);
    const pkg = c.packages[0];
    expect(pkg.solutionIds).toEqual([ids.lit]);
  });
  it("returns JSON-safe values (cacheable)", async () => {
    const c = await queryCatalog();
    expect(JSON.parse(JSON.stringify(c))).toEqual(c);
    expect(c.packages[0].price).toBe("1000.00");
  });
});

describe("articles", () => {
  it("publishes scheduled articles only after their publish time", async () => {
    const list = await queryArticles();
    expect(list.map((a) => a.slug).sort()).toEqual(["published", "scheduled-past"]);
  });
});

describe("settings", () => {
  it("returns defaults on an empty database", async () => {
    const s = await querySettings();
    expect(s.general.companyNameEn).toBe("ABCARINO");
  });
});
