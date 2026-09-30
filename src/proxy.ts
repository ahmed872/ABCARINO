import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, negotiateLocale } from "@/lib/i18n/config";
import { sessionCookieName } from "@/lib/auth/cookie";
import { blobConfigured } from "@/lib/blob-config";
import { isHttpsProduction } from "@/lib/site-url";

/**
 * Runs before routing:
 *  1. Adds a per-request nonce-based Content-Security-Policy.
 *  2. Redirects locale-less public paths (e.g. /solutions) to /en or /ar.
 *  3. Optimistically bounces signed-out visitors away from /admin.
 *     (Real authorization happens server-side in every page and action.)
 */
const RESERVED = new Set(["admin", "api", "media", "brand", "_next"]);

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used by React/SVG; scripts remain nonce-locked.
    "style-src 'self' 'unsafe-inline'",
    // Uploaded media lives on Vercel Blob only when a Blob store is configured.
    `img-src 'self' blob: data:${blobConfigured() ? " https://*.public.blob.vercel-storage.com" : ""}`,
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttpsProduction() ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  // Locale-less public URL → redirect to preferred locale.
  if (first && !isLocale(first) && !RESERVED.has(first)) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  if (first === "admin" && pathname !== "/admin/login" && !request.cookies.has(sessionCookieName())) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // Decided at runtime (not in next.config, whose headers are frozen at build time,
  // when APP_URL is typically unknown — e.g. Docker builds).
  if (isHttpsProduction()) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  if (first === "admin") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|media|brand|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
