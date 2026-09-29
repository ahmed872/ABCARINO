/**
 * Authentication lifecycle, lockout / rate limiting and CSRF — exercised
 * against the real login action, session layer and database.
 */
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword } from "../../src/lib/auth/password";
import { BASE_URL, callAction, form } from "./support/server-actions";
import { makeSolution, sql } from "./support/db";

const PASSWORD = "Harbor-Lantern-Quartz-58";

async function makeAccount(role = "editor") {
  const email = `auth-${randomUUID().slice(0, 8)}@abcarino.test`;
  await sql`insert into users (email, name, password_hash, role) values (${email}, 'Auth Test', ${await hashPassword(PASSWORD)}, ${role})`;
  return email;
}

/** Log in through the real server action; returns the session cookie pair ("name=value") or null. */
async function login(email: string, password: string, headers: Record<string, string> = {}) {
  const r = await callAction("login", [{}, form({ email, password })], { path: "/admin/login", headers });
  const raw = r.setCookies.find((c) => c.startsWith("abc_session="));
  return { r, raw, cookie: raw ? raw.split(";")[0] : null, error: (r.result as { error?: string } | undefined)?.error };
}

const isSignedIn = async (cookie: string) => (await fetch(`${BASE_URL}/admin`, { headers: { Cookie: cookie }, redirect: "manual" })).status === 200;

