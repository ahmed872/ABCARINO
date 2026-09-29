import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { globSync } from "node:fs";

/**
 * Every export of a "use server" file is a network endpoint. This static check
 * fails if an exported server action does not authorize itself before doing
 * anything — regression guard for the unauthenticated `mediaUsage` action.
 */
const PUBLIC_ACTIONS = new Set(["submitLead", "login", "logout"]);

const files = globSync("src/**/*.ts", { cwd: path.resolve(__dirname, "../..") })
  .map((f) => path.resolve(__dirname, "../..", f))
  .filter((f) => /^\s*["']use server["']/m.test(readFileSync(f, "utf8").split("\n").slice(0, 3).join("\n")));

describe("server action guards", () => {
  it("finds the server action files", () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const exports = [...src.matchAll(/export\s+async\s+function\s+(\w+)\s*\(/g)];
    for (const m of exports) {
      const name = m[1];
      if (PUBLIC_ACTIONS.has(name)) continue;
      it(`${path.relative(process.cwd(), file)} → ${name} authorizes first`, () => {
        const body = src.slice(m.index!, src.indexOf("\nexport ", m.index! + 1) === -1 ? undefined : src.indexOf("\nexport ", m.index! + 1));
        const firstStatements = body.split("\n").slice(1, 4).join("\n");
        expect(firstStatements).toMatch(/await requireUser\(|adminAction\(/);
      });
    }
    it(`${path.relative(process.cwd(), file)} exports only functions`, () => {
      expect(src).not.toMatch(/^export\s+(const|let|var|class)\s/m);
    });
  }
});
