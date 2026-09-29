import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Best-effort client IP.
 * With TRUST_PROXY=true we read X-Real-IP (set by nginx/Caddy) or the right-most
 * X-Forwarded-For entry added by the trusted proxy. Otherwise we do not trust
 * client-supplied forwarding headers at all.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  if (env().TRUST_PROXY) {
    const real = h.get("x-real-ip");
    if (real) return real.trim();
    const xff = h.get("x-forwarded-for");
    if (xff) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
  }
  const xff = h.get("x-forwarded-for");
  // Next.js' own server records the socket address as the last hop.
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return (h.get("user-agent") ?? "").slice(0, 400);
}

export function hashIp(ip: string): string {
  return createHmac("sha256", env().APP_SECRET).update(ip).digest("hex").slice(0, 32);
}

/** Same-origin check for route handlers that mutate state (server actions do this natively). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
