/**
 * Public base URL of the site. Dependency-free so it can be used from
 * next.config.ts, proxy.ts and server code alike.
 * Order: APP_URL → Vercel production domain → Vercel deployment URL → localhost.
 */
export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const url = process.env.APP_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

/** True for production deployments served over HTTPS (enables HSTS, secure cookies…). */
export function isHttpsProduction(): boolean {
  return process.env.NODE_ENV === "production" && siteUrl().startsWith("https://");
}