test.describe("authentication lifecycle", () => {
  test("valid login creates a hardened session cookie and a DB session", async () => {
    const email = await makeAccount();
    const { r, raw, cookie } = await login(email, PASSWORD);
    expect(r.redirect).toMatch(/^\/admin/);
    expect(raw).toBeTruthy();
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=lax/i);
    expect(raw).toMatch(/Path=\//);
    const expires = new Date(/Expires=([^;]+)/i.exec(raw!)![1]).getTime();
    expect(expires - Date.now()).toBeGreaterThan(6.9 * 86_400_000);
    expect(expires - Date.now()).toBeLessThan(7.1 * 86_400_000);
    // The DB never stores the raw token, only its SHA-256.
    const token = cookie!.split("=")[1];
    expect(await sql`select 1 from sessions where id = ${token}`).toHaveLength(0);
    expect(await isSignedIn(cookie!)).toBe(true);
  });

  test("bad credentials never create a session and reveal nothing", async () => {
    const email = await makeAccount();
    const cases: Array<[string, string]> = [
      [email, "wrong-password-123"],
      ["nobody-" + email, PASSWORD],
      ["", ""],
      ["   ", "   "],
      [email.toUpperCase(), "wrong-password-123"],
      ["x".repeat(50_000), "y".repeat(50_000)],
      ["' OR 1=1 --", "' OR 1=1 --"],
    ];
    for (const [e, p] of cases) {
      const { raw, error } = await login(e, p);
      expect(raw, `no cookie for ${e.slice(0, 20)}`).toBeUndefined();
      expect(["Incorrect email or password.", "Enter your email and password."]).toContain(error);
    }
    // Email matching is case-insensitive (stored lowercase).
    expect((await login(email.toUpperCase(), PASSWORD)).cookie).toBeTruthy();
  });

  test("malformed login payloads fail safely without leaking internals", async () => {
    for (const args of [[{}, "not-a-form"], [null, null], [{}, { email: ["a"], password: { x: 1 } }]]) {
      const r = await callAction("login", args, { path: "/admin/login" });
      expect(r.setCookies.some((c) => c.startsWith("abc_session="))).toBe(false);
      expect(r.body).not.toMatch(/node_modules|\/home\/|at [\w.]+ \(|postgres|drizzle|scrypt/i);
    }
  });

  test("responses never expose password hashes or session tokens", async () => {
    const email = await makeAccount("super_admin");
    const { cookie } = await login(email, PASSWORD);
    const token = cookie!.split("=")[1];
    for (const path of ["/admin", "/admin/users", "/admin/account", "/admin/activity"]) {
      const html = await (await fetch(`${BASE_URL}${path}`, { headers: { Cookie: cookie! } })).text();
      expect(html, path).not.toContain("scrypt$");
      expect(html, path).not.toContain(token);
    }
  });

  test("logout destroys the server-side session (replay fails)", async () => {
    const email = await makeAccount();
    const { cookie } = await login(email, PASSWORD);
    const r = await callAction("logout", [], { cookie: cookie!, path: "/admin" });
    expect(r.setCookies.join(";")).toMatch(/abc_session=;|abc_session=.*Expires=Thu, 01 Jan 1970/i);
    expect(await isSignedIn(cookie!)).toBe(false);
  });

  test("password change keeps the current session and revokes all others", async () => {
    const email = await makeAccount();
    const a = (await login(email, PASSWORD)).cookie!;
    const b = (await login(email, PASSWORD)).cookie!;
    const wrong = await callAction("changeOwnPassword", [{ ok: false }, form({ current: "nope-nope", next: "Velvet-Comet-Ridge-71", confirm: "Velvet-Comet-Ridge-71" })], { cookie: a, path: "/admin/account" });
    expect((wrong.result as { errors?: Record<string, string> }).errors?.current).toBeTruthy();
    const weak = await callAction("changeOwnPassword", [{ ok: false }, form({ current: PASSWORD, next: "short", confirm: "short" })], { cookie: a, path: "/admin/account" });
    expect((weak.result as { errors?: Record<string, string> }).errors?.next).toBeTruthy();
    const ok = await callAction("changeOwnPassword", [{ ok: false }, form({ current: PASSWORD, next: "Velvet-Comet-Ridge-71", confirm: "Velvet-Comet-Ridge-71" })], { cookie: a, path: "/admin/account" });
    expect((ok.result as { ok: boolean }).ok).toBe(true);
    expect(await isSignedIn(a)).toBe(true);
    expect(await isSignedIn(b)).toBe(false);
    expect((await login(email, PASSWORD)).cookie).toBeNull();
    expect((await login(email, "Velvet-Comet-Ridge-71")).cookie).toBeTruthy();
  });

  test("deactivated accounts cannot log in and lose existing sessions", async () => {
    const email = await makeAccount();
    const { cookie } = await login(email, PASSWORD);
    await sql`update users set is_active = false where email = ${email}`;
    expect(await isSignedIn(cookie!)).toBe(false);
    expect((await login(email, PASSWORD)).error).toBe("Incorrect email or password.");
  });

  test("sessions expire (absolute) and time out when idle", async () => {
    const email = await makeAccount();
    const s1 = (await login(email, PASSWORD)).cookie!;
    const s2 = (await login(email, PASSWORD)).cookie!;
    const [u] = await sql`select id from users where email = ${email}`;
    const rows = await sql`select id from sessions where user_id = ${u.id} order by created_at`;
    await sql`update sessions set expires_at = now() - interval '1 minute' where id = ${rows[0].id}`;
    await sql`update sessions set last_seen_at = now() - interval '25 hours' where id = ${rows[1].id}`;
    expect(await isSignedIn(s1)).toBe(false);
    expect(await isSignedIn(s2)).toBe(false);
    // Idle sessions are deleted server-side when detected.
    expect(await sql`select 1 from sessions where id = ${rows[1].id}`).toHaveLength(0);
  });
});

test.describe("brute-force protection", () => {
  test("8 failures lock the account — even the correct password is refused — then it unlocks", async () => {
    const email = await makeAccount();
    for (let i = 0; i < 8; i++) expect((await login(email, `wrong-${i}-password`)).error).toBe("Incorrect email or password.");
    const blocked = await login(email, PASSWORD);
    expect(blocked.cookie).toBeNull();
    expect(blocked.error).toMatch(/^Too many attempts/);
    const [u] = await sql`select failed_login_count, locked_until from users where email = ${email}`;
    expect(u.failed_login_count).toBe(8);
    expect(u.locked_until).not.toBeNull();
    // Rotating spoofed IP headers does not help: the limit is per account.
    for (let i = 0; i < 3; i++) {
      expect((await login(email, PASSWORD, { "X-Forwarded-For": `203.0.113.${i}`, "X-Real-IP": `198.51.100.${i}` })).cookie).toBeNull();
    }
    // Other accounts are unaffected while this one is locked.
    const other = await makeAccount();
    expect((await login(other, PASSWORD)).cookie).toBeTruthy();
    // Lock window in tests is 3 s (AUTH_LOCKOUT_MINUTES=0.05; production default 15 min).
    await new Promise((r) => setTimeout(r, 3500));
    expect((await login(email, PASSWORD)).cookie).toBeTruthy();
    const [after] = await sql`select failed_login_count, locked_until from users where email = ${email}`;
    expect(after.failed_login_count).toBe(0);
    expect(after.locked_until).toBeNull();
  });

  test("locked accounts and unknown emails behave identically for the whole lock window (no enumeration)", async () => {
    const email = await makeAccount();
    const ghost = `ghost-${randomUUID().slice(0, 6)}@abcarino.test`;
    // Attack both accounts at the same moments, spreading failures over ~1 s so the
    // old implementation's gap (rate window ends before the DB lock) would be visible.
    for (let i = 0; i < 8; i++) {
      await Promise.all([login(email, `wrong-${i}`), login(ghost, `wrong-${i}`)]);
      await new Promise((r) => setTimeout(r, 150));
    }
    const t0 = Date.now();
    const diffs: string[] = [];
    // Lock is 3 s in tests: sample while locked (incl. the old gap at ~2–3 s) and after expiry;
    // skip ±0.3 s around the expiry instant, where both unlock within milliseconds of each other.
    for (const offset of [150, 700, 1300, 1900, 2200, 2500, 2700, 3500, 3900]) {
      const wait = t0 + offset - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const [a, b] = await Promise.all([login(email, "still-wrong"), login(ghost, "still-wrong")]);
      if (a.error !== b.error) diffs.push(`+${offset}ms: existing="${a.error}" unknown="${b.error}"`);
    }
    expect(diffs).toEqual([]);
  });

  test("per-IP limit: 20 attempts per window from one address", async () => {
    const ip = { "X-Forwarded-For": "192.0.2.77" };
    const results: string[] = [];
    for (let i = 0; i < 21; i++) results.push((await login(`spray-${i}@abcarino.test`, "Password-Spray-1", ip)).error ?? "");
    expect(results.slice(0, 20).every((e) => e === "Incorrect email or password.")).toBe(true);
    expect(results[20]).toMatch(/^Too many attempts/);
    // LIMITATION (documented): without a trusted proxy, the client-supplied
    // X-Forwarded-For decides the "IP", so rotating it resets the per-IP limit.
    // Per-account limits and lockout still apply.
    expect((await login("spray-x@abcarino.test", "Password-Spray-1", { "X-Forwarded-For": "192.0.2.78" })).error).toBe("Incorrect email or password.");
    await new Promise((r) => setTimeout(r, 3200));
  });
});

test.describe("CSRF / cross-origin requests", () => {
  test("state-changing actions are rejected from a foreign Origin, even with a valid admin cookie", async () => {
    const email = await makeAccount("super_admin");
    const { cookie } = await login(email, PASSWORD);
    const s = await makeSolution();
    for (const origin of ["https://evil.example", "http://localhost.evil.example", "null"]) {
      const r = await callAction("setSolutionStatus", [s.id, "hidden"], { cookie: cookie!, origin });
      expect(r.status, origin).toBeGreaterThanOrEqual(400);
    }
    const r2 = await callAction("deleteSolution", [s.id], { cookie: cookie!, origin: "https://evil.example" });
    expect(r2.status).toBeGreaterThanOrEqual(400);
    expect((await sql`select status from solutions where id = ${s.id}`)[0].status).toBe("available");
    // Same request from the site's own origin works (proves the rejection is origin-based).
    await callAction("setSolutionStatus", [s.id, "hidden"], { cookie: cookie! });
    expect((await sql`select status from solutions where id = ${s.id}`)[0].status).toBe("hidden");
  });

  test("login is also origin-checked", async () => {
    const email = await makeAccount();
    const r = await callAction("login", [{}, form({ email, password: PASSWORD })], { path: "/admin/login", origin: "https://evil.example" });
    expect(r.setCookies.some((c) => c.startsWith("abc_session="))).toBe(false);
  });

  test("a real cross-site HTML form cannot log the victim out", async ({ browser }) => {
    const email = await makeAccount();
    const { cookie } = await login(email, PASSWORD);
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const [name, value] = cookie!.split("=");
    await ctx.addCookies([{ name, value, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
    const logoutId = (await import("./support/server-actions")).findAction("logout").id;
    const page = await ctx.newPage();
    await page.route("https://evil.example/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<form id=f method=POST action="${BASE_URL}/admin" enctype="multipart/form-data"><input name="$ACTION_ID_${logoutId}" value=""></form><script>document.getElementById('f').submit()</script>`,
      }),
    );
    await page.goto("https://evil.example/");
    await page.waitForLoadState("networkidle");
    expect(await isSignedIn(cookie!)).toBe(true);
    await ctx.close();
  });
});
