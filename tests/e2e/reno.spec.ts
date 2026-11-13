/**
 * RENO: arrival intro (session rules, skip, Esc, reduced motion), the companion on every
 * public page, the local FAQ engine through the real UI, keyboard use, mobile layout.
 */
import { expect, test, type Page } from "@playwright/test";
import { callAction, form } from "./support/server-actions";
import { userWithSession } from "./support/db";
import { RENO_FAQ } from "../../src/content/reno/faq";

const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
};
const launcher = (page: Page) => page.locator(".reno-launch");

test.describe("RENO arrival intro", () => {
  test("plays once per session on the home page, then RENO docks", async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto("/en?reno-intro=auto");
    const intro = page.getByRole("dialog", { name: "RENO arrives from the future" });
    await expect(intro).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip intro" })).toBeFocused();
    await expect(intro.locator(".reno-year")).toHaveText("2186");
    // The page underneath is fully rendered: the intro never replaces content.
    expect(await page.locator("main h1").count()).toBe(1);
    await expect(intro.locator(".reno-year")).toHaveText("2026", { timeout: 6_000 });
    await expect(intro).toBeHidden({ timeout: 6_000 });
    await expect(launcher(page)).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("reno:intro"))).toBe("seen");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

    // Same session: neither a reload nor another page replays it.
    await page.goto("/en?reno-intro=auto");
    await expect(launcher(page)).toBeVisible();
    await expect(page.locator(".reno-intro")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("Skip and Esc end it immediately and are remembered", async ({ page, browser }) => {
    await page.goto("/ar?reno-intro=auto");
    const skip = page.getByRole("button", { name: "تخطّي المقدمة" });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(page.locator(".reno-intro")).toHaveCount(0, { timeout: 2_000 });
    expect(await page.evaluate(() => sessionStorage.getItem("reno:intro"))).toBe("skipped");

    const ctx = await browser.newContext();
    const p2 = await ctx.newPage();
    await p2.goto("/en?reno-intro=auto");
    await expect(p2.locator(".reno-intro")).toBeVisible();
    await p2.keyboard.press("Escape");
    await expect(p2.locator(".reno-intro")).toHaveCount(0, { timeout: 2_000 });
    await ctx.close();
  });

  test("does not play when landing on an inner page", async ({ page }) => {
    await page.goto("/en/about?reno-intro=auto");
    await expect(launcher(page)).toBeVisible();
    await expect(page.locator(".reno-intro")).toHaveCount(0);
  });

  test("reduced motion gets a short, still arrival", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/en?reno-intro=auto");
    const intro = page.locator(".reno-intro");
    await expect(intro).toHaveAttribute("data-reduced", "true");
    await expect(intro.locator(".reno-year")).toHaveText("2026");
    await expect(intro).toHaveCount(0, { timeout: 3_000 });
    await ctx.close();
  });

  test("automated browsers skip it unless asked", async ({ page }) => {
    await page.goto("/en");
    await expect(launcher(page)).toBeVisible();
    await expect(page.locator(".reno-intro")).toHaveCount(0);
  });
});

