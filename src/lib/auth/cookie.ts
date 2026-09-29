/** Shared by proxy.ts (optimistic check) and the session module. */
export function sessionCookieName(): string {
  const secure = process.env.NODE_ENV === "production" && (process.env.APP_URL ?? "").startsWith("https://");
  return secure ? "__Host-abc_session" : "abc_session";
}

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Sessions idle longer than this are rejected even if not yet expired. */
export const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
