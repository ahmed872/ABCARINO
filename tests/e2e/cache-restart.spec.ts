/**
 * Regression: admin edits must survive a server restart even when no visitor
 * re-rendered the page in between (previously the on-disk data cache served the
 * old value for up to an hour). Starts and restarts its own production server.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { e2eEnv } from "../../playwright.config";
import { callAction, form } from "./support/server-actions";
import { sql, userWithSession } from "./support/db";

const PORT = 3101;
const BASE = `http://localhost:${PORT}`;

async function startServer(): Promise<ChildProcess> {
  const proc = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, ...e2eEnv, APP_URL: BASE }, stdio: "ignore", detached: true });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/robots.txt`)).ok) return proc;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}
async function stopServer(proc: ChildProcess) {
  process.kill(-proc.pid!, "SIGTERM");
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(`${BASE}/robots.txt`);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}
const heading = async () => /<h1[^>]*>([^<]*)/.exec(await (await fetch(`${BASE}/en`)).text())?.[1];

test("an admin edit made just before a restart is served after the restart", async () => {
  test.setTimeout(120_000);
  const admin = await userWithSession("super_admin");
  const save = (title: string) =>
    callAction("saveSettings", ["pages", { ok: false }, form({ heroTitleEn: title, heroTitleAr: "ع", heroSubtitleEn: "s", heroSubtitleAr: "s", statementEn: "s", statementAr: "s", aboutIntroEn: "s", aboutIntroAr: "s" })], { cookie: admin.cookie, path: "/admin/settings", base: BASE });
  await sql`delete from settings where key = 'pages'`;
  let server = await startServer();
  try {
    expect(await heading()).toBe("The future, made comfortable.");
    expect(await heading()).toBe("The future, made comfortable."); // now cached
    await save("Edited, then restarted");
    // No public request here on purpose.
    await stopServer(server);
    server = await startServer();
    expect(await heading()).toBe("Edited, then restarted");
    await save("Live edit after restart");
    expect(await heading()).toBe("Live edit after restart");
  } finally {
    await stopServer(server);
    await sql`delete from settings where key = 'pages'`;
  }
});