test.describe("RENO companion & FAQ", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("is on every public page and never in the admin", async ({ page }) => {
    for (const path of ["/en", "/ar", "/en/solutions", "/ar/about", "/en/contact", "/en/faq", "/ar/faq"]) {
      await page.goto(path);
      await expect(launcher(page), path).toBeVisible();
    }
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");
    await expect(launcher(page)).toHaveCount(0);
  });

  test("answers from the knowledge base: chips, alternative wording, Arabic spellings, unknowns", async ({ page }) => {
    const admin = await userWithSession("super_admin");
    await callAction("saveSettings", ["contact", { ok: false }, form({ whatsappNumber: "+20 100 000 0000", email: "hello@abcarino.test" })], { cookie: admin.cookie, path: "/admin/settings" });
    const errors = errorsOf(page);
    await page.goto("/en/solutions");
    await launcher(page).click();
    const panel = page.getByRole("dialog", { name: "RENO, ABCARINO's guide" });
    await expect(panel).toContainText("Hey! I'm RENO. I came all the way from the future to help you.");
    await expect(panel.getByRole("textbox", { name: "Ask RENO a question" })).toBeFocused();

    // Topic chips.
    await panel.getByRole("button", { name: "Smart home", exact: true }).click();
    await panel.getByRole("button", { name: "Can I control the lights from my phone?" }).click();
    const answer = panel.locator('[data-faq="lighting-app"]');
    await expect(answer).toContainText("app and voice control");
    await expect(answer.getByRole("link", { name: /Smart Lighting/ })).toHaveAttribute("href", "/en/solutions/smart-lighting");

    // Free text, different wording.
    await panel.getByRole("textbox").fill("do you build websites for companies");
    await panel.getByRole("textbox").press("Enter");
    await expect(panel.locator('[data-faq="websites-apps"]')).toBeVisible();

    // Unknown → honest fallback with the site's own WhatsApp link.
    await panel.getByRole("textbox").fill("do you sell pizza");
    await panel.getByRole("button", { name: "Send" }).click();
    const unknown = panel.locator('[data-kind="unknown"]');
    await expect(unknown).toContainText("I don't have that information in my knowledge base yet.");
    await expect(unknown.getByRole("link", { name: "Message the team on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/201000000000/);
    expect(errors).toEqual([]);
  });

  test("Arabic: RTL panel, dialect and spelling variants", async ({ page }) => {
    await page.goto("/ar");
    await launcher(page).click();
    const panel = page.getByRole("dialog", { name: "رينو، مرشد عبقرينو" });
    await expect(panel).toContainText("أهلاً! أنا رينو");
    expect(await panel.evaluate((el) => getComputedStyle(el).direction)).toBe("rtl");
    await panel.getByRole("textbox").fill("يعنى ايه سمارت هوم");
    await panel.getByRole("textbox").press("Enter");
    await expect(panel.locator('[data-faq="smart-home"]')).toContainText("المنزل الذكي مش مجموعة أجهزة");
    await panel.getByRole("textbox").fill("بتشتغلوا في اسكندرية؟");
    await panel.getByRole("textbox").press("Enter");
    const suggest = panel.locator('[data-kind="suggest"]');
    await expect(suggest).toContainText("تقصد سؤال من دول");
    await suggest.getByRole("button", { name: "بتشتغلوا فين؟" }).click();
    await expect(panel.locator('[data-faq="where"]')).toBeVisible();
  });

  test("keeps the conversation when closed, reopened and across pages", async ({ page }) => {
    await page.goto("/en");
    await launcher(page).click();
    await page.getByRole("textbox", { name: "Ask RENO a question" }).fill("home cinema");
    await page.getByRole("textbox", { name: "Ask RENO a question" }).press("Enter");
    const answer = page.locator('[data-faq="home-cinema"]');
    await expect(answer).toBeVisible();
    await page.getByRole("button", { name: "Close" }).first().click();
    await expect(page.locator(".reno-panel")).toHaveCount(0);
    await launcher(page).click();
    await expect(answer).toBeVisible();
    // Follow the answer's link (client-side navigation), then a full reload.
    await answer.getByRole("link", { name: /Home Cinema/ }).click();
    await expect(page).toHaveURL(/\/en\/solutions\/home-cinema$/);
    await page.reload();
    await launcher(page).click();
    await expect(page.locator('[data-faq="home-cinema"]')).toBeVisible();
    // Regression: on a 720px-tall window the panel top used to sit under the sticky header.
    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.locator('[data-faq="home-cinema"]')).toHaveCount(0);
  });

  test("works from the keyboard and returns focus", async ({ page }) => {
    await page.goto("/en/about");
    await launcher(page).focus();
    await page.keyboard.press("Enter");
    const input = page.getByRole("textbox", { name: "Ask RENO a question" });
    await expect(input).toBeFocused();
    await expect(launcher(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.type("how do I request a quote");
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-faq="quote"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".reno-panel")).toHaveCount(0);
    await expect(launcher(page)).toBeFocused();
    await expect(launcher(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile: clear of the WhatsApp button, panel fits, no sideways scroll", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    for (const path of ["/en", "/ar"]) {
      await page.goto(path);
      const reno = await launcher(page).boundingBox();
      const wa = await page.locator("a[href^='https://wa.me/']").last().boundingBox();
      expect(reno, path).not.toBeNull();
      if (wa && reno) {
        const overlap = reno.x < wa.x + wa.width && wa.x < reno.x + reno.width && reno.y < wa.y + wa.height && wa.y < reno.y + reno.height;
        expect(overlap, path).toBe(false);
      }
      await launcher(page).click();
      const panel = await page.locator(".reno-panel").boundingBox();
      expect(panel!.x).toBeGreaterThanOrEqual(0);
      expect(panel!.x + panel!.width).toBeLessThanOrEqual(360);
      expect(panel!.y).toBeGreaterThanOrEqual(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    }
    await ctx.close();
  });

  test("survives corrupted or tampered session data", async ({ page }) => {
    const errors = errorsOf(page);
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "reno:chat:en",
        JSON.stringify([
          { id: 1, from: "reno", kind: "answer", faqId: "about" }, // missing suggestionIds
          { id: "x", from: "user", text: "<b>hi</b>" },
          { id: 2, from: "reno", kind: "answer", faqId: "does-not-exist", suggestionIds: ["nope"] },
          { id: 3, from: "user", text: { evil: true } },
          null,
        ]),
      );
      sessionStorage.setItem("reno:chat:ar", "{not json");
    });
    for (const path of ["/en", "/ar"]) {
      await page.goto(path);
      await launcher(page).click();
      await expect(page.locator(".reno-panel")).toBeVisible();
      await page.getByRole("textbox").fill("home cinema");
      await page.getByRole("textbox").press("Enter");
      await expect(page.locator('[data-faq="home-cinema"]')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("if RENO's code fails to load, he disappears and the page stays", async ({ page }) => {
    // Simulates a flaky network / blocked script: abort the lazily loaded chunk that contains RENO.
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes("reno-launch")) return route.abort("failed");
      return route.fulfill({ response: res, body });
    });
    await page.goto("/en");
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(launcher(page)).toHaveCount(0);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText("Something went wrong.")).toHaveCount(0);
    await expect(page.getByText("We’ll be right back.")).toHaveCount(0);
  });

  test("treats typed HTML as plain text", async ({ page }) => {
    let dialog = false;
    page.on("dialog", (d) => { dialog = true; void d.dismiss(); });
    await page.goto("/en");
    await launcher(page).click();
    const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    await page.getByRole("textbox").fill(payload);
    await page.getByRole("textbox").press("Enter");
    await expect(page.locator('.reno-msg[data-from="user"]').last()).toContainText(payload);
    expect(await page.locator(".reno-panel img, .reno-panel script").count()).toBe(0);
    expect(dialog).toBe(false);
  });

  test("touch: the open mobile menu covers RENO, and opening the panel doesn't pop the keyboard", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/en");
    await expect(launcher(page)).toBeVisible();
    await page.getByRole("button", { name: /menu/i }).first().click();
    const box = (await launcher(page).boundingBox())!;
    const topmost = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest(".reno-launch") !== null, [box.x + box.width / 2, box.y + box.height / 2]);
    expect(topmost).toBe(false);
    await page.goto("/en/about");
    await launcher(page).tap();
    await expect(page.locator(".reno-panel")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Ask RENO a question" })).not.toBeFocused();
    await expect(page.locator(".reno-panel")).toBeFocused();
    await ctx.close();
  });

  test("the FAQ page lists every visible question for search engines", async ({ page }) => {
    await page.goto("/en/faq");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Questions & answers");
    for (const f of RENO_FAQ.filter((x) => !x.hidden)) {
      await expect(page.locator(`#q-${f.id} h3`)).toHaveText(f.questions.en[0]);
    }
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/en/faq</loc>");
    expect(sitemap).toContain("/ar/faq</loc>");
  });
});
