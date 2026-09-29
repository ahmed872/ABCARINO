/**
 * Invoke Next.js server actions over HTTP exactly like the browser does:
 * same action ID (from the production build's manifest), same `Next-Action`
 * header and the same React reply encoding. This lets tests attack the real
 * server boundary instead of clicking through the UI.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(`${process.cwd()}/package.json`);
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node") as {
  encodeReply: (value: unknown) => Promise<string | FormData>;
};

export const BASE_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;

type ManifestEntry = { exportedName: string; filename: string; workers: Record<string, unknown> };

export function actionManifest(): Record<string, ManifestEntry> {
  return JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
}

function workerToPath(worker: string): string {
  let p = worker.replace(/^app/, "").replace(/\/page$/, "").replace(/\/\([^)]+\)/g, "");
  p = p.replace("[locale]", "en");
  return p || "/";
}

export function findAction(name: string): { id: string; path: string } {
  const m = actionManifest();
  const id = Object.keys(m).find((k) => m[k].exportedName === name);
  if (!id) throw new Error(`Server action "${name}" not found in the build manifest`);
  const workers = Object.keys(m[id].workers);
  const worker = workers.find((w) => !w.includes("[id]") && !w.includes("[slug]")) ?? workers[0];
  return { id, path: workerToPath(worker).replace("[id]", "00000000-0000-4000-8000-000000000000") };
}

export type ActionResponse = {
  status: number;
  body: string;
  /** Decoded return value (flight row 1) when the action completed normally. */
  result: unknown;
  /** True when the server reported an error instead of a return value. */
  errored: boolean;
  redirect: string | null;
  setCookies: string[];
};

export async function callAction(
  name: string,
  args: unknown[],
  opts: { cookie?: string; origin?: string | null; path?: string; headers?: Record<string, string> } = {},
): Promise<ActionResponse> {
  const { id, path } = findAction(name);
  const encoded = await encodeReply(args);
  const headers: Record<string, string> = { "Next-Action": id, Accept: "text/x-component" };
  if (opts.origin !== null) headers.Origin = opts.origin ?? BASE_URL;
  if (opts.cookie) headers.Cookie = opts.cookie;
  Object.assign(headers, opts.headers ?? {});
  let body: string | FormData;
  if (typeof encoded === "string") {
    headers["Content-Type"] = "text/plain;charset=UTF-8";
    body = encoded;
  } else {
    body = encoded;
  }
  const res = await fetch(BASE_URL + (opts.path ?? path), { method: "POST", headers, body, redirect: "manual" });
  const text = await res.text();
  const row = text.split("\n").find((l) => l.startsWith("1:"));
  let result: unknown = undefined;
  let errored = res.status >= 400 || /^\d+:E/m.test(text);
  if (row && !row.startsWith("1:E")) {
    try {
      result = JSON.parse(row.slice(2));
    } catch {
      result = row.slice(2);
    }
  } else if (row?.startsWith("1:E")) {
    errored = true;
  }
  return { status: res.status, body: text, result, errored, redirect: res.headers.get("x-action-redirect") ?? res.headers.get("location"), setCookies: res.headers.getSetCookie() };
}

/** Build a FormData from a plain object (arrays become repeated fields). */
export function form(values: Record<string, string | string[] | boolean | number | undefined>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === false) continue;
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else fd.append(k, v === true ? "on" : String(v));
  }
  return fd;
}
